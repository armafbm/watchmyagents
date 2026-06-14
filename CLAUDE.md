# WatchMyAgents Fortress — Contexte Claude

Ce fichier est chargé automatiquement à chaque session Claude dans ce repo.

## Projet
SaaS cybersécurité pour agents IA. Stack: **TanStack Start (SSR React) + Cloudflare Workers + Supabase + Resend + Stripe**.
- Repo: `armafbm/watchmyagents-Fortress`
- Local: `/Users/mac/Documents/REPOSITORIE WMA/watchmyagents-Fortress/`
- URL prod: `https://watchmyagents.com`
- Déployer: `npm run build && npx wrangler deploy`

## Infrastructure
| Service | Détail |
|---------|--------|
| Cloudflare Worker | `watchmyagents-fortress`, account `8c367eeb11a4a6207ca82a0a95d3b4bd` |
| Supabase | project ref `fgcmjkgxrkprsllivmli` — **NE JAMAIS utiliser l'ancien `kqddnrrbczrpmhnjdzmp`** |
| Resend | domaine `watchmyagents.com` vérifié |
| Stripe | direct API (plus de gateway Lovable), secret `STRIPE_SECRET_KEY` dans Cloudflare secrets |

## Secrets Cloudflare (déjà configurés)
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` = `whsec_XzdvhVkNgJu2KReRXofTuslymuMHEzDM`
- `SUPABASE_SERVICE_ROLE_KEY`

## Règles importantes
- **Ne jamais mettre de secrets dans le chat**
- **Proposer `git push` avant de l'exécuter** — attendre confirmation
- **Valider chaque étape avant de passer à la suivante**
- Réponses courtes et commandes copiables

---

## Journal de bord — Ce qui a été fait

### Session ~2026-06-04 à 06
**Migration Lovable → infrastructure propre**
- Migration Supabase vers nouveau projet `fgcmjkgxrkprsllivmli`
- Migration email Lovable → Resend API directe
  - `src/routes/lovable/email/queue/process.ts`
  - `src/routes/lovable/email/auth/webhook.ts` (HMAC-SHA256 auth hook)
  - `src/routes/lovable/email/suppression.ts` (Svix signature)
- Correction cron guardian (SQL migration) : repointe vers nouveau Supabase
- Config Cloudflare Workers : `wrangler.jsonc`, domaine custom `watchmyagents.com`
- MFA TOTP : enrollment, challenge gate, settings panel (`d3415d4`)

### Session ~2026-06-07
- GitHub OAuth : boutons sign-in/sign-up, config Supabase provider (`b814c07`)
- Fix GitHub display name + sign-in methods panel
- Fix Realtime channel name unique par instance useUserProfile

### Session ~2026-06-11 — Chantier 1
**Commit `9e121b1` : OpenAI register + multi-provider + framework picker**
- Register nouveaux providers IA (OpenAI en plus d'Anthropic)
- Logique multi-provider dans ingest-decisions
- Onboarding framework picker

### Session ~2026-06-11 — Chantier 2
**Commit `3dd7af0` : MFA obligatoire TOTP**
- Gate MFA dans `src/routes/_authenticated.tsx` (AAL check → redirect /mfa/enroll ou /mfa/challenge)
- Page `/mfa/enroll` standalone hors `_authenticated`
- Page `/mfa/challenge` avec fix redirect vers /mfa/enroll si pas de facteur

### Session ~2026-06-11 — Stripe
**Commits `8436f1c`, `885e78a`**
- Suppression Lovable gateway — Stripe appelle API directe via SDK officiel
- Fix env vars : `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (pas les anciens noms Lovable)
- Ajout live pubkey dans `wrangler.jsonc`

### Session ~2026-06-13 — Fixes MFA QR + ghost factor + callback
**Commits `b926a3b`, `43ee5c3`, `be3d227`, `84aa47a`**

**QR code vide** : `data.totp.qr_code` est DÉJÀ une data URI — utiliser `<img src={enrollData.qr} />` directement, ne PAS encoder.

**Ghost factor "already exists"** : pattern try-catch-retry dans les 3 endroits d'enroll :
```typescript
let { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: FRIENDLY_NAME });
if (error?.message?.toLowerCase().includes("already exists")) {
  const { data: existing } = await supabase.auth.mfa.listFactors();
  const conflict = (existing?.totp ?? []).find((f: any) => f.friendly_name === FRIENDLY_NAME);
  if (conflict) await supabase.auth.mfa.unenroll({ factorId: conflict.id });
  ({ data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: FRIENDLY_NAME }));
}
```

**MFA gate ne se déclenchait pas après sign-in** : `navigate({ href })` dans `auth/callback.tsx` bypasse TanStack Router `beforeLoad`. Fix : check AAL directement dans `goSuccess()` avant de naviguer.

### Session ~2026-06-13 — Banner MFA users existants
**Commits `a1823b4`, `a9e0bfc`, `51bcaa9`**
- `src/components/dashboard/MfaEnrollBanner.tsx` : banner warning pour users sans 2FA vérifié
- `src/components/dashboard/MfaEnrollModal.tsx` : modal popup avec flow QR + code confirm
- `src/components/dashboard/DashboardLayout.tsx` : banner injecté au-dessus du `<main>`
- Banner non-dismissable (MFA obligatoire) — pas de sessionStorage, pas de bouton ×

---

## État actuel (2026-06-14)

### Fonctionnel ✓
- Auth (email + GitHub OAuth)
- MFA TOTP obligatoire : gate, enroll, challenge
- Banner enrollment pour users existants sans 2FA
- Email transactionnel (Resend)
- Stripe paiements direct API
- Déploiement Cloudflare Workers

### À vérifier / faire
- [ ] Stripe webhook dans dashboard Stripe : `https://watchmyagents.com/api/public/payments/webhook?env=live`
- [ ] Supabase auth hook URL : `https://watchmyagents.com/lovable/email/auth/webhook`
- [ ] Root Key Ceremony step 4 : mint `wma-sk-1` dans Operator → Signing Keys
- [ ] Guardian → migrer de `ai.gateway.lovable.dev` vers gateway Anthropic directe
- [ ] Signing key `sk-2026-q2` expire 2026-09-30 → créer nouvelle clé avant

### Fichiers critiques
| Fichier | Rôle |
|---------|------|
| `src/routes/_authenticated.tsx` | Gate MFA + auth check toutes les routes protégées |
| `src/routes/mfa.enroll.tsx` | Page enrollment standalone |
| `src/routes/mfa.challenge.tsx` | Page challenge TOTP |
| `src/routes/auth/callback.tsx` | Callback OAuth/magic link — AAL check post sign-in |
| `src/components/dashboard/MfaEnrollBanner.tsx` | Banner warning users sans 2FA |
| `src/components/dashboard/MfaEnrollModal.tsx` | Modal enrollment depuis le banner |
| `src/lib/stripe.server.ts` | Stripe direct API (plus de proxy Lovable) |
| `src/routes/lovable/email/auth/webhook.ts` | Supabase Auth Hook email |
| `wrangler.jsonc` | Config Cloudflare Worker prod |
