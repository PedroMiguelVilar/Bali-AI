import { Injectable } from '@nestjs/common';
import { DEFAULT_THEME_SLUG, THEMES } from './themes';
import { ThemeDefinition } from './theme.types';

@Injectable()
export class ThemeService {
  private readonly themes: ThemeDefinition[] = THEMES;

  getAll(): ThemeDefinition[] {
    return this.themes;
  }

  getDefault(): ThemeDefinition {
    return (
      this.findBySlug(DEFAULT_THEME_SLUG) ??
      this.themes[0]
    );
  }

  findBySlug(slug: string): ThemeDefinition | undefined {
    return this.themes.find((theme) => theme.slug === slug);
  }
}
