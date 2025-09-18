import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  integer,
  uuid,
  boolean,
  date,
  jsonb,
  numeric,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

// Unified status enum for consistency
export const statusEnum = pgEnum('status', [
  'Active',
  'Inactive',
  'Draft',
  'Pending',
  'Completed',
  'Cancelled',
]);

// User Management Enums
export const userRoleEnum = pgEnum('user_role', ['TENANT_ADMIN', 'USER', 'MANAGER', 'SUPERVISOR']);

export const templateStatusEnum = pgEnum('template_status', ['Active', 'Inactive']);

// Legacy status enums (maintained for backward compatibility)
export const stateStatusEnum = statusEnum;
export const dpdBucketStatusEnum = statusEnum;
export const channelStatusEnum = statusEnum;
export const languageStatusEnum = statusEnum;
export const productStatusEnum = statusEnum;
export const schemaStatusEnum = statusEnum;

// ============================================================================
// LEGAL MODULE ENUMS
// ============================================================================

export const caseTypeEnum = pgEnum('case_type', [
  'Civil',
  'Criminal',
  'Arbitration',
  '138 Bounce',
  'SARFAESI',
]);

export const caseStatusEnum = pgEnum('case_status', [
  'Filed',
  'Under Trial',
  'Stayed',
  'Dismissed',
  'Resolved',
  'Closed',
]);

// Legal Case System Status Enum
export const legalCaseSystemStatusEnum = pgEnum('legal_case_system_status', [
  'Active',
  'Inactive',
  'Deleted',
]);

export const lawyerTypeEnum = pgEnum('lawyer_type', [
  'Internal',
  'External',
  'Senior',
  'Junior',
  'Associate',
]);

export const templateTypeEnum = pgEnum('template_type', [
  'Pre-Legal',
  'Legal',
  'Final Warning',
  'Arbitration',
  'Court Summon',
]);

export const noticeStatusEnum = pgEnum('notice_status', [
  'Draft',
  'Generated',
  'Sent',
  'Failed',
  'Acknowledged',
  'Inactive',
]);

export const triggerTypeEnum = pgEnum('trigger_type', [
  'DPD Threshold',
  'Payment Failure',
  'Manual Trigger',
  'Broken PTP',
  'Acknowledgement Pending',
]);

export const triggerSeverityEnum = pgEnum('trigger_severity', [
  'Low',
  'Medium',
  'High',
  'Critical',
]);

export const triggerStatusEnum = pgEnum('trigger_status', [
  'Open',
  'In Progress',
  'Escalated',
  'Resolved',
  'Closed',
]);

export const hearingTypeEnum = pgEnum('hearing_type', [
  'Appearance',
  'Filing',
  'Evidence',
  'Cross-Examination',
  'Judgment',
]);

export const hearingStatusEnum = pgEnum('hearing_status', [
  'Scheduled',
  'Attended',
  'Hearing Missed',
  'Rescheduled',
  'Adjourned',
  'Completed',
  'Cancelled',
]);

export const allocationStatusEnum = pgEnum('allocation_status', [
  'Active',
  'Completed',
  'Cancelled',
  'Reassigned',
]);

export const acknowledgementStatusEnum = pgEnum('acknowledgement_status', [
  'Acknowledged',
  'Rejected',
  'Pending',
  'Pending Verification',
]);

export const documentCategoryEnum = pgEnum('document_category', [
  'Legal Notice',
  'Court Order',
  'Affidavit',
  'Case Summary',
  'Proof',
  'Contract',
  'Identity Proof',
  'Address Proof',
  'Other',
]);

export const caseDocumentTypeEnum = pgEnum('case_document_type', [
  'Affidavit',
  'Summons',
  'Court Order',
  'Evidence',
  'Witness Statement',
  'Expert Report',
  'Medical Report',
  'Financial Statement',
  'Property Document',
  'Legal Notice',
  'Reply Notice',
  'Counter Affidavit',
  'Interim Order',
  'Final Order',
  'Judgment',
  'Settlement Agreement',
  'Compromise Deed',
  'Power of Attorney',
  'Authorization Letter',
  'Identity Proof',
  'Address Proof',
  'Income Proof',
  'Bank Statement',
  'Loan Agreement',
  'Security Document',
  'Other',
]);

export const documentStatusEnum = pgEnum('document_status', [
  'Active',
  'Archived',
  'Deleted',
  'Pending_approval',
  'Rejected',
]);

export const recoveryActionEnum = pgEnum('recovery_action', [
  'Repossession',
  'Settlement',
  'Warrant Issued',
  'None',
]);

// ============================================================================
// CORE TABLES (TENANT & USERS)
// ============================================================================

export const tenant = pgTable('tenant', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  mobile: text('mobile').notNull(),
  role: userRoleEnum('role').notNull().default('USER'),
  address: text('address'),
  keycloakId: text('keycloak_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// MASTER DATA SCHEMAS
// ============================================================================

// 1. State Master
export const stateMaster = pgTable('state_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  stateCode: text('state_code').notNull().unique(),
  stateName: text('state_name').notNull(),
  stateId: text('state_id').notNull().unique(),
  status: stateStatusEnum('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 2. DPD Bucket Master
export const dpdBucketMaster = pgTable('dpd_bucket_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucketId: text('bucket_id').notNull().unique(),
  bucketName: text('bucket_name').notNull(),
  rangeStart: integer('range_start').notNull(), // T-6
  rangeEnd: integer('range_end').notNull(), // T+4
  minDays: integer('min_days').notNull(),
  maxDays: integer('max_days').notNull(),
  module: text('module').notNull(), // Digital/Call Centre/etc
  status: dpdBucketStatusEnum('status').notNull().default('Active'),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// DPD Buckets (alias for compatibility)
export const dpdBuckets = dpdBucketMaster;

// 3. Channel Master
export const channelMaster = pgTable('channel_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: text('channel_id').notNull().unique(),
  channelName: text('channel_name').notNull(), // 'SMS', 'WhatsApp', 'IVR', 'Email'
  channelType: text('channel_type'), // field temporary null, removed from requirements
  status: channelStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 4. Language Master
export const languageMaster = pgTable('language_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  languageCode: text('language_code').notNull().unique(),
  languageName: text('language_name').notNull(),
  scriptSupport: text('script_support').notNull(), // Latin, Devanagari, etc.
  status: languageStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 5. Template Master
export const templateMaster = pgTable('template_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: text('template_id').notNull().unique(),
  templateName: text('template_name').notNull(),
  messageBody: text('message_body').notNull(),
  templateType: templateTypeEnum('template_type').notNull(),
  status: templateStatusEnum('status').notNull().default('Active'),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channelMaster.id),
  languageId: uuid('language_id')
    .notNull()
    .references(() => languageMaster.id),

  // SMS API integration fields
  smsTemplateId: integer('sms_template_id'),
  dltTemplateId: text('dlt_template_id'),
  isApproved: boolean('is_approved').default(false),
  isActive: boolean('is_active').default(false),

  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 6. Product Hierarchy

// 6.1 Product Group Master
export const productGroupMaster = pgTable('product_group_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: text('group_id').notNull().unique(),
  groupName: text('group_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 6.2 Product Type Master
export const productTypeMaster = pgTable('product_type_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  typeId: text('type_id').notNull().unique(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => productGroupMaster.id),
  typeName: text('type_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 6.3 Product Subtype Master
export const productSubtypeMaster = pgTable('product_subtype_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtypeId: text('subtype_id').notNull().unique(),
  typeId: uuid('type_id')
    .notNull()
    .references(() => productTypeMaster.id),
  subtypeName: text('subtype_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 6.4 Product Variant Master
export const productVariantMaster = pgTable('product_variant_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: text('variant_id').notNull().unique(),
  subtypeId: uuid('subtype_id')
    .notNull()
    .references(() => productSubtypeMaster.id),
  variantName: text('variant_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// 7. Schema Configuration
export const schemaConfiguration = pgTable('schema_configuration', {
  id: uuid('id').primaryKey().defaultRandom(),
  schemaName: text('schema_name').notNull().unique(),
  sourceType: text('source_type').notNull(), // Manual, SFTP, API, LMS
  status: schemaStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// ============================================================================
// LEGAL MODULE TABLES
// ============================================================================

// Courts
export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom(),
  courtCode: text('court_code').notNull().unique(),
  courtName: text('court_name').notNull(),
  courtType: text('court_type').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  stateId: uuid('state_id')
    .notNull()
    .references(() => stateMaster.id),
  address: text('address'),
  contactInfo: text('contact_info'),
  status: statusEnum('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Document Types
export const documentTypes = pgTable('document_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  docTypeCode: text('doc_type_code').notNull().unique(),
  docTypeName: text('doc_type_name').notNull(),
  docCategory: documentCategoryEnum('doc_category').notNull(),
  isConfidential: boolean('is_confidential').default(false),
  maxFileSizeMb: integer('max_file_size_mb').default(10),
  allowedFormats: text('allowed_formats'),
  description: text('description'),
  status: statusEnum('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// ============================================================================
// LAWYER MANAGEMENT SCHEMAS
// ============================================================================

// Lawyers Master Table
export const lawyers = pgTable('lawyers', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Lawyer Code - Auto-generated, Format: LAW-YYYYMMDD-Sequence
  lawyerCode: text('lawyer_code').notNull().unique(),
  // Personal Information
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  // Professional Information
  barNumber: text('bar_number').notNull().unique(),
  specialization: text('specialization').notNull(), // e.g., "Civil Law", "Criminal Law"
  experience: integer('experience').notNull(), // Years of experience
  lawyerType: lawyerTypeEnum('lawyer_type').notNull().default('Internal'),
  // Workload Management
  maxCases: integer('max_cases').notNull().default(10), // Maximum concurrent cases
  currentCases: integer('current_cases').notNull().default(0), // Current active cases
  // Availability
  isActive: boolean('is_active').notNull().default(true),
  isAvailable: boolean('is_available').notNull().default(true),
  // Location
  officeLocation: text('office_location').notNull(),
  jurisdiction: text('jurisdiction').notNull(), // Courts they can practice in
  // Performance Metrics
  successRate: numeric('success_rate', { precision: 5, scale: 2 }).default('0.00'), // Percentage
  averageCaseDuration: integer('average_case_duration').default(0), // Days
  // Audit fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Case Assignments Table
export const caseAssignments = pgTable('case_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => legalCases.id, { onDelete: 'cascade' }),
  lawyerId: uuid('lawyer_id')
    .notNull()
    .references(() => lawyers.id),
  assignedBy: text('assigned_by').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  assignmentReason: text('assignment_reason'), // Why this lawyer was chosen
  workloadScore: numeric('workload_score', { precision: 5, scale: 2 }), // Workload balancing score
  isActive: boolean('is_active').notNull().default(true),
  // Assignment status
  status: allocationStatusEnum('status').notNull().default('Active'),
  // Notes
  notes: text('notes'),
  // Audit fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Case Timeline Events Table
export const caseTimelineEvents = pgTable('case_timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => legalCases.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // Status Change, Hearing, Document, Assignment, etc.
  eventTitle: text('event_title').notNull(),
  eventDescription: text('event_description').notNull(),
  eventDate: timestamp('event_date').notNull(),
  eventData: jsonb('event_data'), // Additional event-specific data
  isMilestone: boolean('is_milestone').notNull().default(false),
  tags: text('tags').array().default([]),
  // Audit fields
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientId: text('recipient_id').notNull(), // User ID, Lawyer ID, or Admin ID
  recipientType: text('recipient_type').notNull(), // 'lawyer', 'admin', 'user'
  title: text('title').notNull(),
  message: text('message').notNull(),
  notificationType: text('notification_type').notNull(), // 'lawyer_assigned', 'status_change', etc.
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  relatedEntityType: text('related_entity_type'), // 'Legal Case', 'Document', etc.
  relatedEntityId: text('related_entity_id'), // UUID of related entity
  actionUrl: text('action_url'), // URL to navigate to when notification is clicked
  expiresAt: timestamp('expires_at'), // Optional expiration date
  // Audit fields
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

// ============================================================================
// DATA INGESTION SCHEMAS
// ============================================================================

// Legal Cases - Updated to match BRD UC003 requirements exactly
export const legalCases = pgTable('legal_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Case ID - Auto-generated, Format: LC-YYYYMMDD-Sequence
  caseId: text('case_id').notNull().unique(),
  // Loan Account Number - References data_ingestion_validated table
  loanAccountNumber: text('loan_account_number').notNull(),
  // Borrower Name - Fetched from data_ingestion_validated table
  borrowerName: text('borrower_name').notNull(),
  // Case Type - Dropdown, Civil, Criminal, Arbitration, 138 Bounce, SARFAESI
  caseType: caseTypeEnum('case_type').notNull(),
  // Court Name - Text, Court where the case is filed, Max 100 characters
  courtName: text('court_name').notNull(),
  // Case Filed Date - Date Picker, Date of formal case filing, Cannot be future-dated
  caseFiledDate: date('case_filed_date').notNull(),
  // Lawyer Assigned - Dropdown, Legal counsel responsible for the case, From registered lawyer master
  lawyerAssignedId: uuid('lawyer_assigned_id').references(() => lawyers.id),
  // Filing Jurisdiction - Text, Court location/state/district, Free text or linked to geo master
  filingJurisdiction: text('filing_jurisdiction').notNull(),
  // Current Status - Dropdown, Present legal state of the case
  currentStatus: caseStatusEnum('current_status').notNull().default('Filed'),
  // System Status - For soft deletion and system management
  status: legalCaseSystemStatusEnum('status').notNull().default('Active'),
  // Next Hearing Date - Date Picker, Scheduled date for next hearing, Must be today or later if provided
  nextHearingDate: date('next_hearing_date'),
  // Last Hearing Outcome - Text Area, Remarks or decisions from last hearing, Max 500 characters
  lastHearingOutcome: text('last_hearing_outcome'),
  // Case Documents - File Upload, Attachments for affidavits, summons, etc., PDF, JPG, DOCX formats allowed
  // Note: This will be handled by separate document repository table
  // Recovery Action Linked - Dropdown, If case resulted in any recovery action
  recoveryActionLinked: recoveryActionEnum('recovery_action_linked'),
  // Created By - Auto/User, User/system who created the case, Audit log maintained
  createdBy: text('created_by').notNull(),
  // Case Remarks - Text Area, Internal notes for tracking, Optional; Max 500 characters
  caseRemarks: text('case_remarks'),
  // Case Closure Date - Date, Date on which case was officially closed, Must be ≥ Case Filed Date
  caseClosureDate: date('case_closure_date'),
  // Outcome Summary - Text Area, Final decision or resolution notes, Optional
  outcomeSummary: text('outcome_summary'),
  // Standard audit fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'),
});

// Legal Notices
export const legalNotices = pgTable('legal_notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  noticeCode: text('notice_code').notNull().unique(),
  loanAccountNumber: text('loan_account_number').notNull(),
  dpdDays: integer('dpd_days').notNull(),
  triggerType: triggerTypeEnum('trigger_type').notNull(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => templateMaster.id),
  communicationMode: text('communication_mode').notNull(),
  stateId: uuid('state_id')
    .notNull()
    .references(() => stateMaster.id),
  languageId: uuid('language_id')
    .notNull()
    .references(() => languageMaster.id),
  noticeGenerationDate: timestamp('notice_generation_date').defaultNow(),
  noticeExpiryDate: date('notice_expiry_date').notNull(),
  legalEntityName: text('legal_entity_name').notNull(),
  issuedBy: text('issued_by').notNull(),
  acknowledgementRequired: boolean('acknowledgement_required').default(false),
  noticeStatus: noticeStatusEnum('notice_status').notNull().default('Draft'),
  documentPath: text('document_path'), // Path to generated PDF document
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Court Hearings
export const courtHearings = pgTable('court_hearings', {
  id: uuid('id').primaryKey().defaultRandom(),
  hearingCode: text('hearing_code').notNull().unique(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => legalCases.id),
  courtId: uuid('court_id')
    .notNull()
    .references(() => courts.id),
  hearingDate: date('hearing_date').notNull(),
  hearingTime: text('hearing_time'),
  hearingType: hearingTypeEnum('hearing_type').notNull(),
  assignedLawyerId: uuid('assigned_lawyer_id')
    .notNull()
    .references(() => lawyers.id),
  status: hearingStatusEnum('status').notNull().default('Scheduled'),
  outcomeNotes: text('outcome_notes'),
  reminderEnabled: boolean('reminder_enabled').default(true),
  reminderFrequency: text('reminder_frequency'),
  reminderRecipients: text('reminder_recipients').notNull(),
  notificationChannel: text('notification_channel').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Lawyer Allocations
export const lawyerAllocations = pgTable('lawyer_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  allocationCode: text('allocation_code').notNull().unique(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => legalCases.id),
  lawyerId: uuid('lawyer_id')
    .notNull()
    .references(() => lawyers.id),
  allocationDate: date('allocation_date').notNull(),
  allocatedBy: integer('allocated_by')
    .notNull()
    .references(() => users.id),
  reassignmentFlag: boolean('reassignment_flag').default(false),
  reassignmentReason: text('reassignment_reason'),
  status: allocationStatusEnum('status').notNull().default('Active'),
  lawyerAcknowledgement: boolean('lawyer_acknowledgement').default(false),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Notice Acknowledgements
export const noticeAcknowledgements = pgTable('notice_acknowledgements', {
  id: uuid('id').primaryKey().defaultRandom(),
  acknowledgementCode: text('acknowledgement_code').notNull().unique(),
  noticeId: uuid('notice_id')
    .notNull()
    .references(() => legalNotices.id),
  acknowledgedBy: text('acknowledged_by').notNull(),
  relationshipToBorrower: text('relationship_to_borrower'),
  acknowledgementDate: timestamp('acknowledgement_date').notNull(),
  acknowledgementMode: text('acknowledgement_mode').notNull(),
  proofOfAcknowledgement: text('proof_of_acknowledgement'),
  remarks: text('remarks'),
  capturedBy: integer('captured_by')
    .notNull()
    .references(() => users.id),
  geoLocation: text('geo_location'),
  acknowledgementStatus: acknowledgementStatusEnum('acknowledgement_status')
    .notNull()
    .default('Acknowledged'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Communication Tracking
export const communicationTracking = pgTable('communication_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingId: text('tracking_id').notNull().unique(),
  messageId: text('message_id').notNull().unique(),
  recipientId: text('recipient_id').notNull(),
  recipientType: text('recipient_type').notNull(), // 'borrower', 'lawyer', 'admin'
  communicationMode: text('communication_mode').notNull(), // 'SMS', 'Email', 'WhatsApp', 'Courier'
  messageContent: text('message_content').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  externalProviderId: text('external_provider_id'), // Provider's message ID
  externalProviderResponse: text('external_provider_response'),
  metadata: jsonb('metadata'), // Additional tracking data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Recovery Triggers
export const recoveryTriggers = pgTable('recovery_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  triggerCode: text('trigger_code').notNull().unique(),
  loanAccountNumber: text('loan_account_number').notNull(),
  triggerType: triggerTypeEnum('trigger_type').notNull(),
  triggerCriteria: text('trigger_criteria').notNull(),
  triggeredDateOn: timestamp('triggered_date_on').notNull(),
  triggerSeverity: triggerSeverityEnum('trigger_severity').notNull(),
  actionRequired: text('action_required').notNull(),
  assignedTo: integer('assigned_to').references(() => users.id),
  triggerStatus: triggerStatusEnum('trigger_status').notNull().default('Open'),
  dpdDays: integer('dpd_days'),
  outstandingAmount: text('outstanding_amount'),
  severity: triggerSeverityEnum('severity'),
  status: text('status'),
  metadata: text('metadata'),
  isActive: boolean('is_active').default(true),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Document Repository - Enhanced for Legal Case Management
export const documentRepository = pgTable('document_repository', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Document Code - Auto-generated unique identifier
  documentCode: text('document_code').notNull().unique(),
  // Linked Entity - What this document belongs to
  linkedEntityType: text('linked_entity_type').notNull(), // 'Legal Case', 'Legal Notice', 'Loan Account', 'Court Hearing'
  linkedEntityId: uuid('linked_entity_id').notNull(),
  // Document Details
  documentName: text('document_name').notNull(),
  documentTypeId: uuid('document_type_id')
    .notNull()
    .references(() => documentTypes.id),
  // File Information
  originalFileName: text('original_file_name').notNull(),
  fileFormat: text('file_format').notNull(), // PDF, DOCX, JPG, PNG, etc.
  fileSizeBytes: text('file_size_bytes').notNull(),
  fileSizeMb: text('file_size_mb').notNull(), // Human readable size
  // Storage Information
  filePath: text('file_path').notNull(), // Full path to stored file
  storageProvider: text('storage_provider').default('local'), // local, aws-s3, azure-blob, etc.
  storageBucket: text('storage_bucket'), // For cloud storage
  storageKey: text('storage_key'), // For cloud storage
  // Access Control
  accessPermissions: text('access_permissions').notNull(), // JSON array of roles/users
  confidentialFlag: boolean('confidential_flag').default(false),
  isPublic: boolean('is_public').default(false),
  // Version Control
  versionNumber: integer('version_number').default(1),
  parentDocumentId: uuid('parent_document_id').references(() => documentRepository.id), // For versioning
  isLatestVersion: boolean('is_latest_version').default(true),
  // Document Status
  documentStatusEnum: text('document_status').default('Active'), // active, archived, deleted
  // Metadata
  documentHash: text('document_hash'), // SHA-256 hash for integrity
  mimeType: text('mime_type'), // application/pdf, image/jpeg, etc.
  // Legal Case Specific Fields
  caseDocumentType: caseDocumentTypeEnum('case_document_type'), // Specific type for legal case documents
  hearingDate: date('hearing_date'), // If document is related to specific hearing
  documentDate: date('document_date'), // Date when document was created/issued
  // Audit Fields
  uploadDate: timestamp('upload_date').defaultNow(),
  uploadedBy: text('uploaded_by').notNull(), // User who uploaded
  lastAccessedAt: timestamp('last_accessed_at'),
  lastAccessedBy: text('last_accessed_by'),
  remarksTags: text('remarks_tags'), // JSON array of tags
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// Case ID Sequence Table - Specific for Legal Case ID generation
export const caseIdSequence = pgTable('case_id_sequence', {
  caseId: text('case_id').primaryKey(), // Auto-generated legal case identifier
  casePrefix: text('case_prefix').notNull(), // Standard prefix (LC, LEG, etc.)
  dateStamp: text('date_stamp').notNull(), // Date when case is being created (YYYYMMDD format)
  sequenceNumber: integer('sequence_number').notNull().default(1), // Incremental counter
  categoryCode: text('category_code'), // Optional: Loan Type or Region code
  finalCaseId: text('final_case_id').notNull(), // Computed: prefix + date + code + sequence
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

// ============================================================================
// Auto Notice Rule
export const autoNoticeSchema = pgTable('auto_notice_schedule_rule', {
  id: uuid('id').defaultRandom().primaryKey(),
  schedule_id: text('schedule_id'),
  schedule_name: text('schedule_name'),
  trigger_type: text('trigger_type'),
  trigger_value: text('trigger_value'),
  frequency: text('frequency'),
  day: text('day'),
  time: text('time'),
  applicable_notice_type: text('applicable_notice_type'),
  delivery_mode: text('delivery_mode'),
  template_id: text('template_id'),
  start_date: text('start_date'),
  end_date: text('end_date'),
  last_execution_date: text('last_execution_date'),
  next_execution_date: text('next_execution_date'),
  status: text('status'),
  remarks: text('remarks'),
  created_by: text('created_by'),
  created_at: timestamp('created_at'),
});

// Data Ingestion Failed
export const difSchema = pgTable('data_ingestion_failed', {
  id: uuid('id').defaultRandom().primaryKey(),
  rawData_id: uuid('rawData_id'),
  field_validation_id: uuid('field_validation_id'),
  record_id: text('record_id'),
  value: text('value'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Data Ingestion Validated
export const divSchema = pgTable('data_ingestion_validated', {
  id: uuid('id').defaultRandom().primaryKey(),
  rawData_id: uuid('rawData_id'),
  field_validation_id: uuid('field_validation_id'),
  record_id: text('record_id'),
  value: text('value'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Field Validation Format
export const fvfSchema = pgTable('field_validation_format', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: text('category'),
  field_name: text('field_name'),
  regex: text('regex'),
  message: text('message'),
  description: text('description'),
  digital: text('digital'),
  // call_center: text('call_center'),
  physical: text('physical'),
  legal: text('legal'),
  recorvery_and_repossession: text('recorvery_and_repossession'),
  settlement: text('settlement'),
  // createdAt: timestamp('created_at').defaultNow()
});

// Log Ingestion
export const logIngSchema = pgTable('logs_ingestion', {
  id: uuid('id').defaultRandom().primaryKey(),
  rawData_id: uuid('rawData_id'),
  uploaded_by: text('uploaded_by'),
  sourceType: text('sourceType'),
  sourceName: text('sourceName'),
  fileMetaData: jsonb('fileMetaData'),
  validationResult: text('validationResult'),
  duration: text('duration'),
  finalStatus: text('finalStatus'),
  systemLogs: text('systemLogs'),
  notificationSent: text('notificationSent'),
  timestamp: timestamp('timestamp'),
});

// Raw Ingestion Data
export const ridSchema = pgTable('raw_ingestion_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  uploaded_by: text('uploaded_by'),
  value: jsonb('value'),
  file_name: text('file_name'),
  createdAt: timestamp('created_at'),
  type: text('type'),
});

// Rule Tenant
export const ruleTenantSchema = pgTable('rules_tenant', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: text('tenant_id'),
  category: text('category'),
  field_name: text('field_name'),
  regex: text('regex'),
  message: text('message'),
  description: text('description'),
  digital: text('digital'),
  call_center: text('call_center'),
  physical: text('physical'),
  legal: text('legal'),
  recorvery_and_repossession: text('recorvery_and_repossession'),
  settlement: text('settlement'),
  createdAt: timestamp('created_at'),
});

// SFTP Credentials
export const sftpCredSchema = pgTable('sftp_cred', {
  host: text('host'),
  username: text('username'),
  password: text('password'),
  port: numeric('port'),
});

// ============================================================================
// RELATIONSHIPS
// ============================================================================

// Users belong to a tenant
export const usersRelations = {
  tenant: {
    fields: [users.tenantId],
    references: [tenant.id],
  },
};

// Templates reference channels and languages
export const templateRelations = {
  channel: {
    fields: [templateMaster.channelId],
    references: [channelMaster.id],
  },
  language: {
    fields: [templateMaster.languageId],
    references: [languageMaster.id],
  },
};

// Product hierarchy relationships
export const productRelations = {
  typeToGroup: {
    fields: [productTypeMaster.groupId],
    references: [productGroupMaster.id],
  },
  subtypeToType: {
    fields: [productSubtypeMaster.typeId],
    references: [productTypeMaster.id],
  },
  variantToSubtype: {
    fields: [productVariantMaster.subtypeId],
    references: [productSubtypeMaster.id],
  },
};

// Legal Module Relationships
export const legalRelations = {
  // Legal Cases relationships
  caseToLawyer: {
    fields: [legalCases.lawyerAssignedId],
    references: [lawyers.id],
  },

  // Legal Notices relationships - now uses loan account number directly
  noticeToTemplate: {
    fields: [legalNotices.templateId],
    references: [templateMaster.id],
  },
  noticeToUser: {
    fields: [legalNotices.issuedBy],
    references: [users.id],
  },

  // Court Hearings relationships
  hearingToCase: {
    fields: [courtHearings.caseId],
    references: [legalCases.id],
  },
  hearingToCourt: {
    fields: [courtHearings.courtId],
    references: [courts.id],
  },
  hearingToLawyer: {
    fields: [courtHearings.assignedLawyerId],
    references: [lawyers.id],
  },

  // Lawyer Allocations relationships
  allocationToCase: {
    fields: [lawyerAllocations.caseId],
    references: [legalCases.id],
  },
  allocationToLawyer: {
    fields: [lawyerAllocations.lawyerId],
    references: [lawyers.id],
  },
  allocationToUser: {
    fields: [lawyerAllocations.allocatedBy],
    references: [users.id],
  },

  // Notice Acknowledgements relationships
  acknowledgementToNotice: {
    fields: [noticeAcknowledgements.noticeId],
    references: [legalNotices.id],
  },
  acknowledgementToUser: {
    fields: [noticeAcknowledgements.capturedBy],
    references: [users.id],
  },

  // Recovery Triggers relationships - now uses loan account number directly
  triggerToUser: {
    fields: [recoveryTriggers.assignedTo],
    references: [users.id],
  },

  // Document Repository relationships
  documentToType: {
    fields: [documentRepository.documentTypeId],
    references: [documentTypes.id],
  },
  documentToUser: {
    fields: [documentRepository.uploadedBy],
    references: [users.id],
  },

  // Courts relationships
  courtToState: {
    fields: [courts.stateId],
    references: [stateMaster.id],
  },

  // Data Ingestion relationships
  dataIngestionToFieldValidation: {
    fields: [divSchema.field_validation_id],
    references: [fvfSchema.id],
  },
  dataIngestionToRawData: {
    fields: [divSchema.rawData_id],
    references: [ridSchema.id],
  },
};
