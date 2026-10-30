CREATE TABLE downloads (
    id bigserial PRIMARY KEY,
    platform text NOT NULL,
    quality text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
