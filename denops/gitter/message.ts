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

export interface GetRoomMessageOptions {
  query?: string;
  limit?: number;
}

export async function getRoomMessages(
  roomId: string,
  token: string,
  option?: GetRoomMessageOptions,
): Promise<Message[]> {
  let endpoint = `https://api.gitter.im/v1/rooms/${roomId}/chatMessages`;
  if (option && Object.keys(option).length > 0) {
    const params = new URLSearchParams(option as Record<string, string>);
    endpoint += `?${params.toString()}`;
  }
  const result = await fetch(
    endpoint,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  return result.json();
}
