import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.2/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.8.2/autocmd/mod.ts";
import * as anonymous from "https://deno.land/x/denops_std@v3.8.2/anonymous/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { chatMessagesStream } from "./stream.ts";
import { convertUriToId, getRoomMessages } from "./room.ts";
import { sendMessage } from "./message.ts";

export async function main(denops: Denops): Promise<void> {
  const [token] = await Promise.all([
    vars.g.get(denops, "gitter#token", ""),
  ]);
  denops.dispatcher = {
    async loadRoom(uri: unknown): Promise<void> {
      const controller = new AbortController();
      const [bufnr, winid, roomId] = await Promise.all([
        denops.call("bufnr"),
        denops.call("win_getid"),
        convertUriToId(ensureString(uri), token),
      ]);

      if (!roomId) {
        await denops.cmd("echo 'not found roomId'");
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

      const [stream] = await Promise.all([
        chatMessagesStream({
          roomId: roomId!, // TODO: handle null
          token,
          signal: controller.signal,
        }),
        vars.g.set(denops, "gitter#_parent_winid", winid),
        vars.b.set(denops, "_gitter", { bufnr, roomId, uri }),
      ]);
      const [id] = anonymous.add(denops, () => controller.abort());
      await autocmd.group(denops, "gitter_internal", (helper) => {
        helper.remove("*", `<buffer=${bufnr}>`);
        helper.define("TextChanged", `<buffer=${bufnr}>`, "normal! GGzb");
        helper.define(
          "BufUnload",
          `<buffer=${bufnr}>`,
          `call denops#notify('${denops.name}', '${id}', [])`,
          { once: true },
        );
      });
      for await (const data of stream) {
        const { fromUser: { displayName: name }, text, sent } = data;
        await denops.call("gitter#buffer#update", bufnr, [{
          name,
          text,
          sent,
        }]);
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
