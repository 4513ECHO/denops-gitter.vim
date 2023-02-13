import type { Message, Room, User } from "./types.ts";
import { Client } from "./client.ts";
import { Client as FayeClient } from "../faye/mod.ts";

export interface SendMessageOptions {
  roomId: string;
  text: string;
  parentId?: string;
}

export interface GetRoomMessageOptions {
  query?: string;
  limit?: number;
  beforeId?: string;
}

export interface SendMediaOptions {
  roomId: string;
  media: Uint8Array;
}

export interface ChatMessagesStreamOptions {
  roomId: string;
  signal?: AbortSignal;
}

const roomCache = new Map<string, string>();

export class Gitter {
  #client: Client;
  #token: string;
  constructor(token: string) {
    if (token.length !== 40) {
      throw new Error("Token must be 40 character hex string");
    }
    this.#client = new Client(token);
    this.#token = token;
  }

  async me(): Promise<User> {
    const resp = await this.#client.fetch("/me");
    return await resp.json();
  }

  async rooms(): Promise<Room[]> {
    const resp = await this.#client.fetch("/rooms");
    return await resp.json();
  }

  async sendMessage(
    option: SendMessageOptions,
  ): Promise<Message> {
    const { roomId, text, parentId } = option;
    const result = await this.#client.fetch(
      `/rooms/${roomId}/chatMessages`,
      {
        method: "POST",
        body: { text, parentId },
      },
    );
    return result.json();
  }

  async getRoomMessages(
    roomId: string,
    option?: GetRoomMessageOptions,
  ): Promise<Message[]> {
    let endpoint = `/rooms/${roomId}/chatMessages`;
    if (option && Object.keys(option).length > 0) {
      const params = new URLSearchParams(option as Record<string, string>);
      endpoint += `?${params.toString()}`;
    }
    const result = await this.#client.fetch(endpoint);
    return result.json();
  }

  // Refer: https://github.com/wechaty/puppet-gitter/blob/93af7eba2412564f32138c9b95b335e45a95e885/src/puppet-gitter.ts#L511-L545
  async sendMedia(
    option: SendMediaOptions,
  ): Promise<Response> {
    const resp = await this.#client.fetch(
      `/generate-signature?room_id=${option.roomId}&type=image`,
      { endpoint: "https://gitter.im/api/private/" },
    );

    const { sig, params } = await resp.json() as {
      sig: string;
      params: string;
    };

    const uuid = crypto.randomUUID().replaceAll("-", "");
    const transloadit = await fetch(
      `https://api2.transloadit.com/instances/bored?${uuid}`,
    );
    const { api2_host: host } = await transloadit.json() as {
      api2_host: string;
    };

    const body = new FormData();
    body.append("signature", sig);
    body.append("params", params);
    body.append("file", new Blob([option.media.buffer], { type: "image/png" }));

    return await fetch(`https://${host}/assemblies/${uuid}?redirect=false`, {
      method: "POST",
      body,
    });
  }

  async convertUriToId(
    uri: string,
  ): Promise<string | null> {
    if (roomCache.has(uri)) {
      return roomCache.get(uri)!;
    }
    const result = (await this.rooms()).filter((i) => i.uri === uri);
    if (result.length > 0) {
      roomCache.set(uri, result[0].id);
      return result[0].id;
    }
    return null;
  }

  async *chatMessagesStream(
    option: ChatMessagesStreamOptions,
  ): AsyncIterableIterator<Message> {
    for await (
      const data of this.#client.stream<Message>(
        `/rooms/${option.roomId}/chatMessages`,
        option.signal,
      )
    ) {
      yield data;
    }
  }

  async faye(): Promise<FayeClient> {
    const client = new FayeClient("https://ws.gitter.im/faye");
    await client.handshake(this.#token);
    return client;
  }
}
