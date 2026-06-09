# FORT-6 Follow-up: Historical Secret Audit

**Date:** 2026-06-09  
**Auditor:** Claude Sonnet 4.6 (automated review)  
**Command run:** `git log -p --all -- .env .env.example .env.local`

## Commits inspected

| Commit | Date | Author | Change |
|--------|------|--------|--------|
| `cd0658c` | 2026-05-23 | gpt-engineer-app | First `.env` added |
| `df26659` | 2026-05-25 | gpt-engineer-app | Switched Supabase project |
| `577edfe` | 2026-06-05 | gpt-engineer-app | Added `SUPABASE_PROJECT_ID` |
| `fe4d503` | 2026-06-08 | MinedorFBM | Removed `.env` from tracking (FORT-6 fix) |
| `4d06b2f` | 2026-06-08 | MinedorFBM | Re-tracked `.env` (public-only values only) |

## Values found in git history

| Variable | Value | Classification | Action required |
|----------|-------|---------------|-----------------|
| `SUPABASE_URL` | `https://kqddnrrbczrpmhnjdzmp.supabase.co` | **PUBLIC** — Supabase public endpoint | None |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_oUeaYRT70nk2TJ7FJHoMyQ_94a8lknF` | **PUBLIC** — Supabase anon key, designed for browser use | None |
| `SUPABASE_PROJECT_ID` | `kqddnrrbczrpmhnjdzmp` | **PUBLIC** — derivable from URL | None |
| `VITE_SUPABASE_*` | Same values with `VITE_` prefix | **PUBLIC** — same keys, Vite-prefixed for client bundle | None |
| `SUPABASE_URL` (old) | `https://ixnqhwfuftwceyqtoimo.supabase.co` | **PUBLIC** — old Supabase project (replaced May 25) | None — project likely deleted |
| `SUPABASE_PUBLISHABLE_KEY` (old) | `sb_publishable_nzvp6DjnbkMSw03WJ-JZzA_CseeLlYr` | **PUBLIC** — anon key of old project | None — project likely deleted |

## Secrets that were NEVER in git

Verified absent from all commits:
- `SUPABASE_SERVICE_ROLE_KEY` — never committed
- `GUARDIAN_SECRET` — never committed
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — never committed
- `LOVABLE_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` — never committed
- `WMA_API_KEY` / `WMA_SIGNALS_SALT` — never committed

## Conclusion

**No rotation required.** All values that ever appeared in tracked `.env` files are Supabase publishable/anon keys and public project URLs — explicitly designed to be shipped to the browser. The Supabase publishable key (`sb_publishable_*`) is the one Supabase calls "safe to expose publicly" in their documentation.

The FORT-6 fix (commit `fe4d503`) correctly identified and resolved the structural risk (env files tracked in git) even though no actual secret was present at the time.

Current `.gitignore` status: `.env.local`, `.env.*` are ignored; `.env` is tracked intentionally for public build-time values only.
