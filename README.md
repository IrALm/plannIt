# PlannIt

Web app mobile-first, installable en PWA, pour organiser sa semaine (activités colorées par type, rappels, sync Google Calendar). Next.js 15 (App Router) + Supabase.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

`.env.local` contient déjà les valeurs Supabase publiques du projet. Rien d'autre n'est requis pour lancer le front — les secrets (Google OAuth, Brevo, service role) vivent uniquement côté Supabase Edge Functions.

## Schéma Supabase & Edge Functions — état : déployé

Les 9 migrations (`supabase/migrations/00001`→`00009`) sont appliquées et les 3 Edge Functions (`google-calendar-oauth`, `google-calendar`, `send-email`) sont déployées sur le projet `foukyqukmutuciunctbi`. Pour repartir de zéro sur un autre projet :

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase functions deploy google-calendar-oauth
npx supabase functions deploy google-calendar
npx supabase functions deploy send-email
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

⚠️ Sous PowerShell, ne pas rediriger `>` directement vers un fichier `.ts` sans préciser l'encodage — ça écrit de l'UTF-16 par défaut, ce que TypeScript/ESLint ne savent pas lire. Utiliser `| Out-File -Encoding utf8 lib/supabase/database.types.ts` à la place, ou repasser le fichier en UTF-8 après coup.

Secrets Edge Functions (`npx supabase secrets set NOM=valeur`) — état actuel :
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` — configurés.
- `SITE_URL` (fallback) + `ALLOWED_APP_ORIGINS` (`http://localhost:3000,https://plann-it-cyan.vercel.app`) — configurés. **Aucun des deux n'a besoin d'être changé quand un domaine change** : le frontend transmet sa propre origine (`getURL()`, cf. section suivante) à chaque appel, l'Edge Function ne s'en sert que comme repli si l'origine transmise n'est pas dans la liste. Ajouter un domaine custom plus tard = juste étendre `ALLOWED_APP_ORIGINS`.
- `SENTRY_DSN` — pas encore configuré (optionnel, reporting d'erreurs des Edge Functions).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, etc. sont injectés automatiquement par Supabase.

Callback OAuth déjà autorisé côté Google Cloud Console : `https://foukyqukmutuciunctbi.supabase.co/functions/v1/google-calendar-oauth` (indépendant du domaine front, jamais à changer).

## URLs localhost vs prod

Aucune URL n'est codée en dur en fonction de l'environnement — tout passe par `getURL()` (`lib/utils/url.ts`), qui priorise `NEXT_PUBLIC_SITE_URL` si définie, sinon reconstruit l'origine depuis le header `host` de la requête entrante (donc `localhost:3000` en dev, le domaine réel en prod, automatiquement). C'est cette fonction qui construit les redirect URLs Supabase Auth (confirmation email, reset password, retour OAuth) et l'origine transmise à l'Edge Function Google Calendar (`ALLOWED_APP_ORIGINS` ci-dessus).

- **En local** : `.env.local` fixe `NEXT_PUBLIC_SITE_URL=http://localhost:3000` explicitement (par précaution, même si la détection par header suffirait déjà).
- **En prod (Vercel)** : définir `NEXT_PUBLIC_SITE_URL=https://plann-it-cyan.vercel.app` dans les env vars du projet Vercel — **pas encore fait**, aucun accès au dashboard Vercel depuis cette session. C'est la seule variable encore manquante côté front pour que tout soit 100% explicite (la détection par header fonctionnerait déjà seule, mais autant ne pas en dépendre).

**Reste à faire côté Supabase Auth (dashboard, pas de CLI pour ça)** : Authentication → URL Configuration → ajouter `https://plann-it-cyan.vercel.app/**` aux Redirect URLs autorisées (actuellement seul `http://localhost:3000/**` y est). Sans ça, la confirmation d'inscription/reset password échouera en prod même si le code construit la bonne URL — Supabase refuse toute redirection hors liste blanche. Je n'ai pas touché cette config moi-même : la pousser par erreur via `supabase config push` (sans `config.toml` existant à référence exacte) risquait d'écraser d'autres réglages Auth déjà en place (fournisseur Google, expiration JWT, etc.) — plus sûr de l'ajouter à la main en 30 secondes.

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

Vérifier l'installabilité : `npm run build && npm start`, puis Chrome DevTools → onglet Application → Manifest (la catégorie PWA a été retirée de Lighthouse dans les versions récentes, ce n'est plus le bon endroit pour vérifier ça).

**Prompt d'installation intégré à l'onboarding** (étape 5/6, `components/onboarding/step-install.tsx`) : capte l'événement `beforeinstallprompt` (Chrome/Edge/Android) le plus tôt possible via `components/pwa/install-prompt-listener.tsx` (monté à la racine, `stores/pwa.store.ts`), et propose un bouton "Installer l'application" qui déclenche le prompt natif. Détecte aussi si l'app tourne déjà en mode standalone (déjà installée → juste un état "✓ Déjà installée", pas de re-prompt). Sur iOS (Safari ne supporte pas `beforeinstallprompt`), affiche les instructions manuelles (Partager → Sur l'écran d'accueil). L'étape n'est jamais bloquante : "Suivant"/"Passer" fonctionnent dans tous les cas.

## Monitoring (Sentry)

`@sentry/nextjs` est configuré (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) mais désactivé tant que `NEXT_PUBLIC_SENTRY_DSN` n'est pas renseigné (le SDK no-op silencieusement sans DSN). Pour l'activer : créer un projet sur [sentry.io](https://sentry.io), renseigner `NEXT_PUBLIC_SENTRY_DSN` (et optionnellement `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` pour l'upload des source maps) dans les env vars Vercel. Côté Edge Functions, `SENTRY_DSN` (secret Supabase séparé) active le reporter manuel dans `supabase/functions/_shared/sentry.ts`.

## Déploiement (Vercel + Supabase)

Déployé : [https://plann-it-cyan.vercel.app](https://plann-it-cyan.vercel.app).

1. ✅ **Supabase** : migrations appliquées, Edge Functions déployées, secrets configurés (sections ci-dessus).
2. ⚠️ **Vercel** : ajouter `NEXT_PUBLIC_SITE_URL=https://plann-it-cyan.vercel.app` dans les env vars du projet (dashboard Vercel → Settings → Environment Variables), pas encore fait depuis cette session. `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_*` restent optionnels tant que Sentry n'est pas activé.
3. ⚠️ **Supabase Auth** : ajouter `https://plann-it-cyan.vercel.app/**` aux Redirect URLs autorisées (dashboard → Authentication → URL Configuration) — pas encore fait, voir section précédente pour pourquoi ce n'est pas automatisé.
4. ✅ **Google Cloud Console** : rien à changer, le callback OAuth ne dépend pas du domaine front.
5. À vérifier de bout en bout une fois les deux points ⚠️ traités : inscription → confirmation email → onboarding (avec l'étape d'installation PWA) → dashboard → ajout d'événement → sync Google Calendar → email de confirmation.
