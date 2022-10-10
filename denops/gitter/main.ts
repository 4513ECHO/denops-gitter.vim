import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.2/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.8.2/autocmd/mod.ts";
import * as anonymous from "https://deno.land/x/denops_std@v3.8.2/anonymous/mod.ts";
import {
  assertString,
  ensureString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { chatMessagesStream } from "./stream.ts";
import { convertUriToId } from "./room.ts";
import { getRoomMessages, sendMedia, sendMessage } from "./message.ts";

export async function main(denops: Denops): Promise<void> {
  const [token] = await Promise.all([
    vars.g.get(denops, "gitter#token", ""),
  ]);
  denops.dispatcher = {
    async loadRoom(uri: unknown): Promise<void> {
      const controller = new AbortController();
      const [id] = anonymous.once(denops, () => controller.abort());
      const [bufnr, winid, roomId] = await Promise.all([
        denops.call("bufnr"),
        denops.call("win_getid"),
        convertUriToId(ensureString(uri), token),
      ]);

      if (!roomId) {
        await denops.call("gitter#util#warn", "roomId is not found");
        return;
      }

      // get room's message history at first
      const messages = await getRoomMessages(roomId, token, { limit: 100 });
      const entries = messages.map((msg) => {
        return {
          name: msg.fromUser.displayName,
          text: msg.text,
          sent: msg.sent,
        };
      });
      await denops.call("gitter#buffer#update", bufnr, entries);

      await Promise.all([
        vars.g.set(denops, "gitter#_parent_winid", winid),
        vars.b.set(denops, "_gitter", { bufnr, roomId, uri }),
        denops.cmd("normal! G"),
        autocmd.group(denops, "gitter_internal", (helper) => {
          helper.remove("*", `<buffer=${bufnr}>`);
          helper.define("TextChanged", `<buffer=${bufnr}>`, "normal! G");
          helper.define(
            "BufUnload",
            `<buffer=${bufnr}>`,
            `call denops#notify('${denops.name}', '${id}', [])`,
            { once: true },
          );
        }),
      ]);

      for await (
        const data of chatMessagesStream({
          roomId,
          token,
          signal: controller.signal,
        })
      ) {
        const { fromUser: { displayName: name }, text, sent } = data;
        await denops.call("gitter#buffer#update", bufnr, [{
          name,
          text,
          sent,
        }]);
      }
    },
    async sendMedia(roomId: unknown): Promise<void> {
      assertString(roomId);
      const file = await denops.call("input", "media: ", "", "file") as string;
      if (file) {
        const media = await Deno.readFile(
          await denops.call("expand", file) as string,
        );
        const resp = await sendMedia({ roomId, token, media });

        if (resp.status != 200) {
          await denops.cmd(
            `echo 'failed to upload media, response: ${await resp.text()}'`,
          );
        }
      }
    },
    async sendMessage(roomId: unknown, text: unknown): Promise<void> {
      await sendMessage({
        token,
        roomId: ensureString(roomId),
        text: ensureString(text),
      });
    },
  };
}
