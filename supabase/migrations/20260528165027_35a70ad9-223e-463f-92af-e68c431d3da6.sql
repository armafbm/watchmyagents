
ALTER TABLE public.suggestions
  ADD COLUMN IF NOT EXISTS risk_score int,
  ADD COLUMN IF NOT EXISTS risk_category text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS surface_type text,
  ADD COLUMN IF NOT EXISTS surface_ref text,
  ADD COLUMN IF NOT EXISTS confidence int,
  ADD COLUMN IF NOT EXISTS generated_by text,
  ADD COLUMN IF NOT EXISTS proposed_policy jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suggestions_risk_score_range') THEN
    ALTER TABLE public.suggestions
      ADD CONSTRAINT suggestions_risk_score_range
      CHECK (risk_score IS NULL OR (risk_score BETWEEN 0 AND 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suggestions_confidence_range') THEN
    ALTER TABLE public.suggestions
      ADD CONSTRAINT suggestions_confidence_range
      CHECK (confidence IS NULL OR (confidence BETWEEN 0 AND 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suggestions_surface_type_chk') THEN
    ALTER TABLE public.suggestions
      ADD CONSTRAINT suggestions_surface_type_chk
      CHECK (surface_type IS NULL OR surface_type IN ('agent','type','fleet'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS suggestions_customer_risk_idx
  ON public.suggestions (customer_id, risk_score DESC, generated_at DESC);
