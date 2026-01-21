-- V2__add_session_id.sql
-- Dodaje session_id dla izolacji danych userów (multi-tenant demo mode)

-- Dodaj kolumnę session_id do applications
ALTER TABLE applications ADD COLUMN session_id VARCHAR(50);

-- Dodaj kolumnę session_id do cvs
ALTER TABLE cvs ADD COLUMN session_id VARCHAR(50);

-- Indeksy dla szybkiego filtrowania po session_id
CREATE INDEX idx_applications_session_id ON applications(session_id);
CREATE INDEX idx_cvs_session_id ON cvs(session_id);

-- Indeks złożony dla częstych zapytań
CREATE INDEX idx_applications_session_status ON applications(session_id, status);
