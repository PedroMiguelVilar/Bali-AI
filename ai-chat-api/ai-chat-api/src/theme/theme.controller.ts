import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ThemeService } from './theme.service';

@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  getAll() {
    return this.themeService.getAll();
  }

  @Get('default')
  getDefault() {
    return this.themeService.getDefault();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    const theme = this.themeService.findBySlug(slug);
    if (!theme) {
      throw new NotFoundException(`Theme not found: ${slug}`);
    }
    return theme;
  }
}
