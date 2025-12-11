import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { Message, LLMProvider } from './types'; // ← shared types

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(model: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is required');
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateResponse(messages: Message[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content?.trim() || 'No response.';
  }
}

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(model: string) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY is required');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
  }

  async generateResponse(messages: Message[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const text = await result.response.text();
    return text.trim();
  }
}

export function getLLMProvider(model: string): LLMProvider {
  if (model.startsWith('gpt-')) {
    return new OpenAIProvider(model);
  }
  if (model.startsWith('gemini-')) {
    return new GeminiProvider(model);  // Now pass "gemini-2.5-flash" etc.
  }
  throw new Error(`Unsupported model: ${model}`);
}