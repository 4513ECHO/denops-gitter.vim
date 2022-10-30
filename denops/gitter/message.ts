import type { Message } from "./types.ts";

export interface SendMessageOptions {
  token: string;
  roomId: string;
  text: string;
  parentId?: string;
}

export interface SendMediaOptions {
  token: string;
  roomId: string;
  media: Uint8Array;
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
  beforeId?: string;
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

// Refer: https://github.com/wechaty/puppet-gitter/blob/93af7eba2412564f32138c9b95b335e45a95e885/src/puppet-gitter.ts#L511-L545
export async function sendMedia(
  option: SendMediaOptions,
): Promise<Response> {
  const { roomId, token } = option;
  const resp = await fetch(
    `https://gitter.im/api/private/generate-signature?room_id=${roomId}&type=image`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  const { sig, params } = await resp.json() as { sig: string; params: string };

  const uuid = crypto.randomUUID().replaceAll("-", "");
  const transloadit = await fetch(
    `https://api2.transloadit.com/instances/bored?${uuid}`,
  );
  const { api2_host: host } = await transloadit.json() as { api2_host: string };

  const body = new FormData();
  body.append("signature", sig);
  body.append("params", params);
  body.append("file", new Blob([option.media.buffer], { type: "image/png" }));

  return await fetch(`https://${host}/assemblies/${uuid}?redirect=false`, {
    method: "POST",
    body,
  });
}
