# PlannIt

Web app mobile-first, installable en PWA, pour organiser sa semaine (activités colorées par type, rappels, sync Google Calendar). Next.js 15 (App Router) + Supabase.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

`.env.local` contient déjà les valeurs Supabase publiques du projet. Rien d'autre n'est requis pour lancer le front — les secrets (Google OAuth, Brevo, service role) vivent uniquement côté Supabase Edge Functions.

## Appliquer le schéma Supabase (migrations `supabase/migrations/`)

Le schéma (tables, RLS) est écrit mais pas encore appliqué au projet Supabase réel — la CLI Supabase installée localement (`npx supabase`) n'est pas authentifiée. Deux options :

**Option A — coller le SQL directement (le plus simple, aucune CLI requise)**
Dans le [dashboard Supabase](https://supabase.com/dashboard/project/foukyqukmutuciunctbi) → SQL Editor, exécuter dans l'ordre les fichiers de `supabase/migrations/` (00001 → 00008).

**Option B — via la CLI**
```bash
npx supabase login              # ouvre le navigateur pour l'auth OAuth
npx supabase link --project-ref foukyqukmutuciunctbi
npx supabase db push            # applique toutes les migrations dans l'ordre
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```
(La dernière commande remplace le fichier de types écrits à la main par les types générés depuis le schéma réel.)

## Déployer les Edge Functions (Google Calendar)

```bash
npx supabase functions deploy google-calendar-oauth
npx supabase functions deploy google-calendar
npx supabase functions deploy send-email
```

Secrets requis côté Edge Functions (`npx supabase secrets set NOM=valeur`, ou dashboard → Edge Functions → Secrets) :
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` — déjà configurés côté projet Supabase d'après les notes de cadrage, à vérifier avec `npx supabase secrets list`.
- `SITE_URL` — **nouveau, à ajouter** (ex. `http://localhost:3000` en dev, l'URL Vercel en prod) : sert à rediriger le navigateur vers `/settings` ou `/onboarding` après le callback OAuth Google Calendar.
- `SENTRY_DSN` — **nouveau, optionnel** : reporting d'erreurs des Edge Functions (`supabase/functions/_shared/sentry.ts`, reporter minimal fetch-based). Sans cette variable, les erreurs sont juste loguées (`console.error`) dans les logs de fonction Supabase.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` sont injectés automatiquement par Supabase, rien à faire.

Callback OAuth déjà autorisé côté Google Cloud Console : `https://foukyqukmutuciunctbi.supabase.co/functions/v1/google-calendar-oauth` (confirmé dans les notes de cadrage).

### Emails transactionnels (Brevo) — ce qui est câblé et ce qui ne l'est pas

- **Câblé** : email de bienvenue (`app/auth/callback/route.ts`, détecté par heuristique 1er login) et email de confirmation d'ajout d'événement (`features/events/actions.ts`), tous deux best-effort (un échec d'envoi ne bloque jamais le flux).
- **Pas câblé** : les rappels programmés (« 30 min avant l'événement ») nécessitent un déclencheur planifié (`pg_cron`+`pg_net`, ou une Supabase Scheduled Function) qui n'a pas été mis en place dans cette passe — c'était un point explicitement laissé en attente d'arbitrage dans le plan M7. `EmailService.sendEventReminder` (dans `supabase/functions/_shared/email/`) existe déjà et fonctionne ; il ne manque que la brique qui l'appelle au bon moment.

## Structure

```
app/            routes Next.js (App Router)
components/ui/  primitives UI (Button, Input, Card, BottomSheet, ...)
components/icons/ mascotte, logo, icône Google — transcrits depuis le design system
features/       logique métier par domaine (auth, calendar, events, notifications)
lib/supabase/   clients Supabase (browser / server / middleware) + types DB
stores/         état Zustand (UI transitoire : thème, modal, onboarding)
supabase/       migrations SQL + Edge Functions
```

Design system de référence : `.claude/Design app PlannIt/design_handoff_plannit/`.
Plan de développement complet (jalons M0→M8) : voir l'historique de la session ou redemander à l'agent.

## PWA

Manifest (`app/manifest.ts`) + service worker généré par `@ducanh2912/next-pwa` (`public/sw.js`, ignoré par git, régénéré à chaque `npm run build`). **Important** : la génération du service worker nécessite le build Webpack (`next build`), **pas** Turbopack (`next build --turbopack`) — les deux ne sont pas compatibles à ce jour, d'où `"build": "next build"` dans `package.json` (le `dev` reste en Turbopack, rapide, sans impact). Icônes en SVG vectoriel (`public/icons/`) plutôt qu'en PNG rastérisé, faute d'outil de rendu d'image disponible localement — suffisant pour l'installabilité sur navigateurs modernes ; envisager des PNG 192/512 pour une compatibilité plus large si besoin.

Vérifier l'installabilité : `npm run build && npm start`, puis audit Lighthouse → PWA dans Chrome DevTools.

## Monitoring (Sentry)

`@sentry/nextjs` est configuré (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) mais désactivé tant que `NEXT_PUBLIC_SENTRY_DSN` n'est pas renseigné (le SDK no-op silencieusement sans DSN). Pour l'activer : créer un projet sur [sentry.io](https://sentry.io), renseigner `NEXT_PUBLIC_SENTRY_DSN` (et optionnellement `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` pour l'upload des source maps) dans les env vars Vercel. Côté Edge Functions, `SENTRY_DSN` (secret Supabase séparé) active le reporter manuel dans `supabase/functions/_shared/sentry.ts`.

## Déploiement (Vercel + Supabase)

1. **Supabase** : appliquer les migrations et déployer les Edge Functions (sections ci-dessus). Mettre à jour les redirect URLs autorisées dans Supabase Auth (dashboard → Authentication → URL Configuration) pour inclure le domaine Vercel de prod (en plus de `http://localhost:3000/**` déjà configuré).
2. **Vercel** : importer le repo, renseigner les variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` = URL de prod, `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_*` si Sentry activé). Le build Vercel utilise `next build` (défini dans `package.json`), donc le service worker PWA sera généré automatiquement.
3. **Google Cloud Console** : le callback OAuth Google Calendar (`https://<project-ref>.supabase.co/functions/v1/google-calendar-oauth`) ne dépend pas du domaine front, aucune modification nécessaire au déploiement.
4. Vérifier de bout en bout : inscription → confirmation email → onboarding → dashboard → ajout d'événement → sync Google Calendar → email de confirmation.

Cette étape (comptes Vercel/Sentry, déploiement effectif) n'a pas pu être exécutée dans cette session — aucun accès à ces services. Le code est prêt, il ne manque que la configuration côté ces plateformes.
