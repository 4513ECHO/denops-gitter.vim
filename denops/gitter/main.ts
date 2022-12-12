import type { Denops } from "https://deno.land/x/denops_std@v3.9.1/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.9.1/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.9.1/autocmd/mod.ts";
import * as anonymous from "https://deno.land/x/denops_std@v3.9.1/anonymous/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.9.1/batch/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.9.1/helper/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.9.1/function/mod.ts";
import {
  assertNumber,
  assertString,
  ensureString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { Gitter } from "./gitter/mod.ts";
import { renderMessages, spinner } from "./util.ts";

export async function main(denops: Denops): Promise<void> {
  let clientCache: Gitter;
  const ensureClient = async (): Promise<Gitter | null> => {
    if (clientCache) {
      return clientCache;
    }
    const token = await vars.g.get(denops, "gitter#token");
    console.log(`[gitter] token: ${token}`);
    if (typeof token !== "string" || !token) {
      await denops.call(
        "gitter#general#print_error",
        `Personal Access Token is invalid: ${token}`,
      );
      return null;
    }
    const client = clientCache = new Gitter(token);
    return client;
  };

  denops.dispatcher = {
    async loadRoom(
      uri: unknown,
      bufnr: unknown,
      winid: unknown,
    ): Promise<void> {
      const gitter = await ensureClient();
      if (!gitter) {
        return;
      }
      assertNumber(bufnr);
      const controller = new AbortController();
      const [id] = anonymous.once(denops, () => controller.abort());
      const roomId = await gitter.convertUriToId(ensureString(uri));

      if (!roomId) {
        await denops.call("gitter#general#print_error", "roomId is not found");
        return;
      }

      await batch.batch(denops, async (denops) => {
        await vars.b.set(denops, "_gitter", { roomId, uri, messages: [] });
        await vars.g.set(denops, "gitter#_parent_winid", winid);
        // get room's message history at first
        await spinner(denops, "Loading messages", async () => {
          await renderMessages(
            denops,
            bufnr,
            await gitter.getRoomMessages(roomId, { limit: 100 }),
          );
        });
        await denops.cmd("normal! Gz-");
        await denops.call(
          "gitter#general#add_buf_listener",
          bufnr,
          "gitter#general#goto_bottom",
        );
        if (denops.meta.host === "vim") {
          await denops.cmd("redraw");
        }
        await autocmd.group(denops, "gitter_internal", (helper) => {
          helper.remove("*", `<buffer=${bufnr}>`);
          helper.define(
            "WinClosed",
            `${winid}`,
            "unlet! g:gitter#_parent_winid",
            { once: true },
          );
          helper.define(
            "BufUnload",
            `<buffer=${bufnr}>`,
            `call denops#notify('${denops.name}', '${id}', [])`,
            { once: true },
          );
        });
      });

      try {
        for await (
          const message of gitter.chatMessagesStream({
            roomId,
            signal: controller.signal,
          })
        ) {
          if (message.parentId) {
            await denops.call(
              "gitter#renderer#message#increase_thread",
              bufnr,
              message.parentId,
            );
          } else {
            await renderMessages(denops, bufnr, [message]);
          }
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    },
    async sendMedia(roomId: unknown): Promise<void> {
      const gitter = await ensureClient();
      if (!gitter) {
        return;
      }
      assertString(roomId);
      const file = await helper.input(denops, {
        prompt: "media: ",
        completion: "file",
      });
      if (file) {
        const media = await Deno.readFile(
          ensureString(await fn.expand(denops, file)),
        );
        const resp = await spinner(
          denops,
          "Sending media",
          () => gitter.sendMedia({ roomId, media }),
        );

        if (resp.status != 200) {
          await denops.call(
            "gitter#general#print_error",
            `failed to upload media, response: ${await resp.text()}`,
          );
        }
      }
    },
    async sendMessage(roomId: unknown, text: unknown): Promise<void> {
      const gitter = await ensureClient();
      if (!gitter) {
        return;
      }
      assertString(roomId);
      assertString(text);
      await spinner(
        denops,
        "Sending message",
        () => gitter.sendMessage({ roomId, text }),
      );
    },
    async selectRooms(bufnr: unknown): Promise<void> {
      const gitter = await ensureClient();
      if (!gitter) {
        return;
      }
      await batch.batch(denops, async (denops) => {
        const rooms = await gitter.rooms();
        await spinner(
          denops,
          "Loading rooms",
          () => denops.call("gitter#renderer#rooms#render", bufnr, rooms),
        );
        await vars.b.set(denops, "_gitter", { rooms });
        if (denops.meta.host === "vim") {
          await denops.cmd("redraw");
        }
      });
    },
  };

  await Promise.resolve();
}
