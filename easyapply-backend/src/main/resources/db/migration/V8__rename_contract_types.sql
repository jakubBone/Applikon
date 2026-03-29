ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_contract_type_check;

UPDATE applications SET contract_type = 'EMPLOYMENT' WHERE contract_type = 'UOP';
UPDATE applications SET contract_type = 'MANDATE'    WHERE contract_type = 'UZ';
UPDATE applications SET contract_type = 'OTHER'      WHERE contract_type = 'INNA';
