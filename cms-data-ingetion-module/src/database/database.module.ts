import { Module } from '@nestjs/common';
import { db } from '../db/drizzle.config';

@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useValue: db,
    },
  ],
  exports: ['DRIZZLE'],
})
export class DrizzleModule {}
