# Fix the "page tampon" flash on Fortress sub-pages

## Symptom (vu dans la vidéo)
Quand on clique **Watch · Monitoring** ou **Shield · Policies** depuis la sidebar de Fortress, la page s'affiche d'abord vide pendant ~1 s :
- Les `Stat` cards montrent `0`
- Le panneau "Agents under watch" affiche **"No agent registered yet · Register your first agent"** alors que 3 agents existent
- La carte **Fleet status** en bas de la sidebar reste sur **"loading…"**

Puis les vraies données apparaissent. C'est ce flash qu'on perçoit comme un "écran tampon".

## Cause
Toutes ces pages (`dashboard.watch.tsx`, `dashboard.shield.tsx`, `dashboard.guardian.tsx`) chargent leurs données via `useEffect` + `setState`, et le rendu initial utilise l'état par défaut (`[]`, `0`, `null`) — qui se confond avec un état "vide légitime". Aucune distinction entre *"on charge"* et *"il n'y a rien"*.

`dashboard.watch.tsx` n'a même pas de flag `loading`. `DashboardLayout` → `FleetStatusCard` a le même problème.

## Fix

### 1. `src/routes/_authenticated/dashboard.watch.tsx`
- Ajouter `const [loading, setLoading] = useState(true)` et le passer à `false` à la fin du `useEffect`.
- Stats : pendant `loading`, afficher `—` (ou un mini skeleton) au lieu de `String(agents.length)` qui vaut `0`.
- Panel "Agents under watch" : ne montrer le CTA *"No agent registered yet"* QUE si `!loading && agents.length === 0`. Sinon, afficher 3 lignes de skeleton (`<tr>` avec `<div className="h-4 bg-muted/40 rounded animate-pulse" />`).
- Panel "Signal tail" : même logique — skeleton de 4 lignes pendant le load, message "No signals yet" seulement si `!loading`.

### 2. `src/routes/_authenticated/dashboard.shield.tsx`
- Le flag `loading` existe déjà mais les `Stat` rendent `activeCount` / `draftCount` / `guardianCount` calculés sur `list = []` → ils flashent `0`.
- Pendant `loading`, passer `value="—"` aux 4 `Stat` cards (au lieu des valeurs calculées).
- Le `Loader2` existant dans le `Panel` est OK, le garder.

### 3. `src/routes/_authenticated/dashboard.guardian.tsx`
- Même traitement : pendant `loading`, les compteurs (Pending risks, Average risk score, Categories) doivent afficher `—` au lieu de `0` / `0/100`.

### 4. `src/components/dashboard/DashboardLayout.tsx` — `FleetStatusCard`
- Aujourd'hui : tant que `stats === null`, affiche `…` + `loading…`. C'est ce qu'on voit dans la vidéo.
- Remplacer par un mini skeleton (deux barres `animate-pulse` à la place de "…" et "loading…") pour que la sidebar ne paraisse pas "cassée" pendant la transition.

## Hors scope
- Pas de migration vers TanStack Query / loaders de route (changement plus lourd, à faire séparément).
- Aucun changement de logique business, de schéma DB, d'edge function ou de navigation. Pur frontend / présentation.
- Le `GuardianChatWidget`, le `Nav`, et la page `pricing.tsx` ne sont pas touchés.

## Vérification
Après le fix, naviguer Fortress → Watch → Shield → Guardian → Legions en chaîne : on doit voir des skeletons pulsants à chaque transition, jamais le faux message "No agent registered yet" ni des zéros sur des comptes qui ne sont pas réellement à zéro.
