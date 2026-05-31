ALTER TABLE public.agents
  ADD COLUMN enforcement_mode text NOT NULL DEFAULT 'sync_confirm'
  CHECK (enforcement_mode IN ('sync_confirm','sync_interrupt','detect_only'));