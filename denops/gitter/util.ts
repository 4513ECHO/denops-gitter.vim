import {
  type DateTime,
  datetime,
} from "https://deno.land/x/ptera@v1.0.2/mod.ts";

function isSameDay(a: DateTime, b: DateTime): boolean {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

export function formatTime(time: string): string {
  const date = datetime(time);
  const today = datetime();
  if (isSameDay(date, today)) {
    return date.format("HH:mm");
  } else if (date.year === today.year) {
    return date.format("MMM dd HH:mm");
  } else {
    return date.format("MMM dd YYYY HH:mm");
  }
}
