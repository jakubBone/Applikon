-- V4__auth_schema.sql
-- Wprowadzenie autentykacji: tabela users + migracja session_id → user_id

-- =====================
-- TABELA USERS
-- =====================

CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 VARCHAR(255) NOT NULL UNIQUE,
    name                  VARCHAR(255) NOT NULL,
    google_id             VARCHAR(255) NOT NULL UNIQUE,
    refresh_token         VARCHAR(255),
    refresh_token_expiry  TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- =====================
-- MIGRACJA APPLICATIONS
-- =====================

-- Usuń stare dane demo (session_id nie da się zmapować na prawdziwych userów)
DELETE FROM stage_history
WHERE application_id IN (SELECT id FROM applications WHERE session_id IS NOT NULL);

DELETE FROM notes
WHERE application_id IN (SELECT id FROM applications WHERE session_id IS NOT NULL);

DELETE FROM applications WHERE session_id IS NOT NULL;

-- Dodaj kolumnę user_id (na razie nullable, bo istniejące wiersze mają null)
ALTER TABLE applications ADD COLUMN user_id UUID REFERENCES users(id);

-- Usuń kolumnę session_id i stare indeksy
DROP INDEX IF EXISTS idx_applications_session_id;
DROP INDEX IF EXISTS idx_applications_session_status;
ALTER TABLE applications DROP COLUMN session_id;

-- Indeks na nowej kolumnie
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);

-- =====================
-- MIGRACJA CVS
-- =====================

DELETE FROM cvs WHERE session_id IS NOT NULL;

ALTER TABLE cvs ADD COLUMN user_id UUID REFERENCES users(id);

DROP INDEX IF EXISTS idx_cvs_session_id;
ALTER TABLE cvs DROP COLUMN session_id;

CREATE INDEX idx_cvs_user_id ON cvs(user_id);
