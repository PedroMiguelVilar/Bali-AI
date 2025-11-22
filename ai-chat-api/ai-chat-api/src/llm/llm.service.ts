// src/llm/llm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private readonly apiUrl = 'http://localhost:11434/api/chat';
  private readonly defaultModel = 'fluffy/l3-8b-stheno-v3.2:q8_0';

  /**
   * Generic call to the LLM backend using chat format.
   */
  async generate(
    messages: LlmMessage[],
    model: string = this.defaultModel,
    temperature = 0.4,
    maxTokens = 1024,
    stop?: string[],
  ): Promise<LlmResponse> {
    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
      ...(stop?.length ? { stop } : {}),
    };

    try {
      const response = await axios.post(this.apiUrl, payload);
      const data = response.data;
      const content = data.message?.content || '';
      const usage = data.usage ?? null;

      return {
        content,
        model,
        usage,
      };
    } catch (error) {
      this.logger.error('LLM call failed', error);
      throw new Error('LLM service failed to generate response.');
    }
  }

  async prompt(
    prompt: string,
    model?: string,
    systemPrompt = 'You are a helpful assistant.',
  ): Promise<string> {
    const messages: LlmMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];
    const res = await this.generate(messages, model || this.defaultModel);
    return res.content.trim();
  }

  async analyzeMemory(message: string): Promise<
    { type: string; key: string; value: string; confidence: number }[]
  > {
    const prompt = `
You are a memory extraction assistant. Consider only durable facts explicitly stated by the USER about themselves (identity, preferences, habits, goals, relationships, etc.).
Ignore greetings, questions, requests for help, chatter about the assistant/system, and placeholder text like "test". If no useful fact is present, return an empty array.
Use the user's exact wording for the "value" field.

Output a JSON array of objects like:
[
  {
    "type": "identity" | "preference" | "personality" | "habit" | "intent" | "other",
    "key": "short_identifier",
    "value": "user-stated fact or belief",
    "confidence": 0.0 to 1.0
  }
]

Respond with ONLY valid JSON.

Input: "${message}"
`;

    const response = await this.prompt(prompt, 'mistral', '');

    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (!match) return [];
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed)
        ? parsed.filter(
            (item) =>
              item.key &&
              item.value &&
              typeof item.confidence === 'number' &&
              item.confidence >= 0.5,
          )
        : [];
    } catch (e) {
      this.logger.warn('Failed to parse memory JSON array:', response);
      return [];
    }
  }

  async reviseMemory(original: string, correction: string): Promise<string> {
    const systemPrompt = `You are revising long-term memory based on a correction provided by the user. Use the correction to rewrite the original memory in a clear and accurate way.`;

    const userPrompt = `Original memory:\n"${original}"\n\nUser correction:\n"${correction}"\n\nRevised memory:`;

    return await this.prompt(userPrompt, undefined, systemPrompt);
  }
}
