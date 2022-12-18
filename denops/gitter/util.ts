import type { Denops } from "https://deno.land/x/denops_std@v3.10.2/mod.ts";
import type { Entry } from "./renderer.ts";
import type { Message } from "./gitter/types.ts";
import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export function entryFromMessage(message: Message): Entry {
  return {
    username: message.fromUser.displayName,
    text: message.text,
    id: message.id,
    thread: message.threadMessageCount ?? 0,
    sent: datetime(message.sent, { timezone: "UTC" })
      .toLocal()
      .format("YYYY-MM-dd HH:mm"),
  };
}

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

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
  return await Promise.resolve(callback())
    .then((value) => {
      clearInterval(timer);
      setTimeout(() => denops.cmd("echo '' | redraw"), 800);
      return value;
    })
    .catch((err) => {
      clearInterval(timer);
      throw err;
    });
}
