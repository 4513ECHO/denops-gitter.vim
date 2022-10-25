import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import type { Message } from "./types.ts";
import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export async function renderMessages(
  denops: Denops,
  bufnr: number,
  messages: Message[],
): Promise<void> {
  await denops.call(
    "gitter#buffer#render_messages",
    bufnr,
    messages.map((msg) => ({
      username: msg.fromUser.displayName,
      text: msg.text,
      id: msg.id,
      thread: msg.threadMessageCount ?? 0,
      sent: datetime(msg.sent, { timezone: "UTC" })
        .toLocal()
        .format("YYYY-MM-dd HH:mm"),
    })),
  );
}

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// deno-lint-ignore require-await
export async function spinner<T>(
  denops: Denops,
  message: string,
  callback: () => T,
): Promise<T> {
  let count = 0;
  const timer = setInterval(async () => {
    await denops.cmd(
      "echo '[gitter]' spinner message .. '...'",
      { message, spinner: frames[count % frames.length] },
    );
    count++;
  }, 80);
  return Promise.resolve(callback())
    .then((value) => {
      clearInterval(timer);
      setTimeout(() => denops.cmd("echo '' | redraw"), 800);
      return value;
    });
}
