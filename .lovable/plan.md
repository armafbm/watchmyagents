## What I confirmed

- The account `arma@talkytranslate.com` maps to **one single backend identity**, not two:
  - 1 auth user
  - 1 customer record
  - 1 operator-role row
  - all with the **same id**: `5f4c96ac-2398-4051-a256-f06b7479c710`
- That same account owns **5 agents** in the database.
- The dashboard aggregate views are also populated for that same id:
  - `dashboard_today_v` shows `agents_active = 5`
  - `loop_overview_v` returns the 5 agents
- The self-claim operator flow only adds a row to `user_roles`; it does **not** create a second account, change `customer_id`, or remap the session.

## Conclusion so far

The "operator claim created a second admin account" theory is **not the cause**.

The data exists and is attached to the correct account. The problem is almost certainly in the **client-side session/data-loading path**: the app is sometimes failing to resolve the signed-in user or failing to complete the browser fetches, then falling back to empty UI state.

I also found browser evidence of repeated `TypeError: Failed to fetch` errors coming from the preview runtime during auth/session calls, which matches the kind of symptom that would make the dashboard render 0 agents even while the database is correct.

## Plan

1. **Trace the failing browser requests precisely**
   - Reproduce the dashboard load for this account in the browser tools.
   - Identify which request fails first: auth session, user lookup, dashboard view, or agents query.
   - Compare preview behavior vs published domain behavior.

2. **Audit the dashboard’s silent-failure behavior**
   - Inspect where the dashboard currently converts missing or failed responses into `0` / empty arrays.
   - Check whether query errors are ignored instead of surfaced.
   - Verify whether auth is briefly `null` and prevents the fetch from running correctly.

3. **Harden the data-loading flow**
   - Replace fragile client-only reads with a safer authenticated server-backed read path where appropriate.
   - Ensure the dashboard shows explicit loading/error states instead of pretending there are zero agents.
   - Keep role checks separate from tenant/account identity so operator state cannot affect visibility.

4. **Validate with the affected account path**
   - Confirm the dashboard resolves the same `user.id` as the populated customer record.
   - Confirm the Protected Agents panel and KPI strip show the 5 existing agents.
   - Confirm no empty-state fallback appears when the backend call actually failed.

## Technical notes

- `claimFirstOperator` only does: `insert into user_roles (user_id = current user, role = 'operator')`
- Dashboard queries are already scoped by `customer_id = user.id`
- The weak spot is the current browser fetch path and its fallback behavior:
  - auth/session fetch instability in preview
  - missing error handling in dashboard reads
  - empty defaults masking real failures

If you approve, I’ll move to implementation and fix the loading path rather than touching the account data.