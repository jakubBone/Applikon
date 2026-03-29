ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_salary_type_check;

UPDATE applications SET salary_type = 'GROSS' WHERE salary_type = 'BRUTTO';
UPDATE applications SET salary_type = 'NET'   WHERE salary_type = 'NETTO';
