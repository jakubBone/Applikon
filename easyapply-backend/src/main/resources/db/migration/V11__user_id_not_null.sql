DELETE FROM stage_history
WHERE application_id IN (SELECT id FROM applications WHERE user_id IS NULL);

DELETE FROM notes
WHERE application_id IN (SELECT id FROM applications WHERE user_id IS NULL);

DELETE FROM applications WHERE user_id IS NULL;
DELETE FROM cvs WHERE user_id IS NULL;

ALTER TABLE applications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cvs ALTER COLUMN user_id SET NOT NULL;
