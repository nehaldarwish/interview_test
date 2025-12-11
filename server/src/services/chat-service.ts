import { getLLMProvider } from './llm-provider';
import type { Chat} from './types';

const chats: Map<string, Chat> = new Map();

export class ChatService {
  async createChat(): Promise<Chat> {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chat: Chat = {
      id: chatId,
      name: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    chats.set(chatId, chat);
    return chat;
  }

  async getChat(chatId: string): Promise<Chat | undefined> {
    return chats.get(chatId);
  }

  async getAllChats(): Promise<Chat[]> {
    return Array.from(chats.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async sendMessage(chatId: string, userMessage: string, model = 'gpt-4o-mini'): Promise<string> {
    const chat = chats.get(chatId);
    if (!chat) throw new Error('Chat not found');

    chat.messages.push({ role: 'user', content: userMessage });

    if (chat.messages.length === 1) {
      const words = userMessage.trim().split(' ').slice(0, 6).join(' ');
      chat.name = words || 'New Chat';
      if (userMessage.length > 40) chat.name += '...';
    }

    const provider = getLLMProvider(model);

    try {
      const assistantMessage = await provider.generateResponse(chat.messages);

      chat.messages.push({ role: 'assistant', content: assistantMessage });
      chat.updatedAt = new Date();
      chats.set(chatId, chat);

      return assistantMessage;
    } catch (error) {
      chat.messages.pop(); // rollback user message on failure
      throw error;
    }
  }

  async deleteChat(chatId: string): Promise<boolean> {
    return chats.delete(chatId);
  }
}