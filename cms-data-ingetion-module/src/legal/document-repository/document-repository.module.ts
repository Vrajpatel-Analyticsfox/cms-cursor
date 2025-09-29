import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentManagementController } from './document-repository.controller';
import { DocumentRepositoryService } from './document-repository.service';
import { SecureStorageService } from './services/secure-storage.service';
import { VersionControlService } from './services/version-control.service';
import { AccessControlService } from './services/access-control.service';
import { DrizzleModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DrizzleModule],
  controllers: [DocumentManagementController],
  providers: [
    DocumentRepositoryService,
    SecureStorageService,
    VersionControlService,
    AccessControlService,
  ],
  exports: [
    DocumentRepositoryService,
    SecureStorageService,
    VersionControlService,
    AccessControlService,
  ],
})
export class DocumentRepositoryModule {}
