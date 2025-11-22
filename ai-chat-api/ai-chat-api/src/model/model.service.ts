import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './model.entity';

@Injectable()
export class ModelService {
  private readonly fallbackModel = 'fluffy/l3-8b-stheno-v3.2:q8_0';

  constructor(
    @InjectRepository(Model)
    private readonly repo: Repository<Model>,
  ) {}

  async listActive(): Promise<Model[]> {
    return this.repo.find({
      where: { active: true },
      order: { label: 'ASC' },
    });
  }

  async findByName(name: string): Promise<Model | null> {
    if (!name) return null;
    return this.repo.findOne({ where: { name } });
  }

  async upsert(model: Partial<Model>): Promise<Model> {
    const existing = model.name
      ? await this.findByName(model.name)
      : undefined;
    const payload = this.repo.create({
      ...existing,
      ...model,
    });
    return this.repo.save(payload);
  }

  async getDefaultModelName(): Promise<string> {
    const first = await this.repo.findOne({
      where: { active: true },
      order: { label: 'ASC' },
    });
    return first?.name || this.fallbackModel;
  }
}
