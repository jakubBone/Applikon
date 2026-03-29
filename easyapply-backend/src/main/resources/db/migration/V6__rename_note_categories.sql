UPDATE notes SET category = 'QUESTIONS' WHERE category IN ('PYTANIA', 'PYTANIE');
UPDATE notes SET category = 'OTHER'     WHERE category IN ('INNE', 'KONTAKT');
