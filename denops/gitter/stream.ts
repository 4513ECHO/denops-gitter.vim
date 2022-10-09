import { TextLineStream } from "https://deno.land/std@0.159.0/streams/mod.ts";
import { JsonParseStream } from "https://deno.land/std@0.159.0/encoding/json/stream.ts";
import type { Message } from "./types.d.ts";

export interface ChatMessagesStreamOptions {
  roomId: string;
  token: string;
  signal?: AbortSignal;
}

export async function chatMessagesStream(
  option: ChatMessagesStreamOptions,
): Promise<ReadableStream<Message>> {
  const { body } = await fetch(
    `https://stream.gitter.im/v1/rooms/${option.roomId}/chatMessages`,
    {
      headers: {
        Authorization: `Bearer ${option.token}`,
        Accept: "application/json",
      },
      signal: option.signal,
    },
  );
  return body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(new JsonParseStream()) as unknown as ReadableStream<Message>;
}
