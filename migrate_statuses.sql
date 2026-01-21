-- Migracja statusów do nowego systemu
-- Uruchom ten skrypt w PostgreSQL

-- Zamień stare statusy na nowe:
-- ROZMOWA -> W_PROCESIE
-- ZADANIE -> W_PROCESIE
-- ODRZUCONE -> ODMOWA
-- WYSLANE -> WYSLANE (bez zmian)
-- OFERTA -> OFERTA (bez zmian)

UPDATE applications SET status = 'W_PROCESIE' WHERE status = 'ROZMOWA';
UPDATE applications SET status = 'W_PROCESIE' WHERE status = 'ZADANIE';
UPDATE applications SET status = 'ODMOWA' WHERE status = 'ODRZUCONE';

-- Sprawdź wynik
SELECT status, COUNT(*) FROM applications GROUP BY status;
