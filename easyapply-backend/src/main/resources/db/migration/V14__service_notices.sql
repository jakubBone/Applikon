CREATE TABLE service_notices (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(20)  NOT NULL,
    message_pl TEXT         NOT NULL,
    message_en TEXT         NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);
