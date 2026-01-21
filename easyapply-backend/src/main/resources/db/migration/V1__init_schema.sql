-- V1__init_schema.sql
-- Initial database schema for EasyApply

-- Create CVs table
CREATE TABLE IF NOT EXISTS cvs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) DEFAULT 'FILE',
    file_name VARCHAR(255),
    original_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    external_url VARCHAR(500),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Applications table
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    link VARCHAR(500),
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10),
    salary_type VARCHAR(50),
    contract_type VARCHAR(50),
    salary_source VARCHAR(50),
    source VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'WYSLANE',
    job_description TEXT,
    agency VARCHAR(255),
    cv_id BIGINT REFERENCES cvs(id),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_stage VARCHAR(255),
    rejection_reason VARCHAR(100),
    rejection_details TEXT
);

-- Create Notes table
CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    category VARCHAR(255) DEFAULT 'INNE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Stage History table
CREATE TABLE IF NOT EXISTS stage_history (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_name VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- =====================
-- INDEXES
-- =====================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_company_position ON applications(company, position);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_application_id ON notes(application_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Stage History indexes
CREATE INDEX IF NOT EXISTS idx_stage_history_application_id ON stage_history(application_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_created_at ON stage_history(created_at);

-- CVs indexes
CREATE INDEX IF NOT EXISTS idx_cvs_uploaded_at ON cvs(uploaded_at DESC);
