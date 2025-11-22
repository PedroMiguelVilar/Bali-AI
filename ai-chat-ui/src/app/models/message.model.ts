export interface Message {
  id?: number;
  sender: 'user' | 'ai';
  text: string;
  rawText?: string;
  content?: string;
  createdAt?: string;
  feedback?: 'up' | 'down' | null;
  feedbackComment?: string | null;
  feedbackAt?: string | null;
}
