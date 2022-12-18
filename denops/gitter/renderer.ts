import type { Denops } from "https://deno.land/x/denops_std@v3.10.2/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.10.2/function/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.10.2/variable/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.10.2/batch/mod.ts";
import { modifiable } from "https://deno.land/x/denops_std@v3.10.2/buffer/mod.ts";

/**
 * The result is a Number, which is the line number of the file
 * position given with {expr}.  The {expr} argument is a string.
 * The accepted positions are:
 *     .	    the cursor position
 *     $	    the last line in the current buffer
 *     'x	    position of mark x (if the mark is not set, 0 is
 * 	    returned)
 *     w0	    first line visible in current window (one if the
 * 	    display isn't updated, e.g. in silent Ex mode)
 *     w$	    last line visible in current window (this is one
 * 	    less than "w0" if no lines are visible)
 *     v	    In Visual mode: the start of the Visual area (the
 * 	    cursor is the end).  When not in Visual mode
 * 	    returns the cursor position.  Differs from |'<| in
 * 	    that it's updated right away.
 * Note that a mark in another file can be used.  The line number
 * then applies to another buffer.
 * To get the column number use |col()|.  To get both use
 * |getpos()|.
 * With the optional {winid} argument the values are obtained for
 * that window instead of the current window.
 * Returns 0 for invalid values of {expr} and {winid}.
 * Examples:
 * 	line(".")		line number of the cursor
 * 	line(".", winid)	idem, in window "winid"
 * 	line("'t")		line number of mark t
 * 	line("'" . marker)	line number of mark marker
 * To jump to the last known position when opening a file see
 * |last-position-jump|.
 * Can also be used as a |method|:
 * 	GetValue()->line()
 */
export async function line(
  denops: Denops,
  expr: string,
  winid?: number,
): Promise<number> {
  return await denops.call("line", expr, winid) as number;
}

export interface Entry {
  username: string;
  text: string;
  sent: string;
  id: string;
  thread: number;
  position?: {
    start: number;
    end: number;
    idx: number;
  };
}

export interface BufInfo {
  uri: string;
  messages: Entry[];
  roomId: string;
}

async function formatMessage(denops: Denops, entry: Entry): Promise<string[]> {
  return await denops.call("gitter#general#format_message", entry) as string[];
}

async function findById(
  denops: Denops,
  bufnr: number,
  id: string,
): Promise<Entry | undefined> {
  const messages = (await fn.getbufvar(denops, bufnr, "_gitter") as BufInfo)
    .messages.filter((v) => v.id === id);
  return messages[0];
}

export async function append(
  denops: Denops,
  bufnr: number,
  entries: Entry[],
): Promise<void> {
  const totalLines: string[] = [];
  const messages: Entry[] = [];
  const [winid, bufInfo] = await batch.gather(denops, async (denops) => {
    await vars.g.get(denops, "gitter#_parent_winid", 0);
    await fn.getbufvar(denops, bufnr, "_gitter");
  }) as [number, BufInfo];
  let presudoLastLnum: number = await line(denops, "$", winid);
  await modifiable(denops, bufnr, async () => {
    for (const entry of entries) {
      const lines = await formatMessage(denops, entry);
      messages.push({
        ...entry,
        position: {
          start: presudoLastLnum + 1,
          end: presudoLastLnum + lines.length,
          idx: bufInfo.messages.length + messages.length,
        },
      });
      totalLines.push(...lines);
      presudoLastLnum += lines.length;
    }
    const lastLnum = await denops.call("line", "$", winid) as number;
    await fn.setbufline(denops, bufnr, lastLnum + 1, totalLines);
    // update b:_gitter
    await fn.setbufvar(denops, bufnr, "_gitter", {
      ...bufInfo,
      messages: bufInfo.messages.concat(messages),
    });
  });
}

async function patchBufInfo(
  denops: Denops,
  bufnr: number,
  entry: Entry,
  newLength: number,
): Promise<void> {
  const diff = newLength - (entry.position!.end - entry.position!.start + 1);
  const bufInfo = await fn.getbufvar(denops, bufnr, "_gitter") as BufInfo;
  await fn.setbufvar(denops, bufnr, "_gitter", {
    ...bufInfo,
    messages: bufInfo.messages.map((val) => (val.id === entry.id
      ? {
        ...entry,
        position: {
          start: entry.position!.start,
          end: entry.position!.end + diff,
          idx: entry.position!.idx,
        },
      }
      : val.position!.start >= entry.position!.start
      ? {
        ...val,
        position: {
          start: val.position!.start + diff,
          end: val.position!.end + diff,
          idx: val.position!.idx,
        },
      }
      : val)
    ),
  });
}

export async function increaceThread(
  denops: Denops,
  bufnr: number,
  parentId: string,
): Promise<void> {
  await modifiable(denops, bufnr, async () => {
    const entry = await findById(denops, bufnr, parentId);
    if (entry) {
      const position = entry.position!;
      entry.thread = entry.thread + 1;
      const lines = await formatMessage(denops, entry);
      await fn.deletebufline(denops, bufnr, position.start, position.end);
      await fn.appendbufline(denops, bufnr, position.start - 1, lines);
      // update b:_gitter
      await patchBufInfo(denops, bufnr, entry, lines.length);
    }
  });
}

export async function edit(
  denops: Denops,
  bufnr: number,
  entry: Entry,
): Promise<void> {
  await modifiable(denops, bufnr, async () => {
    const matched = await findById(denops, bufnr, entry.id);
    if (matched) {
      const position = matched.position!;
      const lines = await formatMessage(denops, entry);
      await fn.deletebufline(denops, bufnr, position.start, position.end);
      await fn.appendbufline(denops, bufnr, position.start - 1, lines);
      if (lines.length !== (position.end - position.start + 1)) {
        // update b:_gitter
        await patchBufInfo(denops, bufnr, matched, lines.length);
      }
    }
  });
}
