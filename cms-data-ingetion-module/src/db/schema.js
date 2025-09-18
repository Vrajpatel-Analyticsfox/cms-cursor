// This is a simplified JavaScript version of the schema for seeding
// The actual schema is in schema.ts

const {
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
} = require('drizzle-orm/pg-core');

// Enums
const statusEnum = pgEnum('status', [
  'Active',
  'Inactive',
  'Draft',
  'Pending',
  'Completed',
  'Cancelled',
]);

const templateStatusEnum = pgEnum('template_status', ['Active', 'Inactive']);
const stateStatusEnum = statusEnum;
const dpdBucketStatusEnum = statusEnum;
const channelStatusEnum = statusEnum;
const languageStatusEnum = statusEnum;
const productStatusEnum = statusEnum;
const schemaStatusEnum = statusEnum;

const caseTypeEnum = pgEnum('case_type', [
  'Civil',
  'Criminal',
  'Arbitration',
  '138 Bounce',
  'SARFAESI',
]);

const caseStatusEnum = pgEnum('case_status', [
  'Filed',
  'Under Trial',
  'Stayed',
  'Dismissed',
  'Resolved',
  'Closed',
]);

const legalCaseSystemStatusEnum = pgEnum('legal_case_system_status', [
  'Active',
  'Inactive',
  'Deleted',
]);

const lawyerTypeEnum = pgEnum('lawyer_type', [
  'Internal',
  'External',
  'Senior',
  'Junior',
  'Associate',
]);

const noticeTypeEnum = pgEnum('notice_type', [
  'Pre-Legal',
  'Legal',
  'Final Warning',
  'Arbitration',
  'Court Summon',
]);

const noticeStatusEnum = pgEnum('notice_status', [
  'Draft',
  'Generated',
  'Sent',
  'Failed',
  'Acknowledged',
  'Inactive',
]);

const triggerTypeEnum = pgEnum('trigger_type', [
  'DPD Threshold',
  'Payment Failure',
  'Manual Trigger',
  'Broken PTP',
  'Acknowledgement Pending',
]);

const recoveryActionEnum = pgEnum('recovery_action', [
  'None',
  'Asset Seizure',
  'Property Auction',
  'Bank Account Freeze',
  'Salary Attachment',
  'Other',
]);

const hearingTypeEnum = pgEnum('hearing_type', [
  'First Hearing',
  'Regular Hearing',
  'Final Hearing',
  'Appeal Hearing',
  'Interim Hearing',
]);

const hearingStatusEnum = pgEnum('hearing_status', [
  'Scheduled',
  'Completed',
  'Adjourned',
  'Cancelled',
  'Postponed',
]);

const allocationStatusEnum = pgEnum('allocation_status', [
  'Active',
  'Inactive',
  'Transferred',
  'Completed',
]);

const acknowledgementStatusEnum = pgEnum('acknowledgement_status', [
  'Acknowledged',
  'Not Acknowledged',
  'Partially Acknowledged',
  'Disputed',
]);

const triggerSeverityEnum = pgEnum('trigger_severity', ['Low', 'Medium', 'High', 'Critical']);

const triggerStatusEnum = pgEnum('trigger_status', [
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
  'Escalated',
]);

const documentCategoryEnum = pgEnum('document_category', [
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

// Tables
const stateMaster = pgTable('state_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  stateCode: text('state_code').notNull().unique(),
  stateName: text('state_name').notNull(),
  stateId: text('state_id').notNull().unique(),
  status: stateStatusEnum('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const dpdBucketMaster = pgTable('dpd_bucket_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucketId: text('bucket_id').notNull().unique(),
  bucketName: text('bucket_name').notNull(),
  rangeStart: integer('range_start').notNull(),
  rangeEnd: integer('range_end').notNull(),
  minDays: integer('min_days').notNull(),
  maxDays: integer('max_days').notNull(),
  module: text('module').notNull(),
  status: dpdBucketStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const channelMaster = pgTable('channel_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: text('channel_id').notNull().unique(),
  channelName: text('channel_name').notNull(),
  channelType: text('channel_type').notNull(),
  status: channelStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const languageMaster = pgTable('language_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  languageCode: text('language_code').notNull().unique(),
  languageName: text('language_name').notNull(),
  scriptSupport: text('script_support').notNull(),
  status: languageStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const templateMaster = pgTable('template_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: text('template_id').notNull().unique(),
  templateName: text('template_name').notNull(),
  messageBody: text('message_body').notNull(),
  templateType: noticeTypeEnum('template_type').notNull(),
  status: templateStatusEnum('status').notNull().default('Active'),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channelMaster.id),
  languageId: uuid('language_id')
    .notNull()
    .references(() => languageMaster.id),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by'),
});

const productGroupMaster = pgTable('product_group_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: text('group_id').notNull().unique(),
  groupName: text('group_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const productTypeMaster = pgTable('product_type_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  typeId: text('type_id').notNull().unique(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => productGroupMaster.id),
  typeName: text('type_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const productSubtypeMaster = pgTable('product_subtype_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtypeId: text('subtype_id').notNull().unique(),
  typeId: uuid('type_id')
    .notNull()
    .references(() => productTypeMaster.id),
  subtypeName: text('subtype_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const productVariantMaster = pgTable('product_variant_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: text('variant_id').notNull().unique(),
  subtypeId: uuid('subtype_id')
    .notNull()
    .references(() => productSubtypeMaster.id),
  variantName: text('variant_name').notNull(),
  status: productStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const schemaConfiguration = pgTable('schema_configuration', {
  id: uuid('id').primaryKey().defaultRandom(),
  schemaName: text('schema_name').notNull().unique(),
  sourceType: text('source_type').notNull(),
  status: schemaStatusEnum('status').notNull().default('Active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const courts = pgTable('courts', {
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
  createdBy: text('created_by').notNull(),
});

const documentTypes = pgTable('document_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  docTypeCode: text('doc_type_code').notNull().unique(),
  docTypeName: text('doc_type_name').notNull(),
  docCategory: documentCategoryEnum('doc_category').notNull(),
  isConfidential: boolean('is_confidential').notNull().default(false),
  maxFileSizeMb: integer('max_file_size_mb').notNull(),
  allowedFormats: text('allowed_formats').notNull(),
  description: text('description'),
  status: statusEnum('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

const lawyers = pgTable('lawyers', {
  id: uuid('id').primaryKey().defaultRandom(),
  lawyerCode: text('lawyer_code').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  barNumber: text('bar_number').notNull().unique(),
  specialization: text('specialization').notNull(),
  experience: integer('experience').notNull(),
  lawyerType: lawyerTypeEnum('lawyer_type').notNull(),
  maxCases: integer('max_cases').notNull(),
  currentCases: integer('current_cases').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isAvailable: boolean('is_available').notNull().default(true),
  officeLocation: text('office_location').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  successRate: text('success_rate').notNull(),
  averageCaseDuration: integer('average_case_duration').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

module.exports = {
  stateMaster,
  dpdBucketMaster,
  channelMaster,
  languageMaster,
  templateMaster,
  productGroupMaster,
  productTypeMaster,
  productSubtypeMaster,
  productVariantMaster,
  schemaConfiguration,
  courts,
  documentTypes,
  lawyers,
};
