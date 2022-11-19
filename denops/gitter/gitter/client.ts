import { TextLineStream } from "https://deno.land/std@0.159.0/streams/mod.ts";
import { JsonParseStream } from "https://deno.land/std@0.159.0/encoding/json/stream.ts";
import { urlJoin } from "https://deno.land/x/url_join@1.0.0/mod.ts";

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  endpoint?: string;
  signal?: AbortSignal;
}

export class Client {
  #token: string;
  #endpoint: string;
  constructor(token: string) {
    this.#token = token;
    this.#endpoint = "https://api.gitter.im/v1/";
  }

  async fetch(
    path: string,
    option?: FetchOptions,
  ): Promise<Response> {
    const resp = await fetch(
      urlJoin(option?.endpoint ?? this.#endpoint, path),
      {
        method: option?.method ?? "GET",
        headers: {
          Authorization: `Bearer ${this.#token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...option?.headers,
        },
        body: option?.body ? JSON.stringify(option.body) : null,
        signal: option?.signal,
      },
    );
    if (!resp.ok) {
      throw new Error(
        `Request failed: ${resp.status} ${resp.statusText} ${resp.url}`,
      );
    }
    return resp;
  }

  async *stream<T>(
    path: string,
    signal?: AbortSignal,
  ): AsyncIterableIterator<T> {
    const { body } = await this.fetch(
      path,
      { endpoint: "https://stream.gitter.im/v1/", signal },
    );
    for await (
      const data of body!
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new JsonParseStream())
    ) {
      yield data as unknown as T;
    }
  }
}
