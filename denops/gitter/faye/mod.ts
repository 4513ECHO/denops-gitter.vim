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

export interface HandshakeResponse<Ext = unknown> {
  channel: Channel.HANDSHAKE;
  successful: boolean;
  version: "1.0";
  supportedConnectionTypes: string[];
  clientId: string;
  advice?: Advice;
  ext?: Ext;
}

export interface ConnectResponse {
  channel: Channel.CONNECT;
  clientId: string;
  successful: boolean;
  advice?: Advice;
}

export interface SubscribedItem<Data = unknown, Ext = unknown> {
  channel: string;
  data: Data;
  id: string;
  ext?: Ext;
}

export type RequestType<Ext = unknown> =
  | {
    channel: Channel.HANDSHAKE;
    version: "1.0";
    supportedConnectionTypes: string[];
    minimumVersion?: string;
    ext?: Ext;
    id?: string;
  }
  | {
    channel: Channel.CONNECT;
    clientId: string;
    connectionType: string;
    ext?: Ext;
    id?: string;
  }
  | {
    channel: Channel.SUBSCRIBE;
    clientId: string;
    subscription: string;
    ext?: Ext;
    id?: string;
  };

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
