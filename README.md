# PlannIt

Web app mobile-first, installable en PWA, pour organiser sa semaine (activités colorées par type, rappels, sync Google Calendar). Next.js 15 (App Router) + Supabase.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

`.env.local` contient déjà les valeurs Supabase du projet, y compris `SUPABASE_SERVICE_ROLE_KEY` (secret, jamais `NEXT_PUBLIC_`, utilisé uniquement par `app/auth/callback/route.ts` pour stocker les tokens Google Calendar — RLS interdit délibérément cette écriture à l'utilisateur authentifié lui-même). Rien d'autre n'est requis pour lancer le front — les autres secrets (Brevo, service role des Edge Functions) vivent côté Supabase Edge Functions.

## Authentification : Google OAuth uniquement

Pas d'email/mot de passe — un seul bouton "Continuer avec Google" sur la homepage (`features/auth/actions.ts` → `signInWithGoogle`). Ce même clic couvre **à la fois** la connexion **et** l'autorisation d'accès à Google Calendar (scope `calendar.events` demandé dès `signInWithOAuth`, avec `access_type=offline` + `prompt=consent` pour obtenir un refresh token) — un seul écran de consentement Google, pas deux flux séparés.

`app/auth/callback/route.ts` récupère `session.provider_token`/`provider_refresh_token` juste après l'échange du code (ils ne sont disponibles qu'à ce moment précis, jamais via `getSession()` plus tard) et les stocke dans `google_calendar_tokens` via un client `service_role` (`lib/supabase/admin.ts`). Puis il route vers, dans l'ordre : `/complete-profile` (si `profiles.profile_completed` est `false`) → `/onboarding` (si pas terminé) → `/dashboard`.

**`/complete-profile`** (nom + avatar) est une page indépendante, pas une étape de l'onboarding — gérée uniquement par `profiles.profile_completed`, sans synchronisation d'état à faire coïncider avec une navigation externe (c'est ce découplage qui a réglé une classe de bugs de boucle rencontrée en cours de route).

Pour reconnecter Google Calendar après une déconnexion (Réglages), on ré-invoque simplement `signInWithGoogle()` — pas de flux dédié.

## Schéma Supabase & Edge Functions — état : déployé

Les 10 migrations (`supabase/migrations/00001`→`00010`) sont appliquées et les 3 Edge Functions (`google-calendar-oauth`, `google-calendar`, `send-email`) sont déployées sur le projet `foukyqukmutuciunctbi`. `google-calendar-oauth` ne gère plus que la déconnexion (`DELETE`) — l'ancien flux OAuth initiate/callback a été retiré (superflu depuis que Calendar est demandé dans le login lui-même) ; la table `oauth_states` qu'il utilisait reste en base, inutilisée, non supprimée (pas de migration destructive sans raison).

Pour repartir de zéro sur un autre projet :

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase functions deploy google-calendar-oauth
npx supabase functions deploy google-calendar
npx supabase functions deploy send-email
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
npx supabase projects api-keys --project-ref <ref>   # récupérer la clé service_role pour .env.local
```

⚠️ Sous PowerShell, ne pas rediriger `>` directement vers un fichier `.ts` sans préciser l'encodage — ça écrit de l'UTF-16 par défaut, ce que TypeScript/ESLint ne savent pas lire. Utiliser Bash, ou `| Out-File -Encoding utf8 ...` sous PowerShell.

Secrets Edge Functions (`npx supabase secrets set NOM=valeur`) — état actuel :
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (utilisés par `google-calendar` pour rafraîchir les tokens), `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` — configurés.
- `SITE_URL`, `ALLOWED_APP_ORIGINS` — configurés mais **plus utilisés** (vestiges de l'ancien flux OAuth séparé), laissés en place sans risque.
- `SENTRY_DSN` — pas encore configuré (optionnel, reporting d'erreurs des Edge Functions).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, etc. sont injectés automatiquement par Supabase côté Edge Functions (distinct de la copie dans `.env.local` du front, à renseigner soi-même).

Callback OAuth Google Calendar toujours autorisé côté Google Cloud Console : `https://foukyqukmutuciunctbi.supabase.co/functions/v1/google-calendar-oauth` — n'est plus utilisé comme redirect_uri actif mais peut rester dans la liste des URIs autorisées sans problème. Le vrai callback actif désormais est celui de Supabase Auth : `https://foukyqukmutuciunctbi.supabase.co/auth/v1/callback`.

## URLs localhost vs prod

Aucune URL n'est codée en dur en fonction de l'environnement — tout passe par `getURL()` (`lib/utils/url.ts`), qui priorise `NEXT_PUBLIC_SITE_URL` si définie, sinon reconstruit l'origine depuis le header `host` de la requête entrante (donc `localhost:3000` en dev, le domaine réel en prod, automatiquement). C'est cette fonction qui construit la redirect URL de `signInWithGoogle` (`${origin}/auth/callback`).

- **En local** : `.env.local` fixe `NEXT_PUBLIC_SITE_URL=http://localhost:3000` explicitement (par précaution, même si la détection par header suffirait déjà).
- **En prod (Vercel)** : définir `NEXT_PUBLIC_SITE_URL=https://plann-it-cyan.vercel.app` dans les env vars du projet Vercel — **pas encore fait**, aucun accès au dashboard Vercel depuis cette session.

**Reste à faire côté Supabase Auth (dashboard, pas de CLI pour ça)** : Authentication → URL Configuration → ajouter `https://plann-it-cyan.vercel.app/**` aux Redirect URLs autorisées (actuellement seul `http://localhost:3000/**` y est). Sans ça, la connexion Google échouera en prod même si le code construit la bonne URL — Supabase refuse toute redirection hors liste blanche.

### Emails transactionnels (Brevo)

Email de bienvenue (`app/auth/callback/route.ts`, détecté par heuristique 1er login) et email de confirmation d'ajout d'événement (`features/events/actions.ts`), tous deux best-effort (un échec d'envoi ne bloque jamais le flux).

### Rappels d'événements — vraies push notifications serveur

Fonctionnent même app/onglet fermé, y compris sur écran verrouillé (son + vibration natifs). Toggle "Notifications push" dans Réglages (`components/settings/push-notifications-toggle.tsx`) → `Notification.requestPermission()` puis `pushManager.subscribe()`, la souscription (endpoint + clés) est stockée dans `push_subscriptions` (migration `00011`, RLS : chaque utilisateur ne voit/insère/supprime que la sienne).

**Rappels entièrement paramétrables**, pas de presets figés : `components/ui/reminder-picker.tsx` (partagé entre le modal d'événement et Réglages) permet d'ajouter n'importe quelle valeur, en minutes, heures ou jours avant l'événement (`lib/utils/reminders.ts` fait la conversion vers des minutes pour le stockage, seule unité persistée en base). Défaut global : **30 min + 5 min** (`user_preferences.default_reminders`, migration `00012`) — préremplit chaque nouvel événement, modifiable au cas par cas, et l'utilisateur peut en ajouter autant qu'il veut au-delà des deux par défaut.

En plus des rappels configurés, une notification est **toujours** envoyée au début de l'événement (offset `0`, implicite — jamais affiché comme option dans le picker, ni stocké dans `events.reminders`). Exemple : rappels à 1 h, 30 min et 5 min avant → 4 notifications au total (1h, 30min, 5min, + une au démarrage).

Côté serveur : `pg_cron` appelle chaque minute (`select * from cron.job`) l'Edge Function `send-push-reminders`, qui scanne les événements des 7 prochains jours (avec 10 min de marge arrière, pour ne pas rater le rappel "démarrage" si un tick de cron est retardé), calcule les rappels dus non encore envoyés (`events.reminders_sent`, dédup par offset), puis pousse une notification via `npm:web-push` (VAPID) à tous les abonnements de l'utilisateur. Les abonnements expirés/révoqués (404/410 du push service) sont nettoyés automatiquement.

Notification **persistante** (`requireInteraction: true` dans `worker/index.ts`, injecté dans le service worker généré via `customWorkerSrc`) : reste affichée jusqu'à ce que l'utilisateur clique dessus ou la balaie, au lieu de disparaître seule.

**Secrets requis côté Supabase** (`npx supabase secrets set ...`) : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:...`), `CRON_SECRET` (jeton comparé par la fonction, jamais écrit dans une migration versionnée). **Côté Vercel** : `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (même valeur que `VAPID_PUBLIC_KEY`, safe côté client par design) — **pas encore ajoutée, à faire avant le prochain redéploiement**, sinon le toggle Réglages ne s'affichera pas correctement côté client.

Pour repartir de zéro sur un autre projet Supabase :
```bash
npx web-push generate-vapid-keys
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT="mailto:contact@example.com" CRON_SECRET="$(openssl rand -hex 32)"
npx supabase db query --linked "select vault.create_secret('<même valeur que CRON_SECRET>', 'cron_secret');"
npx supabase functions deploy send-push-reminders --no-verify-jwt
```
(La migration `00011` crée le job `cron.schedule('send-event-reminders', ...)` — pas besoin de le recréer, juste de seeder le secret Vault qu'il lit.)

## Avatars de profil

`public/avatars/` : dépose une image (n'importe quel format) et relance `npm run dev`/`npm run build` — la liste affichée dans `/complete-profile` et Réglages se régénère automatiquement (`scripts/generate-avatar-manifest.mjs`, tourne en `predev`/`prebuild`). Ne pas éditer `features/profile/avatar-manifest.ts` à la main, il est écrasé à chaque régénération.

## Structure

```
app/            routes Next.js (App Router)
components/ui/  primitives UI (Button, Input, Card, BottomSheet, ...)
components/icons/ mascotte, logo, icône Google — transcrits depuis le design system
features/       logique métier par domaine (auth, calendar, events, profile)
lib/supabase/   clients Supabase (browser / server / middleware / admin service_role) + types DB
stores/         état Zustand (UI transitoire : thème, modal)
supabase/       migrations SQL + Edge Functions
```

Design system de référence : `.claude/Design app PlannIt/design_handoff_plannit/`.
Plan de développement complet (jalons M0→M8) : voir l'historique de la session ou redemander à l'agent.

## PWA

Manifest (`app/manifest.ts`) + service worker généré par `@ducanh2912/next-pwa` (`public/sw.js`, ignoré par git, régénéré à chaque `npm run build`). **Important** : la génération du service worker nécessite le build Webpack (`next build`), **pas** Turbopack (`next build --turbopack`) — les deux ne sont pas compatibles à ce jour, d'où `"build": "next build"` dans `package.json` (le `dev` reste en Turbopack, rapide, sans impact). Icônes en SVG vectoriel (`public/icons/`) plutôt qu'en PNG rastérisé, faute d'outil de rendu d'image disponible localement — suffisant pour l'installabilité sur navigateurs modernes.

Vérifier l'installabilité : `npm run build && npm start`, puis Chrome DevTools → onglet Application → Manifest (la catégorie PWA a été retirée de Lighthouse dans les versions récentes).

**Prompt d'installation intégré à l'onboarding** (étape 4/5, `components/onboarding/step-install.tsx`) : capte l'événement `beforeinstallprompt` (Chrome/Edge/Android) le plus tôt possible via `components/pwa/install-prompt-listener.tsx` (monté à la racine, `stores/pwa.store.ts`), et propose un bouton "Installer l'application" qui déclenche le prompt natif. Détecte aussi si l'app tourne déjà en mode standalone. Sur iOS, affiche les instructions manuelles (Partager → Sur l'écran d'accueil). Jamais bloquant. Le même contrôle est aussi disponible en permanence dans Réglages.

## Monitoring (Sentry)

`@sentry/nextjs` est configuré (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) mais désactivé tant que `NEXT_PUBLIC_SENTRY_DSN` n'est pas renseigné. Pour l'activer : créer un projet sur [sentry.io](https://sentry.io), renseigner `NEXT_PUBLIC_SENTRY_DSN` (et optionnellement `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`) dans les env vars Vercel. Côté Edge Functions, `SENTRY_DSN` (secret Supabase séparé) active le reporter manuel dans `supabase/functions/_shared/sentry.ts`.

## Déploiement (Vercel + Supabase)

Déployé : [https://plann-it-cyan.vercel.app](https://plann-it-cyan.vercel.app).

1. ✅ **Supabase** : les 12 migrations sont appliquées, les 4 Edge Functions (`google-calendar-oauth`, `google-calendar`, `send-email`, `send-push-reminders`) déployées, tous les secrets configurés (sections ci-dessus) — y compris le cron `send-event-reminders` (`* * * * *`), vérifié en exécution réelle (`cron.job_run_details` → `succeeded`, réponses HTTP 200).
2. ⚠️ **Vercel** : ajouter `NEXT_PUBLIC_SITE_URL=https://plann-it-cyan.vercel.app`, `SUPABASE_SERVICE_ROLE_KEY` et `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dans les env vars du projet (dashboard Vercel → Settings → Environment Variables) — pas encore fait depuis cette session. `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_*` restent optionnels.
3. ⚠️ **Supabase Auth** : ajouter `https://plann-it-cyan.vercel.app/**` aux Redirect URLs autorisées (dashboard → Authentication → URL Configuration).
4. ✅ **Google Cloud Console** : rien à changer.
5. À vérifier de bout en bout une fois les points ⚠️ traités : "Continuer avec Google" → consentement (login + Calendar en un seul écran) → complétion profil → onboarding → dashboard → ajout d'événement avec rappel → activer les notifications push dans Réglages → sync Google Calendar → email de confirmation → notification push reçue à l'heure du rappel.
