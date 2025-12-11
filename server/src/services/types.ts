// Shared types — no imports from chat-service or llm-provider
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
  
  export interface Chat {
    id: string;
    name: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface LLMProvider {
    generateResponse(messages: Message[]): Promise<string>;
  }