import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import type { Message } from "./types.d.ts";
import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export async function renderMessages(
  denops: Denops,
  bufnr: number,
  messages: Message[],
): Promise<void> {
  await denops.call(
    "gitter#buffer#update",
    bufnr,
    messages.map((msg) => ({
      displayName: msg.fromUser.displayName,
      text: msg.text,
      sent: datetime(msg.sent, { timezone: "UTC" })
        .toLocal()
        .format("YYYY-MM-dd HH:mm"),
    })),
  );
}
