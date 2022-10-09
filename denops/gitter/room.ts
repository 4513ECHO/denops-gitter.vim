import type { Room } from "./types.d.ts";

const cache = new Map<string, string>();

export async function getRooms(token: string): Promise<Room[]> {
  const result = await fetch(
    "https://api.gitter.im/v1/rooms",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  return result.json();
}

export async function convertUriToId(
  uri: string,
  token: string,
): Promise<string | null> {
  if (cache.has(uri)) {
    return cache.get(uri)!;
  }
  const result = (await getRooms(token)).filter((i) => i.uri === uri);
  if (result.length > 0) {
    cache.set(uri, result[0].id);
    return result[0].id;
  }
  return null;
}
