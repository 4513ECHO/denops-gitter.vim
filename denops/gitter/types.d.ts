export interface Message {
  id: string;
  text: string;
  sent: string;
  threadMessageCount?: number;
  fromUser: User;
}

export interface Room {
  id: string;
  name: string;
  uri: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
}
