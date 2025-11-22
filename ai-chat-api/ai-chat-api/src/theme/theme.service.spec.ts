import { Test } from '@nestjs/testing';
import { ThemeService } from './theme.service';
import { THEMES } from './themes';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ThemeService],
    }).compile();

    service = moduleRef.get(ThemeService);
  });

  it('returns all available themes', () => {
    expect(service.getAll()).toHaveLength(THEMES.length);
  });

  it('returns a default theme', () => {
    expect(service.getDefault().slug).toBeDefined();
  });

  it('findBySlug returns undefined for unknown theme', () => {
    expect(service.findBySlug('not-real')).toBeUndefined();
  });
});
