export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isCrisis?: boolean;
  failed?: boolean;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  suggestions: string[];
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CrisisResource {
  name: string;
  number: string;
  description: string;
  available: string;
}
