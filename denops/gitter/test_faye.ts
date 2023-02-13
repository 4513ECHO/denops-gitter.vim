import { Gitter } from "./gitter/mod.ts";
import type { Message } from "./gitter/types.ts";

export interface ChatMessageDataCreate {
  operation: "create";
  model: Message;
}

export interface ChatMessageDataUpdate {
  operation: "update";
  model: Message & { editedAt: string };
}

export interface ChatMessageDataRemove {
  operation: "remove";
  model: { id: string };
}

export type ChatMessageData =
  | ChatMessageDataCreate
  | ChatMessageDataUpdate
  | ChatMessageDataRemove;

const gitter = new Gitter("1f56747da37a2a5821e80d7c63d4e11c13429d73");
const client = await gitter.faye();

const id = "63421f216da03739849d9868";
for await (
  const resp of client.subscribe<ChatMessageData>(
    `/api/v1/rooms/${id}/chatMessages`,
  )
) {
  switch (resp.data.operation) {
    case "create":
      console.log("created message by", resp.data.model.fromUser.displayName);
      break;
    case "update":
      console.log("updated at", resp.data.model.editedAt);
      break;
    case "remove":
      console.log("deleted", resp.data.model.id);
      break;
  }
}
