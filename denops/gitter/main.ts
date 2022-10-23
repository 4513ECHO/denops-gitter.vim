import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.2/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.8.2/autocmd/mod.ts";
import * as anonymous from "https://deno.land/x/denops_std@v3.8.2/anonymous/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.8.2/batch/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.8.2/helper/mod.ts";
import {
  assertNumber,
  assertString,
  ensureString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { chatMessagesStream } from "./stream.ts";
import { convertUriToId, getRooms } from "./room.ts";
import { getRoomMessages, sendMedia, sendMessage } from "./message.ts";
import { renderMessages } from "./util.ts";

export async function main(denops: Denops): Promise<void> {
  const [token] = await Promise.all([
    vars.g.get(denops, "gitter#token"),
  ]);
  if (typeof token !== "string" || !token) {
    await denops.call(
      "gitter#util#warn",
      `Parsonal Access Token is invalid: ${token}`,
    );
    return;
  }
  denops.dispatcher = {
    async loadRoom(uri: unknown): Promise<void> {
      const controller = new AbortController();
      const [id] = anonymous.once(denops, () => controller.abort());
      const [bufnr, winid, roomId] = await Promise.all([
        denops.call("bufnr"),
        denops.call("win_getid"),
        convertUriToId(ensureString(uri), token),
      ]);
      assertNumber(bufnr);

      if (!roomId) {
        await denops.call("gitter#util#warn", "roomId is not found");
        return;
      }

      await batch.batch(denops, async (denops) => {
        await vars.b.set(denops, "_gitter", { roomId, uri, messages: [] });
        await vars.g.set(denops, "gitter#_parent_winid", winid);
      });
      // get room's message history at first
      await renderMessages(
        denops,
        bufnr,
        await getRoomMessages(roomId, token, { limit: 100 }),
      );

      await Promise.all([
        denops.cmd("normal! Gz-"),
        denops.meta.host === "vim" && denops.cmd("redraw"),
        denops.meta.host === "nvim"
          ? denops.call("gitter#buffer#attach_buf", bufnr)
          : denops.call("listener_add", "gitter#buffer#move_cursor", bufnr),
        autocmd.group(denops, "gitter_internal", (helper) => {
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
        }),
      ]);

      try {
        for await (
          const message of chatMessagesStream({
            roomId,
            token,
            signal: controller.signal,
          })
        ) {
          if (message.parentId) {
            await denops.call(
              "gitter#buffer#increment_thread",
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
      assertString(roomId);
      const file = await helper.input(denops, {
        prompt: "media: ",
        completion: "file",
      });
      if (file) {
        const media = await Deno.readFile(
          await denops.call("expand", file) as string,
        );
        const resp = await sendMedia({ roomId, token, media });

        if (resp.status != 200) {
          await denops.call(
            "gitter#util#warn",
            `failed to upload media, response: ${await resp.text()}`,
          );
        }
      }
    },
    async sendMessage(roomId: unknown, text: unknown): Promise<void> {
      assertString(roomId);
      assertString(text);
      await sendMessage({ token, roomId, text });
    },
    async selectRooms(): Promise<void> {
      const [bufnr, rooms] = await Promise.all([
        denops.call("bufnr"),
        getRooms(token),
      ]);
      await Promise.all([
        denops.call("gitter#buffer#render_rooms", bufnr, rooms),
        vars.b.set(denops, "_gitter", { rooms }),
      ]);
      if (denops.meta.host === "vim") {
        await denops.cmd("redraw");
      }
    },
  };
}
