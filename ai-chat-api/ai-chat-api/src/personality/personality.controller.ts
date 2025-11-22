import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { PersonalityService } from './personality.service';
import { ModelService } from '../model/model.service';
import { APPEARANCE_PRESETS, TRAIT_PRESETS } from './personality.presets';

@Controller('personalities')
export class PersonalityController {
  constructor(
    private readonly personalityService: PersonalityService,
    private readonly modelService: ModelService,
  ) {}

  @Get()
  async getAll() {
    return this.personalityService.findAll();
  }

  @Get('options')
  async getOptions() {
    const models = await this.modelService.listActive();
    return {
      models,
      traitPresets: TRAIT_PRESETS,
      appearancePresets: APPEARANCE_PRESETS,
    };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.personalityService.findBySlug(slug);
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      model?: string;
      basePrompt: string;
      description?: string;
      traits?: string[];
      avatar?: string;
      appearancePreset?: string;
    },
  ) {
    const name = body?.name?.trim();
    const basePrompt = body?.basePrompt?.trim();

    if (!name) throw new BadRequestException('Name is required');
    if (!basePrompt) throw new BadRequestException('Base prompt is required');

    const slug = this.personalityService.slugify(name);

    if (!slug) {
      throw new BadRequestException('Slug could not be generated');
    }

    const existing = await this.personalityService.findBySlug(slug);
    if (existing) {
      throw new BadRequestException('Slug already exists');
    }

    const modelName =
      body?.model?.trim() || (await this.modelService.getDefaultModelName());
    const modelExists = await this.modelService.findByName(modelName);
    if (!modelExists) {
      throw new BadRequestException('Model is not available');
    }

    const traits = Array.isArray(body.traits)
      ? body.traits.map((t) => String(t)).filter(Boolean)
      : [];

    return this.personalityService.create({
      name,
      slug,
      model: modelName,
      basePrompt,
      description: body?.description?.trim() || null,
      traits,
      avatar: body?.avatar?.trim() || null,
      appearancePreset: body?.appearancePreset?.trim() || null,
    });
  }

  @Put(':slug')
  async update(
    @Param('slug') slug: string,
    @Body()
    body: {
      name?: string;
      model?: string;
      basePrompt?: string;
      description?: string;
      traits?: string[];
      avatar?: string;
      appearancePreset?: string;
    },
  ) {
    const personality = await this.personalityService.findBySlug(slug);
    if (!personality) throw new BadRequestException('Personality not found');

    if (body.model) {
      const modelExists = await this.modelService.findByName(body.model.trim());
      if (!modelExists) {
        throw new BadRequestException('Model is not available');
      }
    }

    return this.personalityService.update(personality.slug, {
      name: body?.name?.trim() || personality.name,
      model: body?.model?.trim() || personality.model,
      basePrompt: body?.basePrompt?.trim() || personality.basePrompt,
      description:
        body?.description !== undefined
          ? body.description?.trim() || null
          : personality.description,
      traits: Array.isArray(body.traits)
        ? body.traits.filter(Boolean)
        : personality.traits,
      avatar:
        body?.avatar !== undefined
          ? body.avatar?.trim() || null
          : personality.avatar,
      appearancePreset:
        body?.appearancePreset !== undefined
          ? body.appearancePreset?.trim() || null
          : personality.appearancePreset,
    });
  }

  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    const existing = await this.personalityService.findBySlug(slug);
    if (!existing) throw new BadRequestException('Personality not found');
    await this.personalityService.remove(existing.id);
    return { ok: true };
  }
}
