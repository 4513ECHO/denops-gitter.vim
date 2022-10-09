import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.2/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.8.2/autocmd/mod.ts";
import * as anonymous from "https://deno.land/x/denops_std@v3.8.2/anonymous/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { chatMessagesStream } from "./stream.ts";
import { convertUriToId } from "./room.ts";
import { sendMessage } from "./message.ts";

export async function main(denops: Denops): Promise<void> {
  const [token] = await Promise.all([
    vars.g.get(denops, "gitter#token", ""),
  ]);
  denops.dispatcher = {
    async loadRoom(uri: unknown): Promise<void> {
      const controller = new AbortController();
      const [bufnr, roomId] = await Promise.all([
        denops.call("bufnr"),
        convertUriToId(ensureString(uri), token),
      ]);
      const [stream, ids] = await Promise.all([
        chatMessagesStream({
          roomId: roomId!, // TODO: handle null
          token,
          signal: controller.signal,
        }),
        anonymous.add(denops, () => controller.abort()),
        vars.b.set(denops, "_gitter", { bufnr, roomId, uri }),
      ]);
      await autocmd.group(denops, "gitter_internal", (helper) => {
        helper.remove("*", `<buffer=${bufnr}>`);
        helper.define(
          "BufUnload",
          `<buffer=${bufnr}>`,
          `call denops#notify('${denops.name}', '${ids[0]}', [])`,
          { once: true },
        );
      });
      for await (const data of stream) {
        const { fromUser: { displayName: name }, text } = data;
        await denops.call("gitter#buffer#update", bufnr, { name, text });
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
