export enum Channel {
  HANDSHAKE = "/meta/handshake",
  CONNECT = "/meta/connect",
  SUBSCRIBE = "/meta/subscribe",
}

export type Advice = {
  reconnect: "handshake";
} | {
  reconnect: "retry";
  interval: number;
  timeout: number;
};

export interface HandshakeResponse<T = unknown> {
  channel: Channel.HANDSHAKE;
  successful: boolean;
  version: "1.0";
  supportedConnectionTypes: string[];
  clientId: string;
  advice?: Advice;
  ext?: T;
}

export interface ConnectResponse {
  clientId: string;
  channel: Channel.CONNECT;
  successful: boolean;
  advice?: Advice;
}

export interface SubscribedItem<T = unknown, U = unknown> {
  channel: string;
  data: T;
  id: string;
  ext?: U;
}

export class Client {
  #clientId?: string;
  #endpoint: URL;
  constructor(endpoint: string | URL) {
    this.#endpoint = new URL(endpoint);
  }

  async #fetch(
    channel: string,
    additionalBody?: Record<string, unknown>,
  ): Promise<Response> {
    return await fetch(this.#endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Pragma: "no-cache",
      },
      body: JSON.stringify({
        channel,
        connectionType: "long-polling",
        ...additionalBody,
      }),
    });
  }

  // TODO: Add extensible feature
  //       Make this.#fetch typing more strict (detect from Channel)
  async handshake(token: string): Promise<HandshakeResponse> {
    const handshake = await this.#fetch(Channel.HANDSHAKE, {
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
    await this.#fetch(Channel.SUBSCRIBE, {
      clientId: this.#clientId,
      subscription: channel,
    });
    while (true) {
      const response = await this.#fetch(Channel.CONNECT, {
        clientId: this.#clientId,
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
