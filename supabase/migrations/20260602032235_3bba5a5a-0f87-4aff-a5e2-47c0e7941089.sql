
ALTER TABLE public.policies
  ADD COLUMN mode text NOT NULL DEFAULT 'enforce'
  CHECK (mode IN ('enforce','shadow'));

CREATE INDEX IF NOT EXISTS idx_policies_customer_mode_enabled
  ON public.policies (customer_id, mode, enabled);

ALTER TABLE public.decisions
  ADD COLUMN mode text NOT NULL DEFAULT 'enforce'
  CHECK (mode IN ('enforce','shadow'));

CREATE INDEX IF NOT EXISTS idx_decisions_customer_mode_decided_at
  ON public.decisions (customer_id, mode, decided_at DESC);
