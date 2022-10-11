import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export function formatTime(time: string): string {
  return datetime(time, { timezone: "UTC" })
    .toLocal()
    .format("YYYY-MM-dd HH:mm");
}
