export enum Channel {
  HANDSHAKE = "/meta/handshake",
  CONNECT = "/meta/connect",
  SUBSCRIBE = "/meta/subscribe",
}

/* example
  const client = new FayeClient("https://ws.gitter.im/faye")
  await client.handshake(token)
  for await (const resp of client.subscribe(channel)) {
    console.log(resp)
  }
*/

export class FayeClient {
  #clientId?: string;
  #endpoint: string | URL;
  constructor(endpoint: string | URL) {
    this.#endpoint = endpoint;
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

  async handshake(token: string): Promise<void> {
    const handshake = await this.#fetch(Channel.HANDSHAKE, {
      version: "1.0",
      supportedConnectionTypes: ["long-polling"],
      ext: { token },
    });
    console.log(handshake.status, handshake.statusText);
    const json = await handshake.json();
    console.log(json);
    this.#clientId = json[0].clientId;
  }

  async #subscribe(channel: string): Promise<unknown> {
    await this.#fetch(Channel.SUBSCRIBE, {
      clientId: this.#clientId,
      subscription: channel,
    });
    const response = await this.#fetch(Channel.CONNECT, {
      clientId: this.#clientId,
    });
    return response.json();
  }

  async *subscribe(channel: string): AsyncIterableIterator<unknown> {
    while (true) {
      yield this.#subscribe(channel);
    }
  }
}
