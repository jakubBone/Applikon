ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_rejection_reason_check;

UPDATE applications SET rejection_reason = 'NO_RESPONSE'             WHERE rejection_reason = 'BRAK_ODPOWIEDZI';
UPDATE applications SET rejection_reason = 'EMAIL_REJECTION'          WHERE rejection_reason = 'ODMOWA_MAILOWA';
UPDATE applications SET rejection_reason = 'REJECTED_AFTER_INTERVIEW' WHERE rejection_reason = 'ODRZUCENIE_PO_ROZMOWIE';
UPDATE applications SET rejection_reason = 'OTHER'                    WHERE rejection_reason = 'INNE';