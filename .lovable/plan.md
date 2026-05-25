# Brancher l'UI /dashboard/* sur le backend Fortress

## Constat

Il existe aujourd'hui **deux familles de pages** dans l'espace authentifié :

| Famille | URLs | Design | Données |
|---|---|---|---|
| Dashboard (existant) | `/dashboard`, `/dashboard/watch`, `/dashboard/guardian`, `/dashboard/shield`, `/dashboard/legions`, `/dashboard/reports` | Beau, finalisé, sidebar WMA | **100 % mockées (hardcodées dans le fichier)** |
| Fortress (prompt #3) | `/today`, `/loop`, `/policies`, `/suggestions`, `/settings/keys`, `/onboarding` | Plus brut | **Connectées Supabase + RLS + Realtime** |

Donc ce que tu vois sur `/dashboard/legions` est joli mais **n'est pas relié à la base**. Les vraies données vivent sur les routes `/today`, `/policies`, etc.

Ta consigne : garder l'arborescence `/dashboard/*` et y brancher la vraie logique.

## Mapping cible

| URL conservée | Source backend | Rôle |
|---|---|---|
| `/dashboard` (index) | vue `dashboard_today_v` + table `decisions` (Realtime) | KPIs du jour + timeline live des décisions |
| `/dashboard/watch` | tables `agents` + `signals` | Liste des agents sous surveillance + signaux récents |
| `/dashboard/guardian` | table `suggestions` | Inbox des suggestions Guardian (Accept → crée une `policy`) |
| `/dashboard/shield` | table `policies` (CRUD) | Création / édition / activation des policies |
| `/dashboard/legions` | vue `loop_overview_v` | Diagramme Watch → Guardian → Shield par agent |
| `/dashboard/reports` | table `decisions` (historique agrégé) | Historique + export |
| `/dashboard/settings/keys` | table `api_keys` | Gestion des clés d'API |
| `/onboarding` | inchangé | Reste à la racine (premier login) |

## Travaux

### 1. Re-câblage des pages dashboard existantes

Pour chacune des 6 pages `dashboard.*.tsx` :
- Conserver `DashboardLayout`, `PageHeader`, `Panel`, `Stat`, `SevBadge` et la mise en page actuelle.
- Remplacer les tableaux `const fleets = [...]`, `const agents = [...]`, etc. par des appels Supabase via `useQuery` (TanStack Query) sur les tables / vues correspondantes.
- Ajouter un état vide propre quand l'utilisateur n'a pas encore d'agent / de policy (CTA vers `/onboarding` ou `/dashboard/shield`).
- Sur `/dashboard` (index) : abonnement Realtime `postgres_changes` sur `decisions` pour la timeline live.
- Sur `/dashboard/guardian` : bouton **Accept** sur une suggestion → insert dans `policies` + update du `status` de la suggestion (logique déjà présente dans `suggestions.tsx`, à porter).
- Sur `/dashboard/shield` : éditeur de policy (réutiliser `PolicyEditor.tsx` existant).
- Sur `/dashboard/settings/keys` : créer le fichier `dashboard.settings.keys.tsx` qui reprend `settings.keys.tsx`.

### 2. Suppression des routes Fortress doublons

Une fois la logique portée dans `/dashboard/*`, supprimer :
- `src/routes/_authenticated/today.tsx`
- `src/routes/_authenticated/loop.tsx`
- `src/routes/_authenticated/policies.tsx`
- `src/routes/_authenticated/suggestions.tsx`
- `src/routes/_authenticated/settings.keys.tsx`

Conservés tels quels : `onboarding.tsx`, `post-login.tsx`, `signin.tsx`.

### 3. Mise à jour de la navigation

- `post-login.tsx` : rediriger vers `/dashboard` au lieu de `/today` quand l'utilisateur a déjà au moins un agent.
- Vérifier que la sidebar `DashboardLayout` pointe bien vers les URLs `/dashboard/*` (déjà le cas).
- Supprimer `FortressShell.tsx` (n'est plus utilisé après la suppression des routes Fortress).

### 4. RLS & auth

Aucune modif. Toutes les requêtes utilisent le client browser Supabase déjà authentifié — RLS `customer_id = auth.uid()` s'applique automatiquement. Les `insert` (policies, api_keys, agents) continuent de remplir `customer_id` explicitement.

## Notes techniques

- Pas de modif du schéma DB, pas de modif de l'Edge Function `guardian`, pas de modif du cron.
- Pas de `createServerFn` nécessaire : tout passe par le client Supabase browser sous RLS, ce qui colle au pattern déjà en place dans les routes Fortress actuelles.
- Le design system (`DashboardLayout`, primitives, tokens `oklch` de `src/styles.css`) est intégralement conservé.

## Résultat attendu

Après implémentation :
- `/dashboard/legions` affichera tes vraies legions / agents (vides au début, peuplés via `/onboarding`).
- `/dashboard` montrera les vraies décisions en temps réel (vérifiable en insérant une ligne dans `decisions` depuis SQL).
- `/dashboard/guardian` listera les vraies suggestions générées par l'Edge Function toutes les 15 min.
- `/dashboard/shield` permettra de créer de vraies policies persistées.
- Les URLs `/today`, `/loop`, etc. n'existent plus — une seule arborescence cohérente.
