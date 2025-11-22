import { Message } from './message.model';

export interface Conversation {
  id: number;
  startedAt?: string;
  messages?: Message[];
}
