import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { PersonalityService } from '../personality/personality.service';
import { User } from '../user/user.entity';
import {
  DEFAULT_PERSONALITIES,
  DEFAULT_MODELS,
  DEFAULT_USERS,
} from './seed-data';
import { Model } from '../model/model.entity';

async function seedUsers(userRepo: Repository<User>) {
  for (const userData of DEFAULT_USERS) {
    let user = await userRepo.findOne({
      where: { username: userData.username },
    });

    if (!user) {
      const payload: Partial<User> = {
        username: userData.username,
      };

      if (typeof userData.email === 'string') {
        payload.email = userData.email;
      }

      user = userRepo.create(payload);
      await userRepo.save(user);
      console.log(`[user] created ${user.username}`);
      continue;
    }

    if (typeof userData.email === 'string' && user.email !== userData.email) {
      user.email = userData.email;
      await userRepo.save(user);
      console.log(`[user] updated ${user.username}`);
    } else {
      console.log(`[user] skipped ${user.username}`);
    }
  }
}

async function seedModels(modelRepo: Repository<Model>) {
  for (const modelData of DEFAULT_MODELS) {
    let model = await modelRepo.findOne({
      where: { name: modelData.name },
    });

    if (!model) {
      model = modelRepo.create({ ...modelData, active: true });
      await modelRepo.save(model);
      console.log(`[model] created ${modelData.name}`);
      continue;
    }

    const needsUpdate =
      model.label !== modelData.label ||
      model.provider !== modelData.provider ||
      model.description !== modelData.description ||
      model.active !== true;

    if (needsUpdate) {
      model.label = modelData.label;
      model.provider = modelData.provider;
      model.description = modelData.description;
      model.active = true;
      await modelRepo.save(model);
      console.log(`[model] updated ${modelData.name}`);
    } else {
      console.log(`[model] skipped ${modelData.name}`);
    }
  }
}

async function seedPersonalities(
  personalityService: PersonalityService,
) {
  for (const template of DEFAULT_PERSONALITIES) {
    const existing = await personalityService.findBySlug(template.slug);

    if (!existing) {
      await personalityService.create(template);
      console.log(`[personality] created ${template.slug}`);
      continue;
    }

    const needsUpdate =
      existing.name !== template.name ||
      existing.basePrompt !== template.basePrompt ||
      existing.model !== template.model ||
      existing.description !== template.description ||
      existing.accentColor !== template.accentColor ||
      existing.avatar !== template.avatar ||
      existing.appearancePreset !== template.appearancePreset ||
      JSON.stringify(existing.traits || []) !==
        JSON.stringify(template.traits || []);

    if (needsUpdate) {
      existing.name = template.name;
      existing.basePrompt = template.basePrompt;
      existing.model = template.model;
      existing.description = template.description;
      existing.accentColor = template.accentColor;
      existing.avatar = template.avatar;
      existing.traits = template.traits;
      existing.appearancePreset = template.appearancePreset;
      await personalityService.create(existing);
      console.log(`[personality] updated ${template.slug}`);
    } else {
      console.log(`[personality] skipped ${template.slug}`);
    }
  }
}

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const personalityService = appContext.get(PersonalityService);
    const userRepo = appContext.get<Repository<User>>(
      getRepositoryToken(User),
    );
    const modelRepo = appContext.get<Repository<Model>>(
      getRepositoryToken(Model),
    );

    await seedUsers(userRepo);
    await seedModels(modelRepo);
    await seedPersonalities(personalityService);

    console.log('Database seed completed successfully.');
  } catch (error) {
    console.error('Database seed failed', error);
    process.exitCode = 1;
  } finally {
    await appContext.close();
  }
}

bootstrap();
