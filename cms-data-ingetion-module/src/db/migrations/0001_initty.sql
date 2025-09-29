ALTER TABLE "case_assignments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "case_assignments" ALTER COLUMN "status" SET DEFAULT 'Active'::text;--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ALTER COLUMN "status" SET DEFAULT 'Active'::text;--> statement-breakpoint
DROP TYPE "public"."allocation_status";--> statement-breakpoint
CREATE TYPE "public"."allocation_status" AS ENUM('Active', 'Inactive', 'Reassigned');--> statement-breakpoint
ALTER TABLE "case_assignments" ALTER COLUMN "status" SET DEFAULT 'Active'::"public"."allocation_status";--> statement-breakpoint
ALTER TABLE "case_assignments" ALTER COLUMN "status" SET DATA TYPE "public"."allocation_status" USING "status"::"public"."allocation_status";--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ALTER COLUMN "status" SET DEFAULT 'Active'::"public"."allocation_status";--> statement-breakpoint
ALTER TABLE "lawyer_allocations" ALTER COLUMN "status" SET DATA TYPE "public"."allocation_status" USING "status"::"public"."allocation_status";