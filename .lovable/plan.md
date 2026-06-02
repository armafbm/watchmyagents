## Mise à jour du pricing

### Changements demandés
1. **Starter** : passer de "1 agent" → **"0 à 3 agents"**
2. **Pro** : passer de "Up to 10 agents" → **"5 à 10 agents"**
3. **Free trial** : retirer la mention "14-day free trial" des plans payants ; ne garder le free trial **que sur Starter** (qui est déjà gratuit / 0 à 3 agents)
4. Mettre à jour le CTA des plans payants : retirer "Start free trial" → remplacer par **"Subscribe"** (ou équivalent) pour Pro, Pro+, Business

### Fichiers touchés
- `src/routes/pricing.tsx`
  - Tableau `TIERS` : champs `agents` pour Starter et Pro
  - Champs `cta` : "Start free trial" → "Subscribe" pour Pro / Pro+ / Business
  - Bloc bas de page : remplacer "All paid plans include a 14-day free trial" par un message clarifiant que Starter (0-3 agents) est gratuit à vie, pas de trial sur les plans payants

### Hors scope (à confirmer si besoin)
- Pas de changement de prix
- Pas de changement de features
- Pas de logique d'enforcement côté backend (quotas par tier) — purement UI/copy
