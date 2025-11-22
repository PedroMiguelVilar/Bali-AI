import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LongTermMemory } from 'src/long-term-memory/long-term-memory.entity';
import { Message } from 'src/message/message.entity';
import { User } from 'src/user/user.entity';
import { EmbeddingService } from 'src/embedding/embedding.service';
import { LlmService } from 'src/llm/llm.service';

@Injectable()
export class MemoryService {
  constructor(
    @InjectRepository(LongTermMemory)
    private longTermRepo: Repository<LongTermMemory>,
    private embeddingService: EmbeddingService,
    private llmService: LlmService,
  ) {}

  normalize(value: string): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim();
  }

  isGarbage(value: string): boolean {
    if (!value) return true;
    const trash = new Set([
      'ok',
      'yes',
      'hi',
      'hello',
      'hey',
      'hmm',
      'test',
      'asd',
      'new memory',
      'unknown',
    ]);
    const cleaned = this.normalize(value);
    if (!cleaned) return true;

    const tokens = cleaned.split(' ').filter(Boolean);
    if (trash.has(cleaned) || tokens.some((token) => trash.has(token))) {
      return true;
    }

    return cleaned.length < 4 || /^<.*>$/.test(value);
  }

  private mentionsAssistantContext(value?: string): boolean {
    if (!value) return false;
    const cleaned = this.normalize(value);
    if (!cleaned) return false;
    const patterns = [
      /\bassistant\b/,
      /\bchat ?bot\b/,
      /\bbot\b/,
      /\bpersona\b/,
    ];
    return patterns.some((pattern) => pattern.test(cleaned));
  }

  async extractMemoryCandidates(
    message: string,
  ): Promise<
    {
      type: string;
      key: string;
      value: string;
      confidence: number;
    }[]
  > {
    const candidates = await this.llmService.analyzeMemory(message);
    const normalizedMessage = this.normalize(message);
    return candidates.filter(
      (fact) =>
        !this.isGarbage(fact.key) &&
        !this.isGarbage(fact.value) &&
        fact.confidence >= 0.6 &&
        !!this.normalize(fact.value) &&
        normalizedMessage.includes(this.normalize(fact.value)),
    );
  }

  async storeStructuredMemory(
    user: User,
    sourceMessage: Message,
    type: string,
    key: string,
    value: string,
    confidence = 1.0,
  ) {
    if (!sourceMessage?.id || !sourceMessage?.content) return;

    if (
      this.mentionsAssistantContext(key) ||
      this.mentionsAssistantContext(value)
    ) {
      return;
    }
  
    const normalizedKey = this.normalize(key);
    const normalizedValue = this.normalize(value);
  
    if (this.isGarbage(normalizedKey) || this.isGarbage(normalizedValue)) return;
  
    const existing = await this.longTermRepo.findOne({
      where: { user: { id: user.id }, key: normalizedKey },
    });
  
    if (existing) {
      const existingValue = this.normalize(existing.value);
      const shouldUpdate =
        existingValue !== normalizedValue ||
        (existing.confidence ?? 0) < confidence;
  
      if (shouldUpdate) {
        existing.value = value;
        existing.confidence = confidence;
        existing.sourceMessage = sourceMessage.content;
        existing.type = type;
        existing.conversation = sourceMessage.conversation;
        await this.longTermRepo.save(existing);
  
        const embedding = await this.embeddingService.embed(value);
        await this.updateEmbedding(existing.id, embedding);
  
        console.log(`[UPDATED] ${key} -> ${value}`);
      } else {
        console.log(`[SKIPPED] ${key} already exists with equal or higher confidence`);
      }
    } else {
      const memory = this.longTermRepo.create({
        user,
        conversation: sourceMessage.conversation,
        sourceMessage: sourceMessage.content,
        type,
        key: normalizedKey,
        value,
        confidence,
      });
  
      const saved = await this.longTermRepo.save(memory);
      const embedding = await this.embeddingService.embed(value);
      await this.updateEmbedding(saved.id, embedding);
  
      console.log(`[CREATED] ${key} -> ${value}`);
    }
  }
  

  async reviseMemoryFacts(user: User, userInput: string): Promise<void> {
    const existing = await this.longTermRepo.find({
      where: { user: { id: user.id } },
    });
    if (existing.length === 0) return;

    const normalizedInput = this.normalize(userInput);
  
    const factList = existing.map((m) => ({
      key: m.key,
      value: m.value,
      type: m.type ?? 'other',
    }));
  
    const prompt = `
  You are an assistant that helps update user memory based on corrections or clarifications.
  Only issue DELETE or UPDATE actions when the user explicitly refers to a fact and clearly provides the replacement or indicates it should be forgotten. Otherwise respond with [].
  
  Given the following known facts and the user's new input, return a JSON array of actions with one of:
  - DELETE a fact by key and value
  - UPDATE a fact by key with old and new values
  - NONE if nothing needs to change
  
  Facts:
  ${JSON.stringify(factList, null, 2)}
  
  User input:
  "${userInput}"
  
  Format:
  [
    { "action": "DELETE", "key": "emotion", "value": "impatience" },
    { "action": "UPDATE", "key": "name", "old": "mark", "new": "jose" }
  ]
  Respond with only valid JSON.
  `;
  
    const raw = await this.llmService.prompt(prompt, 'mistral');
    try {
      const actions = JSON.parse(raw);
  
      for (const act of actions) {
        if (act.action === 'DELETE') {
          if (!act.key) continue;
          const normalizedValue = this.normalize(act.value ?? '');
          const normalizedKey = this.normalize(act.key ?? '');
          if (
            (!normalizedValue || !normalizedInput.includes(normalizedValue)) &&
            (!normalizedKey || !normalizedInput.includes(normalizedKey))
          ) {
            continue;
          }
          await this.longTermRepo.delete({
            user,
            key: act.key,
            value: act.value,
          });
          console.log(`[MEMORY DELETED] ${act.key} = ${act.value}`);
        } else if (act.action === 'UPDATE') {
          if (!act.key) continue;
          const normalizedNewValue = this.normalize(act.new ?? '');
          const normalizedOldValue = this.normalize(act.old ?? '');
          if (
            !normalizedNewValue ||
            !normalizedInput.includes(normalizedNewValue) ||
            !normalizedOldValue
          ) {
            continue;
          }
          const existingFact = existing.find(
            (m) =>
              m.key === act.key &&
              this.normalize(m.value) === normalizedOldValue,
          );
          if (existingFact) {
            existingFact.value = act.new;
            existingFact.confidence = 1.0;
            await this.longTermRepo.save(existingFact);
            const embedding = await this.embeddingService.embed(act.new);
            await this.updateEmbedding(existingFact.id, embedding);
            console.log(`[MEMORY UPDATED] ${act.key} = ${act.new}`);
          }
        }
      }
    } catch (e) {
      this.llmService['logger']?.warn?.('Memory revision failed:', raw);
    }
  }
  

  async getSimilarMemories(user: User, query: string): Promise<LongTermMemory[]> {
    const vectorArray = await this.embeddingService.embed(query);
    if (!vectorArray || vectorArray.length === 0) {
      console.warn('Empty embedding returned, skipping similarity search.');
      return [];
    }

    const embedding = `[${vectorArray.join(',')}]`;

    try {
      const results = await this.longTermRepo.manager.query(
        `
        SELECT * FROM long_term_memory
        WHERE "userId" = $1 AND embedding IS NOT NULL
        ORDER BY embedding::vector <-> $2::vector
        LIMIT 5
        `,
        [user.id, embedding],
      );

      return results;
    } catch (error) {
      // pgvector not installed yet; surface a friendly warning and continue without blocking chat
      if (error?.code === '42704') {
        console.warn(
          'pgvector extension is not available in this database, skipping similarity lookup.',
        );
        return [];
      }
      throw error;
    }
  }

  private async updateEmbedding(memoryId: number, embedding: number[]) {
    const formatted = `[${embedding.join(',')}]`;
    await this.longTermRepo.manager.query(
      `UPDATE long_term_memory SET embedding = $1 WHERE id = $2`,
      [formatted, memoryId],
    );
  }
}
