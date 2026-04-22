-- V13__user_privacy_policy_accepted_at.sql
-- Faza 07 (rodo-minimum): śledzenie akceptacji polityki prywatności przez usera.
-- NULL oznacza że user jeszcze nie zaakceptował (świeża rejestracja).

ALTER TABLE users
    ADD COLUMN privacy_policy_accepted_at TIMESTAMP NULL;
