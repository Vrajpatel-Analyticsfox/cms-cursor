-- Migration: Align Document Repository with BRD UC007 Requirements
-- Changes:
-- 1. Rename document_code to document_id
-- 2. Add linked_entity_type enum with BRD-specified values
-- 3. Add access_permission enum with BRD-specified values
-- 4. Update document_repository table constraints

-- Create new enums as per BRD specifications
CREATE TYPE "public"."linked_entity_type" AS ENUM('Borrower', 'Loan Account', 'Case ID');
CREATE TYPE "public"."access_permission" AS ENUM('Legal Officer', 'Admin', 'Compliance', 'Lawyer');

-- Rename document_code column to document_id
ALTER TABLE "document_repository" RENAME COLUMN "document_code" TO "document_id";

-- Update the unique constraint name
ALTER TABLE "document_repository" DROP CONSTRAINT "document_repository_document_code_unique";
ALTER TABLE "document_repository" ADD CONSTRAINT "document_repository_document_id_unique" UNIQUE("document_id");

-- Update linked_entity_type to use enum (first convert existing data)
-- Map existing values to BRD-specified values
UPDATE "document_repository" 
SET "linked_entity_type" = CASE 
  WHEN "linked_entity_type" = 'Legal Case' THEN 'Case ID'
  WHEN "linked_entity_type" = 'Legal Notice' THEN 'Case ID'
  WHEN "linked_entity_type" = 'Loan Account' THEN 'Loan Account'
  WHEN "linked_entity_type" = 'Court Hearing' THEN 'Case ID'
  ELSE 'Case ID' -- Default fallback
END;

-- Change column type to enum
ALTER TABLE "document_repository" 
ALTER COLUMN "linked_entity_type" TYPE "linked_entity_type" 
USING "linked_entity_type"::"linked_entity_type";

-- Add constraint to ensure only BRD-specified values
ALTER TABLE "document_repository" 
ADD CONSTRAINT "document_repository_linked_entity_type_check" 
CHECK ("linked_entity_type" IN ('Borrower', 'Loan Account', 'Case ID'));

-- Update access_permissions to validate against BRD-specified roles
-- First, clean up existing permissions to match BRD values
UPDATE "document_repository" 
SET "access_permissions" = CASE 
  WHEN "access_permissions" LIKE '%legal-team%' THEN '["Legal Officer"]'
  WHEN "access_permissions" LIKE '%admin%' THEN '["Admin"]'
  WHEN "access_permissions" LIKE '%lawyer%' THEN '["Lawyer"]'
  WHEN "access_permissions" LIKE '%compliance%' THEN '["Compliance"]'
  ELSE '["Legal Officer"]' -- Default fallback
END;

-- Add constraint to validate access permissions contain only BRD-specified roles
ALTER TABLE "document_repository" 
ADD CONSTRAINT "document_repository_access_permissions_check" 
CHECK (
  "access_permissions"::jsonb ? 'Legal Officer' OR
  "access_permissions"::jsonb ? 'Admin' OR
  "access_permissions"::jsonb ? 'Compliance' OR
  "access_permissions"::jsonb ? 'Lawyer'
);

-- Add comments for clarity
COMMENT ON COLUMN "document_repository"."document_id" IS 'BRD Format: LDR-YYYYMMDD-Sequence';
COMMENT ON COLUMN "document_repository"."linked_entity_type" IS 'BRD-specified: Borrower, Loan Account, Case ID';
COMMENT ON COLUMN "document_repository"."access_permissions" IS 'BRD-specified: Legal Officer, Admin, Compliance, Lawyer';
