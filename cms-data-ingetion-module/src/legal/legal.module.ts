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
import { DocumentRepositoryService } from './document-repository/document-repository.service';
import { DataIngestionHelperService } from './services/data-ingestion-helper.service';
import { BorrowerService } from './services/borrower.service';
import { CommunicationService } from './services/communication.service';
import { DeliveryTrackingService } from './services/delivery-tracking.service';
import { LegalCaseDocumentService } from './document-repository/services/legal-case-document.service';
import { LegalCaseEnhancedService } from './services/legal-case-enhanced.service';
import { HybridStorageService } from './document-repository/services/hybrid-storage.service';
import { AwsS3StorageService } from './document-repository/services/aws-s3-storage.service';
import { EnhancedFileNamingService } from './document-repository/services/enhanced-file-naming.service';
import { EMailService } from '../services/email.services';
import { SmsService } from '../services/sms.services';

// Controllers
import { CaseIdController } from './case-id.controller';
import { PreLegalNoticeController } from './controllers/pre-legal-notice.controller';
import { TriggerDetectionController } from './controllers/trigger-detection.controller';
import { TemplateEngineController } from './controllers/template-engine.controller';
import { LegalCaseController } from './controllers/legal-case.controller';
import { DocumentManagementController } from './document-repository/document-repository.controller';
import { BorrowerController } from './controllers/borrower.controller';
import { DebugController } from './controllers/debug.controller';
import { LegalNoticeTemplateController } from './controllers/legal-notice-template.controller';
import { NotificationService } from './services/notification.service';
import { StatusManagementService } from './services/status-management.service';
import { TimelineTrackingService } from './services/timeline-tracking.service';
import { LegalNoticeTemplateService } from './services/legal-notice-template.service';
import { CommunicationController } from './controllers/communication.controller';
import { LegalCaseDocumentController } from './document-repository/controllers/legal-case-document.controller';
import { LegalCaseEnhancedController } from './controllers/legal-case-enhanced.controller';
import { StaticFilesController } from './controllers/static-files.controller';

// Error Handling Services and Controllers
import { ErrorHandlingService } from './error-handling/error-handling.service';
import {
  NotificationService as ErrorNotificationService,
  EscalationService,
} from './error-handling/services';
import { ErrorHandlingController } from './error-handling/error-handling.controller';

// Notice Acknowledgement Services and Controllers
import {
  NoticeAcknowledgementService,
  FileUploadService,
} from './notice-acknowledgements/services';
import { NoticeAcknowledgementController } from './notice-acknowledgements/notice-acknowledgement.controller';
import { FileManagementController } from './notice-acknowledgements/file-management.controller';

// Lawyer Allocation Services and Controllers (UC008)
import { LawyerAllocationService } from './lawyer-allocation/lawyer-allocation.service';
import { LawyerAllocationController } from './lawyer-allocation/lawyer-allocation.controller';
import {
  LawyerService,
  LawyerAssignmentService,
  LawyerManagementController,
} from './lawyer-allocation/lawyer-management';

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
    ErrorHandlingController,
    NoticeAcknowledgementController, // Added NoticeAcknowledgementController
    FileManagementController, // Added FileManagementController
    LawyerAllocationController, // Added LawyerAllocationController (UC008)
    LawyerManagementController, // Moved from services to lawyer-allocation/lawyer-management
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
    DocumentRepositoryService,

    // Lawyer Management Services (Moved to lawyer-allocation/lawyer-management)
    // LawyerAssignmentService, // Moved to lawyer-allocation/lawyer-management
    // LawyerService, // Moved to lawyer-allocation/lawyer-management
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

    // Communication Services
    EMailService,
    SmsService,

    // Error Handling Services (UC006)
    ErrorHandlingService,
    ErrorNotificationService,
    EscalationService,

    // Notice Acknowledgement Services (UC003)
    NoticeAcknowledgementService,
    FileUploadService,

    // Lawyer Allocation Services (UC008)
    LawyerAllocationService,
    LawyerService,
    LawyerAssignmentService,
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
    DocumentRepositoryService,
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

    // Error Handling Services (UC006)
    ErrorHandlingService,
    ErrorNotificationService,
    EscalationService,

    // Notice Acknowledgement Services (UC003)
    NoticeAcknowledgementService,
    FileUploadService,

    // Lawyer Allocation Services (UC008)
    LawyerAllocationService,
  ],
})
export class LegalModule {}
