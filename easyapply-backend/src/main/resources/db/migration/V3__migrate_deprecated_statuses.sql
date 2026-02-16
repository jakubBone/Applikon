-- V3__migrate_deprecated_statuses.sql
-- Migrate deprecated ApplicationStatus values to current ones and clean up enum

-- ROZMOWA (interview) and ZADANIE (task/assignment) both map to W_PROCESIE (in progress)
UPDATE applications
SET status = 'W_PROCESIE'
WHERE status IN ('ROZMOWA', 'ZADANIE');

-- ODRZUCONE (rejected - old name) maps to ODMOWA (rejection - current name)
UPDATE applications
SET status = 'ODMOWA'
WHERE status = 'ODRZUCONE';

-- Add a check constraint to prevent deprecated values from ever being inserted again
ALTER TABLE applications
    DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
    ADD CONSTRAINT applications_status_check
        CHECK (status IN ('WYSLANE', 'W_PROCESIE', 'OFERTA', 'ODMOWA'));
