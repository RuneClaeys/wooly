# Wooly

## What This App Is

Wooly is a personal crochet/knitting project tracker.

It helps you:

- manage projects and break them down into trackable parts
- track progress counters per part
- keep project photos in one place
- manage yarn archive data (types, colors, stash, and usage)
- track yarn usage per project
- create and manage bingo boards for goals/challenges

The app is built as a Nuxt SPA with typed API contracts and a PostgreSQL-backed data layer.

## Tech Stack

- Nuxt 4 + Vue 3 + TypeScript
- tRPC (typed client/server API)
- Drizzle ORM + PostgreSQL
- Auth.js via `@sidebase/nuxt-auth` (Google provider)
- Nuxt UI + TailwindCSS

## Technical Setup (Local Development)

### 1) Prerequisites

- Node.js `26.x` (matches `engines` in `package.json`)
- npm
- PostgreSQL database
- Google OAuth credentials

### 2) Install Dependencies

```bash
npm install
```

### 3) Configure Environment

Create a `.env` file in the project root:

```bash
POSTGRES_URL=postgres://...
AUTH_SECRET=...
AUTH_ORIGIN=http://localhost:3000/api/auth
GOOGLE_AUTH_CLIENT_ID=...
GOOGLE_AUTH_CLIENT_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

Notes:

- `AUTH_ORIGIN` must include `/api/auth`.
- Drizzle and the seed script both use `POSTGRES_URL`.
- `BLOB_READ_WRITE_TOKEN` is used for project photo uploads.

### 4) Prepare The Database

Push schema to your database:

```bash
npm run db:push
```

Optional: generate migration files from schema changes:

```bash
npm run db:migrate
```

Optional: seed sample/default data:

```bash
# reset + seed
npm run db:seed

# append/update only
npm run db:seed:append
```

### 5) Start The App

```bash
npm run dev
```

Local URL: `http://localhost:3000`

### 6) Build And Preview Production

```bash
npm run build
npm run preview
```

### Useful Commands

- `npm run drizzle:studio` - open Drizzle Studio
- `npm run dev:prod` - run dev server with `.env.prod`
- `npm run generate` - static generate
- `npm run vercel-build` - build and push schema (Vercel-oriented)
