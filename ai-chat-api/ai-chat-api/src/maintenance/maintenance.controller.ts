import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async reset() {
    await this.maintenanceService.resetNonUserData();
    return { ok: true };
  }
}
