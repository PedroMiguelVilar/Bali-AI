import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ModelService } from '../src/model/model.service';
import { PersonalityService } from '../src/personality/personality.service';
import {
  DEFAULT_MODELS,
  DEFAULT_PERSONALITIES,
} from '../src/database/seed-data';

describe('Personality API (e2e)', () => {
  let app: INestApplication;
  let http: request.SuperTest<request.Test>;
  let modelService: ModelService;
  let personalityService: PersonalityService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    http = request(app.getHttpServer());
    modelService = app.get(ModelService);
    personalityService = app.get(PersonalityService);

    // Seed in-memory database
    for (const model of DEFAULT_MODELS) {
      await modelService.upsert({ ...model, active: true });
    }
    for (const persona of DEFAULT_PERSONALITIES) {
      await personalityService.create(persona);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists available models', async () => {
    const res = await http.get('/models').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((m: any) => m.name === DEFAULT_MODELS[0].name)).toBe(
      true,
    );
  });

  it('returns creation options bundle', async () => {
    const res = await http.get('/personalities/options').expect(200);
    expect(res.body.models.length).toBeGreaterThan(0);
    expect(res.body.traitPresets.length).toBeGreaterThan(0);
    expect(res.body.appearancePresets.length).toBeGreaterThan(0);
  });

  it('creates a new personality', async () => {
    const slug = `test-${Date.now()}`;
    const payload = {
      name: 'Test Persona',
      slug,
      model: DEFAULT_MODELS[0].name,
      basePrompt: 'Be crisp and clear.',
      description: 'Temporary test persona',
      traits: ['concise', 'structured'],
      accentColor: '#22d3ee',
      avatar: '🤖',
      appearancePreset: 'aqua-pulse',
    };

    const res = await http.post('/personalities').send(payload).expect(201);
    expect(res.body.slug).toBe(slug);
    expect(res.body.model).toBe(payload.model);
    expect(res.body.traits).toContain('concise');

    const list = await http.get('/personalities').expect(200);
    expect(list.body.some((p: any) => p.slug === slug)).toBe(true);
  });
});
