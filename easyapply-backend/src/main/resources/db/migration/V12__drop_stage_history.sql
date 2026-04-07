ALTER TABLE applications DROP CONSTRAINT IF EXISTS fk_applications_stage_history;
ALTER TABLE cvs DROP CONSTRAINT IF EXISTS fk_cvs_stage_history;
DROP TABLE IF EXISTS stage_history;