export interface Message {
  id: string;
  text: string;
  sent: string;
  /** Edited time if the message is edited. */
  editedAt?: string;
  /** The number of messages in thread if the message has thread. */
  threadMessageCount?: number;
  /** Parent ID of the message if the message is in thread. */
  parentId?: string;
  /** Revision of the message. This is started from 1 and increase each the message is updated. */
  v: number;
  fromUser: User;
  unread: boolean;
}

export interface Room {
  id: string;
  name: string;
  topic: string;
  uri: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
}
