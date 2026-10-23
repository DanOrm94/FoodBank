# Food Bank Manager

A replica of the Food Bank Manager app, built for **Cloudflare Workers** with a **D1** (SQLite) database.

- **Framework:** [Hono](https://hono.dev/) with server-rendered JSX
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (D1 driver)
- **UI:** Bootstrap 5 + Bootstrap Icons
- **Auth:** session-based, PBKDF2-hashed passwords, HMAC-signed cookies (all via Web Crypto — no Node deps)

## Features

- Login / logout (real auth)
- Dashboard with feature cards + "Expiring Stock" table (sorted by expiry)
- Full CRUD for: Food Stock, Food Bundles (with item management), Users, Volunteers, Expenses
- Help page

## Project layout

```
migrations/0000_init.sql   D1 schema
seed.sql                   Sample data (no admin account — see /setup)
src/
  index.tsx                App entry + routing
  db/schema.ts             Drizzle schema
  db/client.ts             D1 -> Drizzle helper
  lib/auth.ts              PBKDF2 hashing + signed sessions
  middleware/auth.ts       Session loading + route guard
  routes/*.tsx             auth, setup, stock, bundles, users, volunteers, expenses
  views/*.tsx              layout, dashboard, login, resource components
```

## Deploy (GitHub -> Cloudflare)

> You deploy & test; nothing runs locally here.

### 1. Install deps
```
npm install
```

### 2. Create the D1 database
```
npx wrangler d1 create foodbank-db
```
Copy the returned `database_id` into `wrangler.toml` (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

### 3. Set the secrets
```
npx wrangler secret put SESSION_SECRET   # REQUIRED, >=16 random chars
npx wrangler secret put SETUP_TOKEN      # REQUIRED to use /setup
npx wrangler secret put ADMIN_USERNAME   # optional, defaults to "admin"
npx wrangler secret put ADMIN_PASSWORD   # strong password, >=8 chars
```
Notes:
- Without `SESSION_SECRET` the app refuses all logins (fails closed).
- Without `SETUP_TOKEN` the `/setup` route is disabled (returns 404).
- The admin password is never committed; it comes from `ADMIN_PASSWORD`.

### 4. Apply the schema + seed data (remote D1)
```
npm run db:migrate:remote
npm run db:seed:remote
```

### 5. Deploy
```
npm run deploy
```

### 6. Create the admin login (one time)
Visit `https://<your-worker-url>/setup?token=<SETUP_TOKEN>` once. It creates
(or resets) the admin account using `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Then log in at `/login`. For safety, rotate `SETUP_TOKEN` (or remove it) after
you've created the admin so the route goes dark again.

### Deploying via Cloudflare's GitHub integration
Connect this repo in the Cloudflare dashboard (Workers & Pages). Set the build
command to `npm install` and deploy command to `npx wrangler deploy`. Add the
`SESSION_SECRET` secret and the D1 binding (`DB` -> `foodbank-db`) in the
dashboard. Run migrations/seed with the wrangler commands above (or from the
D1 console), then hit `/setup`.

## Security notes

Implemented:
- Passwords hashed with PBKDF2 (100k iterations, per-password salt, constant-time compare).
- Sessions are HMAC-signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- `SESSION_SECRET` fails closed: no secret, no logins (no insecure fallback).
- `/setup` is gated by `SETUP_TOKEN` and disabled entirely when it is unset.
- CSRF protection on all state-changing requests (double-submit token).
- Basic per-isolate login rate limiting (8 attempts / 15 min per IP).
- Admin password supplied via secret, never committed.
- SQL is parameterized (Drizzle); output is auto-escaped (Hono JSX).

Still recommended before/alongside production handover:
- Per-user accounts with an audit trail (currently a single shared admin).
- Distributed rate limiting via KV or Durable Objects (current limiter is
  per-isolate only).
- A GDPR review: lawful basis, retention policy, and handling of
  special-category data (dietary/health, religion) for the people recorded.
- Rotate `SETUP_TOKEN` after initial admin creation.
