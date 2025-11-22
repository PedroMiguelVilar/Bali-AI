import { Controller, Get } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  async list() {
    return this.modelService.listActive();
  }
}
