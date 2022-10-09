import type { Message } from "./types.d.ts";

export interface SendMessageOptions {
  token: string;
  roomId: string;
  text: string;
  parentId?: string;
}
export async function sendMessage(
  option: SendMessageOptions,
): Promise<Message> {
  const { roomId, text, token, parentId } = option;
  const result = await fetch(
    `https://api.gitter.im/v1/rooms/${roomId}/chatMessages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, parentId }),
    },
  );
  return result.json();
}

if (import.meta.main) {
  const token = "b1ae9864bb29207d3e0a6f303a875bb1caac5733";
  const roomId = "63421f216da03739849d9868";
  console.log(
    await sendMessage({ token, roomId, text: Date.now().toString() }),
  );
}
