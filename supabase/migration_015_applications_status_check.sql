-- Migration 015: expand applications.status CHECK constraint
-- Problem: CHECK only allowed ('pending','confirmed','rejected')
--          Admin UI also uses 'contacted' and 'waitlist', causing silent update failures.
-- Fix: drop the old constraint and recreate with all valid values.

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending','contacted','confirmed','waitlist','rejected'));
