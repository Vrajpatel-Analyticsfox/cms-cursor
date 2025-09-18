import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../database/database.module';

// Services
import { CaseIdService } from './case-id.service';
import { PreLegalNoticeService } from './services/pre-legal-notice.service';
import { TriggerDetectionService } from './services/trigger-detection.service';
import { EventValidationService } from './services/event-validation.service';
import { TemplateEngineService } from './services/template-engine.service';
import { TemplateRenderingService } from './services/template-rendering.service';
import { LegalCaseService } from './services/legal-case.service';
import { DocumentManagementService } from './services/document-management.service';
import { DataIngestionHelperService } from './services/data-ingestion-helper.service';
import { BorrowerService } from './services/borrower.service';
import { CommunicationService } from './services/communication.service';
import { DeliveryTrackingService } from './services/delivery-tracking.service';
import { LegalCaseDocumentService } from './services/legal-case-document.service';
import { LegalCaseEnhancedService } from './services/legal-case-enhanced.service';
import { HybridStorageService } from './services/hybrid-storage.service';
import { AwsS3StorageService } from './services/aws-s3-storage.service';
import { EnhancedFileNamingService } from './services/enhanced-file-naming.service';

// Controllers
import { CaseIdController } from './case-id.controller';
import { PreLegalNoticeController } from './controllers/pre-legal-notice.controller';
import { TriggerDetectionController } from './controllers/trigger-detection.controller';
import { TemplateEngineController } from './controllers/template-engine.controller';
import { LegalCaseController } from './controllers/legal-case.controller';
import { DocumentManagementController } from './controllers/document-management.controller';
import { BorrowerController } from './controllers/borrower.controller';
import { LawyerManagementController } from './controllers/lawyer-management.controller';
import { DebugController } from './controllers/debug.controller';
import { LegalNoticeTemplateController } from './controllers/legal-notice-template.controller';
import { LawyerAssignmentService } from './services/lawyer-assignment.service';
import { LawyerService } from './services/lawyer.service';
import { NotificationService } from './services/notification.service';
import { StatusManagementService } from './services/status-management.service';
import { TimelineTrackingService } from './services/timeline-tracking.service';
import { LegalNoticeTemplateService } from './services/legal-notice-template.service';
import { CommunicationController } from './controllers/communication.controller';
import { LegalCaseDocumentController } from './controllers/legal-case-document.controller';
import { LegalCaseEnhancedController } from './controllers/legal-case-enhanced.controller';
import { StaticFilesController } from './controllers/static-files.controller';

@Module({
  imports: [ConfigModule, DrizzleModule],
  controllers: [
    CaseIdController,
    PreLegalNoticeController,
    TriggerDetectionController,
    TemplateEngineController,
    LegalCaseController,
    DocumentManagementController,
    BorrowerController,
    LawyerManagementController,
    DebugController,
    LegalNoticeTemplateController,
    CommunicationController,
    LegalCaseDocumentController,
    LegalCaseEnhancedController,
    StaticFilesController,
  ],
  providers: [
    // Core Services
    CaseIdService,
    PreLegalNoticeService,

    // UC001 Enhancement Services
    TriggerDetectionService,
    EventValidationService,
    TemplateEngineService,
    TemplateRenderingService,

    // UC003 Legal Case Management Services
    LegalCaseService,
    DataIngestionHelperService,

    // Borrower Management Services
    BorrowerService,

    // Document Management Services
    DocumentManagementService,

    // Lawyer Management Services
    LawyerAssignmentService,
    LawyerService,
    NotificationService,
    StatusManagementService,
    TimelineTrackingService,
    LegalNoticeTemplateService,

    // Communication Services
    CommunicationService,
    DeliveryTrackingService,

    // Document Management Services
    LegalCaseDocumentService,
    LegalCaseEnhancedService,
    HybridStorageService,
    AwsS3StorageService,
    EnhancedFileNamingService,
  ],
  exports: [
    // Export services for use in other modules
    CaseIdService,
    PreLegalNoticeService,
    TriggerDetectionService,
    EventValidationService,
    TemplateEngineService,
    TemplateRenderingService,
    LegalCaseService,
    DataIngestionHelperService,
    BorrowerService,
    DocumentManagementService,
    LawyerAssignmentService,
    LawyerService,
    NotificationService,
    StatusManagementService,
    TimelineTrackingService,
    LegalNoticeTemplateService,
    CommunicationService,
    DeliveryTrackingService,
    LegalCaseDocumentService,
    LegalCaseEnhancedService,
    HybridStorageService,
    AwsS3StorageService,
    EnhancedFileNamingService,
  ],
})
export class LegalModule {}
