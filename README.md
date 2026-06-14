# Wooly

Wooly is a Nuxt 3 + TypeScript app for tracking projects and their parts.

## Stack

- Nuxt 3 + Vue 3 + TypeScript
- tRPC (client/server contract)
- Drizzle ORM + PostgreSQL
- Auth.js via `@sidebase/nuxt-auth` (Google provider)
- Nuxt UI + TailwindCSS

## Requirements

- Node.js 20+
- A PostgreSQL database
- Google OAuth credentials

## Environment Variables

Create a `.env` file with:

```bash
POSTGRES_URL=postgres://...
AUTH_SECRET=...
AUTH_ORIGIN=http://localhost:3000/api/auth
GOOGLE_AUTH_CLIENT_ID=...
GOOGLE_AUTH_CLIENT_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

Notes:

- `AUTH_ORIGIN` must include `/api/auth` for auth callbacks.
- Seeder and Drizzle both use `POSTGRES_URL`.
- Project photos are compressed in the browser and rejected if still larger than 10 MB.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

App runs on `http://localhost:3000`.

## Database

Generate migrations:

```bash
npm run db:migrate
```

Push schema to database:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run drizzle:studio
```

Seed database:

```bash
# reset + seed default records
npm run db:seed

# append/update without reset
npm run db:seed:append
```

## Build And Preview

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: build production app
- `npm run preview`: preview production build
- `npm run db:migrate`: generate Drizzle migration files
- `npm run db:push`: apply schema directly to DB
- `npm run drizzle:studio`: open DB studio
- `npm run db:seed`: reset and seed sample data
- `npm run db:seed:append`: append/update sample data
