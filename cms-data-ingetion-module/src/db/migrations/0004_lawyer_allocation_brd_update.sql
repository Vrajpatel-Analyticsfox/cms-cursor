-- Migration: Update lawyer_allocations table to match BRD UC008 specifications
-- Date: 2025-01-23
-- Description: Add missing fields to lawyer_allocations table as per BRD requirements

-- Rename allocation_code to allocation_id to match BRD
ALTER TABLE "lawyer_allocations" RENAME COLUMN "allocation_code" TO "allocation_id";

-- Add jurisdiction field
ALTER TABLE "lawyer_allocations" ADD COLUMN "jurisdiction" text;

-- Add lawyer_type field  
ALTER TABLE "lawyer_allocations" ADD COLUMN "lawyer_type" text;

-- Update allocated_by to text instead of integer
ALTER TABLE "lawyer_allocations" ALTER COLUMN "allocated_by" TYPE text;

-- Add NOT NULL constraints for new required fields
ALTER TABLE "lawyer_allocations" ALTER COLUMN "jurisdiction" SET NOT NULL;
ALTER TABLE "lawyer_allocations" ALTER COLUMN "lawyer_type" SET NOT NULL;

-- Update unique constraint name
ALTER TABLE "lawyer_allocations" DROP CONSTRAINT "lawyer_allocations_allocation_code_unique";
ALTER TABLE "lawyer_allocations" ADD CONSTRAINT "lawyer_allocations_allocation_id_unique" UNIQUE("allocation_id");

-- Add comments for documentation
COMMENT ON COLUMN "lawyer_allocations"."allocation_id" IS 'Format: LAW-YYYYMMDD-Sequence';
COMMENT ON COLUMN "lawyer_allocations"."jurisdiction" IS 'Location/Court where the case will be heard';
COMMENT ON COLUMN "lawyer_allocations"."lawyer_type" IS 'Internal / External lawyer type';
COMMENT ON COLUMN "lawyer_allocations"."reassignment_reason" IS 'Mandatory only if reassignment is true (Max 500 characters)';
COMMENT ON COLUMN "lawyer_allocations"."remarks" IS 'Additional notes or context (Max 500 characters)';
