-- Migration to add 'Legal Case' and 'Legal Notice' to linked_entity_type enum
-- This fixes the enum constraint error when querying documents

-- Add new values to the existing enum
ALTER TYPE "linked_entity_type" ADD VALUE 'Legal Case';
ALTER TYPE "linked_entity_type" ADD VALUE 'Legal Notice';

