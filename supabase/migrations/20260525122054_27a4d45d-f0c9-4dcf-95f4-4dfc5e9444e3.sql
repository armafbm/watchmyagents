-- Views with security_invoker
DROP VIEW IF EXISTS public.loop_overview_v;
CREATE VIEW public.loop_overview_v
WITH (security_invoker = on) AS
SELECT a.id AS agent_id,
       a.customer_id,
       a.display_name,
       COALESCE(sum(jsonb_array_length(s.payload -> 'ioc_hashes')) FILTER (WHERE s.window_start > (now() - interval '7 days')), 0::bigint) AS signals_7d,
       (SELECT count(*) FROM public.suggestions sg WHERE sg.agent_id = a.id AND sg.generated_at > (now() - interval '7 days')) AS suggestions_7d,
       (SELECT count(*) FROM public.suggestions sg WHERE sg.agent_id = a.id AND sg.status = 'accepted' AND sg.resolved_at > (now() - interval '7 days')) AS suggestions_accepted_7d,
       (SELECT count(*) FROM public.decisions d WHERE d.agent_id = a.id AND d.decided_at > (now() - interval '7 days')) AS decisions_7d,
       (SELECT count(*) FROM public.decisions d WHERE d.agent_id = a.id AND d.decision = ANY (ARRAY['deny','interrupt']) AND d.decided_at > (now() - interval '7 days')) AS enforcements_7d
FROM public.agents a
LEFT JOIN public.signals s ON s.agent_id = a.id
GROUP BY a.id;

DROP VIEW IF EXISTS public.dashboard_today_v;
CREATE VIEW public.dashboard_today_v
WITH (security_invoker = on) AS
SELECT c.id AS customer_id,
       count(DISTINCT a.id) FILTER (WHERE a.status = 'active') AS agents_active,
       COALESCE(sum((s.payload ->> 'tokens_total')::bigint) FILTER (WHERE s.window_start > (now() - interval '24 hours')), 0::numeric) AS tokens_24h,
       count(d.id) FILTER (WHERE d.decided_at > (now() - interval '24 hours')) AS actions_24h,
       count(d.id) FILTER (WHERE d.decided_at > (now() - interval '24 hours') AND d.decision = ANY (ARRAY['deny','interrupt'])) AS blocked_24h,
       (SELECT count(*) FROM public.suggestions sg WHERE sg.customer_id = c.id AND sg.status = 'pending') AS suggestions_pending
FROM public.customers c
LEFT JOIN public.agents a ON a.customer_id = c.id
LEFT JOIN public.signals s ON s.customer_id = c.id
LEFT JOIN public.decisions d ON d.customer_id = c.id
GROUP BY c.id;

-- Revoke SECURITY DEFINER function from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Realtime: lock channel subscriptions to the user's own scope.
-- Convention: clients subscribe to topic 'user:<auth.uid()>' as a private channel.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth users subscribe to own topic" ON realtime.messages;
CREATE POLICY "auth users subscribe to own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
);