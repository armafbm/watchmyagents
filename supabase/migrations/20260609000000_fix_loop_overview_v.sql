-- Rewrite loop_overview_v to use proper aggregation subqueries instead of
-- 4 correlated subqueries per agent row, which caused O(n*4) query plans
-- and would have become extremely slow past ~50 agents.
CREATE OR REPLACE VIEW public.loop_overview_v AS
SELECT
  a.id           AS agent_id,
  a.customer_id,
  a.display_name,
  COALESCE(s7.ioc_count,                   0) AS signals_7d,
  COALESCE(sg7.suggestions_7d,             0) AS suggestions_7d,
  COALESCE(sg7.suggestions_accepted_7d,    0) AS suggestions_accepted_7d,
  COALESCE(d7.decisions_7d,               0) AS decisions_7d,
  COALESCE(d7.enforcements_7d,            0) AS enforcements_7d
FROM public.agents a

LEFT JOIN (
  SELECT
    agent_id,
    SUM(jsonb_array_length(payload -> 'ioc_hashes')) AS ioc_count
  FROM public.signals
  WHERE window_start > NOW() - INTERVAL '7 days'
  GROUP BY agent_id
) s7 ON s7.agent_id = a.id

LEFT JOIN (
  SELECT
    agent_id,
    COUNT(*)                                                                             AS suggestions_7d,
    COUNT(*) FILTER (WHERE status = 'accepted'
                       AND resolved_at > NOW() - INTERVAL '7 days')                     AS suggestions_accepted_7d
  FROM public.suggestions
  WHERE generated_at > NOW() - INTERVAL '7 days'
  GROUP BY agent_id
) sg7 ON sg7.agent_id = a.id

LEFT JOIN (
  SELECT
    agent_id,
    COUNT(*)                                                                             AS decisions_7d,
    COUNT(*) FILTER (WHERE decision IN ('deny', 'interrupt'))                            AS enforcements_7d
  FROM public.decisions
  WHERE decided_at > NOW() - INTERVAL '7 days'
  GROUP BY agent_id
) d7 ON d7.agent_id = a.id;
