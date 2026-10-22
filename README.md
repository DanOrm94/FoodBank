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

### 3. Set the session secret
```
npx wrangler secret put SESSION_SECRET
```
Enter a long random string.

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
Visit `https://<your-worker-url>/setup` once. It creates:

- **Email:** `admin@manchestersettlement.org.uk`
- **Password:** `password123`

Then log in at `/login` and change the password.

### Deploying via Cloudflare's GitHub integration
Connect this repo in the Cloudflare dashboard (Workers & Pages). Set the build
command to `npm install` and deploy command to `npx wrangler deploy`. Add the
`SESSION_SECRET` secret and the D1 binding (`DB` -> `foodbank-db`) in the
dashboard. Run migrations/seed with the wrangler commands above (or from the
D1 console), then hit `/setup`.

## Security notes

- Change the seeded admin password immediately after first login.
- `SESSION_SECRET` must be set in production; the dev fallback is insecure.
- Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`.
