CREATE TYPE "public"."acknowledgement_status" AS ENUM('Acknowledged', 'Rejected', 'Pending', 'Pending Verification');--> statement-breakpoint
CREATE TYPE "public"."allocation_status" AS ENUM('Active', 'Completed', 'Cancelled', 'Reassigned');--> statement-breakpoint
CREATE TYPE "public"."case_document_type" AS ENUM('Affidavit', 'Summons', 'Court Order', 'Evidence', 'Witness Statement', 'Expert Report', 'Medical Report', 'Financial Statement', 'Property Document', 'Legal Notice', 'Reply Notice', 'Counter Affidavit', 'Interim Order', 'Final Order', 'Judgment', 'Settlement Agreement', 'Compromise Deed', 'Power of Attorney', 'Authorization Letter', 'Identity Proof', 'Address Proof', 'Income Proof', 'Bank Statement', 'Loan Agreement', 'Security Document', 'Other');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('Filed', 'Under Trial', 'Stayed', 'Dismissed', 'Resolved', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."case_type" AS ENUM('Civil', 'Criminal', 'Arbitration', '138 Bounce', 'SARFAESI');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('Active', 'Inactive', 'Draft', 'Pending', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('Legal Notice', 'Court Order', 'Affidavit', 'Case Summary', 'Proof', 'Contract', 'Identity Proof', 'Address Proof', 'Other');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('Active', 'Archived', 'Deleted', 'Pending_approval', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."hearing_status" AS ENUM('Scheduled', 'Attended', 'Hearing Missed', 'Rescheduled', 'Adjourned', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."hearing_type" AS ENUM('Appearance', 'Filing', 'Evidence', 'Cross-Examination', 'Judgment');--> statement-breakpoint
CREATE TYPE "public"."lawyer_type" AS ENUM('Internal', 'External', 'Senior', 'Junior', 'Associate');--> statement-breakpoint
CREATE TYPE "public"."legal_case_system_status" AS ENUM('Active', 'Inactive', 'Deleted');--> statement-breakpoint
CREATE TYPE "public"."notice_status" AS ENUM('Draft', 'Generated', 'Sent', 'Failed', 'Acknowledged', 'Inactive');--> statement-breakpoint
CREATE TYPE "public"."recovery_action" AS ENUM('Repossession', 'Settlement', 'Warrant Issued', 'None');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('Active', 'Inactive');--> statement-breakpoint
CREATE TYPE "public"."template_type" AS ENUM('Pre-Legal', 'Legal', 'Final Warning', 'Arbitration', 'Court Summon');--> statement-breakpoint
CREATE TYPE "public"."trigger_severity" AS ENUM('Low', 'Medium', 'High', 'Critical');--> statement-breakpoint
CREATE TYPE "public"."trigger_status" AS ENUM('Open', 'In Progress', 'Escalated', 'Resolved', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('DPD Threshold', 'Payment Failure', 'Manual Trigger', 'Broken PTP', 'Acknowledgement Pending');--> statement-breakpoint
CREATE TABLE "auto_notice_schedule_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" text,
	"schedule_name" text,
	"trigger_type" text,
	"trigger_value" text,
	"frequency" text,
	"day" text,
	"time" text,
	"applicable_notice_type" text,
	"delivery_mode" text,
	"template_id" text,
	"start_date" text,
	"end_date" text,
	"last_execution_date" text,
	"next_execution_date" text,
	"status" text,
	"remarks" text,
	"created_by" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "case_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"lawyer_id" uuid NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assignment_reason" text,
	"workload_score" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"status" "allocation_status" DEFAULT 'Active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "case_id_sequence" (
	"case_id" text PRIMARY KEY NOT NULL,
	"case_prefix" text NOT NULL,
	"date_stamp" text NOT NULL,
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"category_code" text,
	"final_case_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "case_timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_title" text NOT NULL,
	"event_description" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"event_data" jsonb,
	"is_milestone" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" text NOT NULL,
	"channel_name" text NOT NULL,
	"channel_type" text,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "channel_master_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "communication_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" text NOT NULL,
	"message_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"recipient_type" text NOT NULL,
	"communication_mode" text NOT NULL,
	"message_content" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"external_provider_id" text,
	"external_provider_response" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "communication_tracking_tracking_id_unique" UNIQUE("tracking_id"),
	CONSTRAINT "communication_tracking_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "court_hearings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hearing_code" text NOT NULL,
	"case_id" uuid NOT NULL,
	"court_id" uuid NOT NULL,
	"hearing_date" date NOT NULL,
	"hearing_time" text,
	"hearing_type" "hearing_type" NOT NULL,
	"assigned_lawyer_id" uuid NOT NULL,
	"status" "hearing_status" DEFAULT 'Scheduled' NOT NULL,
	"outcome_notes" text,
	"reminder_enabled" boolean DEFAULT true,
	"reminder_frequency" text,
	"reminder_recipients" text NOT NULL,
	"notification_channel" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "court_hearings_hearing_code_unique" UNIQUE("hearing_code")
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_code" text NOT NULL,
	"court_name" text NOT NULL,
	"court_type" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"state_id" uuid NOT NULL,
	"address" text,
	"contact_info" text,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "courts_court_code_unique" UNIQUE("court_code")
);
--> statement-breakpoint
CREATE TABLE "data_ingestion_failed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rawData_id" uuid,
	"field_validation_id" uuid,
	"record_id" text,
	"value" text,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_ingestion_validated" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rawData_id" uuid,
	"field_validation_id" uuid,
	"record_id" text,
	"value" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_code" text NOT NULL,
	"linked_entity_type" text NOT NULL,
	"linked_entity_id" uuid NOT NULL,
	"document_name" text NOT NULL,
	"document_type_id" uuid NOT NULL,
	"original_file_name" text NOT NULL,
	"file_format" text NOT NULL,
	"file_size_bytes" text NOT NULL,
	"file_size_mb" text NOT NULL,
	"file_path" text NOT NULL,
	"storage_provider" text DEFAULT 'local',
	"storage_bucket" text,
	"storage_key" text,
	"access_permissions" text NOT NULL,
	"confidential_flag" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"version_number" integer DEFAULT 1,
	"parent_document_id" uuid,
	"is_latest_version" boolean DEFAULT true,
	"document_status" text DEFAULT 'Active',
	"document_hash" text,
	"mime_type" text,
	"case_document_type" "case_document_type",
	"hearing_date" date,
	"document_date" date,
	"upload_date" timestamp DEFAULT now(),
	"uploaded_by" text NOT NULL,
	"last_accessed_at" timestamp,
	"last_accessed_by" text,
	"remarks_tags" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "document_repository_document_code_unique" UNIQUE("document_code")
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_type_code" text NOT NULL,
	"doc_type_name" text NOT NULL,
	"doc_category" "document_category" NOT NULL,
	"is_confidential" boolean DEFAULT false,
	"max_file_size_mb" integer DEFAULT 10,
	"allowed_formats" text,
	"description" text,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "document_types_doc_type_code_unique" UNIQUE("doc_type_code")
);
--> statement-breakpoint
CREATE TABLE "dpd_bucket_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket_id" text NOT NULL,
	"bucket_name" text NOT NULL,
	"range_start" integer NOT NULL,
	"range_end" integer NOT NULL,
	"min_days" integer NOT NULL,
	"max_days" integer NOT NULL,
	"module" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"is_active" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "dpd_bucket_master_bucket_id_unique" UNIQUE("bucket_id")
);
--> statement-breakpoint
CREATE TABLE "field_validation_format" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text,
	"field_name" text,
	"regex" text,
	"message" text,
	"description" text,
	"digital" text,
	"physical" text,
	"legal" text,
	"recorvery_and_repossession" text,
	"settlement" text
);
--> statement-breakpoint
CREATE TABLE "language_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language_id" text NOT NULL,
	"language_code" text NOT NULL,
	"language_name" text NOT NULL,
	"script_support" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "language_master_language_id_unique" UNIQUE("language_id"),
	CONSTRAINT "language_master_language_code_unique" UNIQUE("language_code")
);
--> statement-breakpoint
CREATE TABLE "lawyer_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allocation_code" text NOT NULL,
	"case_id" uuid NOT NULL,
	"lawyer_id" uuid NOT NULL,
	"allocation_date" date NOT NULL,
	"allocated_by" integer NOT NULL,
	"reassignment_flag" boolean DEFAULT false,
	"reassignment_reason" text,
	"status" "allocation_status" DEFAULT 'Active' NOT NULL,
	"lawyer_acknowledgement" boolean DEFAULT false,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "lawyer_allocations_allocation_code_unique" UNIQUE("allocation_code")
);
--> statement-breakpoint
CREATE TABLE "lawyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_code" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"bar_number" text NOT NULL,
	"specialization" text NOT NULL,
	"experience" integer NOT NULL,
	"lawyer_type" "lawyer_type" DEFAULT 'Internal' NOT NULL,
	"max_cases" integer DEFAULT 10 NOT NULL,
	"current_cases" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"office_location" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"success_rate" numeric(5, 2) DEFAULT '0.00',
	"average_case_duration" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "lawyers_lawyer_code_unique" UNIQUE("lawyer_code"),
	CONSTRAINT "lawyers_email_unique" UNIQUE("email"),
	CONSTRAINT "lawyers_bar_number_unique" UNIQUE("bar_number")
);
--> statement-breakpoint
CREATE TABLE "legal_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"loan_account_number" text NOT NULL,
	"borrower_name" text NOT NULL,
	"case_type" "case_type" NOT NULL,
	"court_name" text NOT NULL,
	"case_filed_date" date NOT NULL,
	"lawyer_assigned_id" uuid,
	"filing_jurisdiction" text NOT NULL,
	"current_status" "case_status" DEFAULT 'Filed' NOT NULL,
	"status" "legal_case_system_status" DEFAULT 'Active' NOT NULL,
	"next_hearing_date" date,
	"last_hearing_outcome" text,
	"recovery_action_linked" "recovery_action",
	"created_by" text NOT NULL,
	"case_remarks" text,
	"case_closure_date" date,
	"outcome_summary" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"updated_by" text,
	CONSTRAINT "legal_cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "legal_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notice_code" text NOT NULL,
	"loan_account_number" text NOT NULL,
	"dpd_days" integer NOT NULL,
	"trigger_type" "trigger_type" NOT NULL,
	"template_id" uuid NOT NULL,
	"communication_mode" text NOT NULL,
	"state_id" uuid NOT NULL,
	"language_id" uuid NOT NULL,
	"notice_generation_date" timestamp DEFAULT now(),
	"notice_expiry_date" date NOT NULL,
	"legal_entity_name" text NOT NULL,
	"issued_by" text NOT NULL,
	"acknowledgement_required" boolean DEFAULT false,
	"notice_status" "notice_status" DEFAULT 'Draft' NOT NULL,
	"document_path" text,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "legal_notices_notice_code_unique" UNIQUE("notice_code")
);
--> statement-breakpoint
CREATE TABLE "logs_ingestion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rawData_id" uuid,
	"uploaded_by" text,
	"sourceType" text,
	"sourceName" text,
	"fileMetaData" jsonb,
	"validationResult" text,
	"duration" text,
	"finalStatus" text,
	"systemLogs" text,
	"notificationSent" text,
	"timestamp" timestamp
);
--> statement-breakpoint
CREATE TABLE "notice_acknowledgements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acknowledgement_code" text NOT NULL,
	"notice_id" uuid NOT NULL,
	"acknowledged_by" text NOT NULL,
	"relationship_to_borrower" text,
	"acknowledgement_date" timestamp NOT NULL,
	"acknowledgement_mode" text NOT NULL,
	"proof_of_acknowledgement" text,
	"remarks" text,
	"captured_by" integer NOT NULL,
	"geo_location" text,
	"acknowledgement_status" "acknowledgement_status" DEFAULT 'Acknowledged' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "notice_acknowledgements_acknowledgement_code_unique" UNIQUE("acknowledgement_code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text NOT NULL,
	"recipient_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"notification_type" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"related_entity_type" text,
	"related_entity_id" text,
	"action_url" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_group_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" text NOT NULL,
	"group_name" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "product_group_master_group_id_unique" UNIQUE("group_id")
);
--> statement-breakpoint
CREATE TABLE "product_subtype_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtype_id" text NOT NULL,
	"type_id" uuid NOT NULL,
	"subtype_name" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "product_subtype_master_subtype_id_unique" UNIQUE("subtype_id")
);
--> statement-breakpoint
CREATE TABLE "product_type_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" text NOT NULL,
	"group_id" uuid NOT NULL,
	"type_name" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "product_type_master_type_id_unique" UNIQUE("type_id")
);
--> statement-breakpoint
CREATE TABLE "product_variant_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" text NOT NULL,
	"subtype_id" uuid NOT NULL,
	"variant_name" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "product_variant_master_variant_id_unique" UNIQUE("variant_id")
);
--> statement-breakpoint
CREATE TABLE "recovery_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger_code" text NOT NULL,
	"loan_account_number" text NOT NULL,
	"trigger_type" "trigger_type" NOT NULL,
	"trigger_criteria" text NOT NULL,
	"triggered_date_on" timestamp NOT NULL,
	"trigger_severity" "trigger_severity" NOT NULL,
	"action_required" text NOT NULL,
	"assigned_to" integer,
	"trigger_status" "trigger_status" DEFAULT 'Open' NOT NULL,
	"dpd_days" integer,
	"outstanding_amount" text,
	"severity" "trigger_severity",
	"status" text,
	"metadata" text,
	"is_active" boolean DEFAULT true,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "recovery_triggers_trigger_code_unique" UNIQUE("trigger_code")
);
--> statement-breakpoint
CREATE TABLE "raw_ingestion_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by" text,
	"value" jsonb,
	"file_name" text,
	"created_at" timestamp,
	"type" text
);
--> statement-breakpoint
CREATE TABLE "rules_tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text,
	"category" text,
	"field_name" text,
	"regex" text,
	"message" text,
	"description" text,
	"digital" text,
	"call_center" text,
	"physical" text,
	"legal" text,
	"recorvery_and_repossession" text,
	"settlement" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "schema_configuration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schema_name" text NOT NULL,
	"source_type" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "schema_configuration_schema_name_unique" UNIQUE("schema_name")
);
--> statement-breakpoint
CREATE TABLE "sftp_cred" (
	"host" text,
	"username" text,
	"password" text,
	"port" numeric
);
--> statement-breakpoint
CREATE TABLE "state_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_code" text NOT NULL,
	"state_name" text NOT NULL,
	"state_id" text NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "state_master_state_code_unique" UNIQUE("state_code"),
	CONSTRAINT "state_master_state_id_unique" UNIQUE("state_id")
);
--> statement-breakpoint
CREATE TABLE "template_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" text NOT NULL,
	"template_name" text NOT NULL,
	"message_body" text NOT NULL,
	"template_type" "template_type" NOT NULL,
	"status" "template_status" DEFAULT 'Active' NOT NULL,
	"channel_id" uuid NOT NULL,
	"language_id" uuid NOT NULL,
	"sms_template_id" integer,
	"dlt_template_id" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "template_master_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenant_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text NOT NULL,
	"role" text,
	"address" text,
	"keycloak_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_case_id_legal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."legal_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_timeline_events" ADD CONSTRAINT "case_timeline_events_case_id_legal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."legal_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_hearings" ADD CONSTRAINT "court_hearings_case_id_legal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."legal_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_hearings" ADD CONSTRAINT "court_hearings_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_hearings" ADD CONSTRAINT "court_hearings_assigned_lawyer_id_lawyers_id_fk" FOREIGN KEY ("assigned_lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_state_id_state_master_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_repository" ADD CONSTRAINT "document_repository_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_repository" ADD CONSTRAINT "document_repository_parent_document_id_document_repository_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."document_repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ADD CONSTRAINT "lawyer_allocations_case_id_legal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."legal_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ADD CONSTRAINT "lawyer_allocations_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ADD CONSTRAINT "lawyer_allocations_allocated_by_users_id_fk" FOREIGN KEY ("allocated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_lawyer_assigned_id_lawyers_id_fk" FOREIGN KEY ("lawyer_assigned_id") REFERENCES "public"."lawyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_notices" ADD CONSTRAINT "legal_notices_template_id_template_master_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_notices" ADD CONSTRAINT "legal_notices_state_id_state_master_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_notices" ADD CONSTRAINT "legal_notices_language_id_language_master_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."language_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_acknowledgements" ADD CONSTRAINT "notice_acknowledgements_notice_id_legal_notices_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."legal_notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_acknowledgements" ADD CONSTRAINT "notice_acknowledgements_captured_by_users_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_subtype_master" ADD CONSTRAINT "product_subtype_master_type_id_product_type_master_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."product_type_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_type_master" ADD CONSTRAINT "product_type_master_group_id_product_group_master_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_group_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_master" ADD CONSTRAINT "product_variant_master_subtype_id_product_subtype_master_id_fk" FOREIGN KEY ("subtype_id") REFERENCES "public"."product_subtype_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_triggers" ADD CONSTRAINT "recovery_triggers_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_master" ADD CONSTRAINT "template_master_channel_id_channel_master_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_master" ADD CONSTRAINT "template_master_language_id_language_master_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."language_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;