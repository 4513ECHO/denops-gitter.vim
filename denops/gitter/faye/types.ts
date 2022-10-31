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
