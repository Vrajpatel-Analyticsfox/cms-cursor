ALTER TABLE "legal_notice_templates" DROP CONSTRAINT "legal_notice_templates_channel_id_channel_master_id_fk";
--> statement-breakpoint
ALTER TABLE "legal_notice_templates" DROP COLUMN "channel_id";