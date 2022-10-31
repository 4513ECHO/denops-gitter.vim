import {
  Channel,
  type ConnectResponse,
  type HandshakeResponse,
  type RequestType,
  type SubscribedItem,
} from "./types.ts";

export class Client {
  #clientId?: string;
  #endpoint: URL;
  constructor(endpoint: string | URL) {
    this.#endpoint = new URL(endpoint);
  }

  async #fetch(
    body: RequestType,
  ): Promise<Response> {
    return await fetch(this.#endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Pragma: "no-cache",
      },
      body: JSON.stringify(body),
    });
  }

  // TODO: Add extensible feature
  async handshake(token: string): Promise<HandshakeResponse> {
    const handshake = await this.#fetch({
      channel: Channel.HANDSHAKE,
      version: "1.0",
      supportedConnectionTypes: ["long-polling"],
      ext: { token },
    });
    const json = await handshake.json() as HandshakeResponse[];
    this.#clientId = json[0].clientId;
    return json[0];
  }

  async *subscribe<T = unknown, U = unknown>(
    channel: string,
  ): AsyncIterableIterator<SubscribedItem<T, U>> {
    await this.#fetch({
      channel: Channel.SUBSCRIBE,
      clientId: this.#clientId!,
      subscription: channel,
    });
    while (true) {
      const response = await this.#fetch({
        channel: Channel.CONNECT,
        clientId: this.#clientId!,
        connectionType: "long-polling",
      });
      const result = await response.json() as
        | [ConnectResponse]
        | [ConnectResponse, SubscribedItem<T, U>];
      if (result.length === 2) {
        yield result[1];
      }
    }
  }
}
