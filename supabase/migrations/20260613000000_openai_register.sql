ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS enforcement_delivered boolean;

COMMENT ON COLUMN public.decisions.enforcement_delivered IS
  'true=block appliqué; false=enforcement échoué (dégradé); null=allow/shadow';
