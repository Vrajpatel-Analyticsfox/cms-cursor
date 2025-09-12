import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TenantModule } from './tenant/tenant.module';
import { MasterDataModule } from './master-data/master-data.module';
import { LegalModule } from './legal/legal.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Required for @Cron decorators
    UsersModule,
    TenantModule,
    MasterDataModule,
    LegalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
