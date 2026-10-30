CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url text NOT NULL,
    platform text NOT NULL,
    format_id text NOT NULL,
    amount_cents int NOT NULL DEFAULT 200,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
    provider_ref text,
    created_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz
);
