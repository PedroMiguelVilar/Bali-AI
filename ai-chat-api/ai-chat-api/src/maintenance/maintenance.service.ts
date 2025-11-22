import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async resetNonUserData(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `TRUNCATE TABLE "long_term_memory", "message", "conversation", "personality" RESTART IDENTITY CASCADE;`,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
