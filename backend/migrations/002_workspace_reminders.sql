CREATE TABLE IF NOT EXISTS workspace_reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  period_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (organization_id, reminder_type, period_key)
);
CREATE INDEX IF NOT EXISTS workspace_reminder_due_idx ON workspace_reminder_deliveries(status, created_at);
