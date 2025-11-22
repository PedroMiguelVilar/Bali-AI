import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personality } from './personality.entity';
import { Model } from '../model/model.entity';
import { Conversation } from '../conversation/conversation.entity';

@Injectable()
export class PersonalityService {
  constructor(
    @InjectRepository(Personality)
    private readonly repo: Repository<Personality>,

    @InjectRepository(Model)
    private readonly modelRepo: Repository<Model>,

    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async findBySlug(slug: string): Promise<Personality | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async findAll(): Promise<Personality[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(personality: Partial<Personality>) {
    if (personality.name) {
      personality.slug = this.slugify(personality.name);
    }

    if (personality.model) {
      const exists = await this.modelRepo.findOne({
        where: { name: personality.model },
      });

      if (!exists) {
        throw new Error(`Model ${personality.model} is not registered`);
      }
    }

    const normalizedTraits = Array.isArray(personality.traits)
      ? personality.traits.filter(Boolean)
      : null;

    return this.repo.save({
      ...personality,
      traits: normalizedTraits?.length ? normalizedTraits : null,
    });
  }

  async update(slug: string, payload: Partial<Personality>) {
    const existing = await this.findBySlug(slug);
    if (!existing) return null;
    const normalizedTraits = Array.isArray(payload.traits)
      ? payload.traits.filter(Boolean)
      : existing.traits;

    const toSave = this.repo.merge(existing, {
      ...payload,
      traits: normalizedTraits?.length ? normalizedTraits : null,
    });
    return this.repo.save(toSave);
  }

  async remove(id: number) {
    await this.conversationRepo.delete({ personality: { id } });
    return this.repo.delete(id);
  }

  slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
