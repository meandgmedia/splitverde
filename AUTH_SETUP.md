# Phase 2 authentication setup

The code supports Google OAuth 2.0 Authorization Code + PKCE and email one-time codes through Resend. **Neither provider will work until its secrets are configured.**

## 1. Database

After pulling, run `npx wrangler d1 migrations apply splitverde-db --remote` and approve migration `0002_auth.sql`. Do not rerun old migrations manually.

## 2. Google

In Google Cloud Console, create/select a project, configure Google Auth Platform consent screen and OAuth client type **Web application**.

Authorized redirect URI (exact):

`https://splitverde.mattsaffian.workers.dev/auth/google/callback`

Add your Google account as a test user if your OAuth app is in testing mode. If requested, set authorized JavaScript origin to `https://splitverde.mattsaffian.workers.dev`.

Store credentials using:

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Do not commit client secrets to GitHub.

## 3. Email

Create a Resend account at https://resend.com, verify a domain you control, and create an API key with email sending permissions. Use a verified sender such as `SplitVerde <login@yourdomain.com>`.

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

**Do not use splitverde.com as the sender until you own and verify it.** For early testing, Resend's test sender may only deliver to approved addresses; check their current restrictions.

## 4. Authentication secret

Generate a long random secret locally, e.g. `openssl rand -hex 32`, then run:

```sh
npx wrangler secret put AUTH_SECRET
```

Paste the generated secret at the hidden prompt. Do not share it in chat.

## 5. Validate and deploy

```sh
git pull origin main
npm run check
npm run deploy
```

Test `/login`, Google OAuth, email code request/verification, private `/app`, and sign out.

## Security notes and scope

- Signed-in sessions use random 256-bit opaque tokens, hashed before storage in D1, with HttpOnly, Secure (HTTPS), SameSite=Lax cookies, expiring in 7 days.
- Email codes expire in 10 minutes, have five attempts, and are limited to one request per email per minute. Codes are stored as keyed HMAC hashes. **Global and per-IP abuse protection is not implemented**; configure Cloudflare WAF/rate limits before broad public registration.
- Google OAuth uses state and PKCE, and accepts only verified email identities.
- The agency workspace checks sessions and membership server-side. The reconciliation demo at `/app/reconcile` remains public and browser-only. **No authenticated commission CRUD, team invites, billing, or persistent imports exist yet.**
- Accounts sharing a verified email are merged into one user. This is intentional for this initial implementation.
- Staging stays noindex. When changing to splitverde.com, update Google redirect URI and Cloudflare secrets/configuration accordingly.
- Run `npm audit` and address relevant dependencies before opening to public customers.
