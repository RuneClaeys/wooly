# AGENTS.md

## Project Analysis (2026-06-13)

## 1) Project Snapshot
- Stack: Nuxt 3 + Vue 3 + TypeScript SPA, tRPC for API contracts, Drizzle ORM on Postgres, Auth.js (Google provider), Nuxt UI + Tailwind.
- Rendering mode: `ssr: false` (client-side app) with server API routes for auth and tRPC.
- Domain model: users -> projects -> parts.
- Maturity: functional app structure with clear module boundaries, but several authorization and consistency risks remain.

## 2) Architecture Map
- Frontend pages: `pages/index.vue` (projects), `pages/projects/[id].vue` (parts per project), `pages/settings.vue`, `pages/login.vue`.
- Shared UI and layout behavior: `layouts/default.vue`, `components/layout/Heading.vue`, modal components in `components/modals/`.
- Client API wiring: `plugins/client.ts` and `composables/useTrpcClient.ts`.
- Server API entry points:
  - Auth: `server/api/auth/[...].ts`
  - tRPC: `server/api/trpc/[trpc].ts`
- Business logic routers:
  - `server/trpc/routers/project.router.ts`
  - `server/trpc/routers/part.router.ts`
  - `server/trpc/routers/user.router.ts`
- Data layer:
  - Schema: `db/schema.ts`
  - DB client: `server/services/drizzle.service.ts`
  - Migrations: `db/migrations/`

## 3) Strengths
- Good separation of concerns: pages/composables/server routers/schema are cleanly separated.
- Typed contract flow with tRPC + Zod + Drizzle offers strong compile-time safety.
- Auth middleware exists and normalizes session user against DB (`protectedProcedure`).
- Domain modeling is straightforward and normalized (projects and parts cascade on delete).
- UX baseline is solid: modals, sorting, confirmation flow, locale switch, and theme toggle.

## 4) Findings (Prioritized)

### Critical
1. Missing ownership checks on project mutations and read-by-id.
   - `projectRouter.get`, `projectRouter.update`, and `projectRouter.delete` filter by `id` only.
   - Expected: also enforce `projects.userId === ctx.session.user.id`.
   - Impact: authenticated users may read/modify/delete other users' projects if IDs are guessed.

2. Missing ownership checks on part operations.
   - `partRouter.list` filters by `projectId` only.
   - `partRouter.create` inserts by provided `projectId` without verifying ownership.
   - `partRouter.update` and `partRouter.delete` operate by part id without joining back to user ownership.
   - Impact: cross-tenant data access/modification risk.

### High
3. Fire-and-forget DB writes in `refreshProject` are not awaited.
   - `part.router.ts` calls `refreshProject(projectId)` without `await`.
   - Impact: timing inconsistency for `updatedAt`, potential unhandled promise behavior under failure.

4. Router composition mismatch: `partRouter` nested under `projectRouter` but not exported at top level.
   - Current API shape is `projectRouter.partRouter.*` from client.
   - This works, but it tightly couples parts to project router hierarchy and can confuse discoverability/ownership enforcement.

### Medium
5. Config drift between app locale and Day.js default locale.
   - i18n default locale: `en`.
   - Day.js default locale: `nl`.
   - Impact: date language may not match initial UI language.

6. Duplicate module registration in `nuxt.config.ts`.
   - `@vueuse/nuxt` appears twice.
   - Impact: unnecessary config noise; possible duplicate plugin setup.

7. README is still template-level and does not document real project setup.
   - Missing environment variables, auth setup, database setup, and migration workflow details.

### Low
8. Naming/typo polish items reduce readability.
   - `showCeateProjectForm` typo appears in multiple pages.
   - `useSorting` labels are hardcoded in Dutch while app supports English and Dutch.

## 5) Operational Notes
- NPM scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run preview`
  - `npm run db:migrate` (drizzle generate)
  - `npm run db:push`
  - `npm run drizzle:studio`
- Required envs (inferred):
  - `POSTGRES_URL`
  - `AUTH_SECRET`
  - `AUTH_ORIGIN`
  - `GOOGLE_AUTH_CLIENT_ID`
  - `GOOGLE_AUTH_CLIENT_SECRET`

## 6) Recommended Next Actions
1. Fix authorization first:
   - Add ownership filters to all project and part read/write queries.
   - For part operations, validate project ownership before mutate/list.
2. Add integration tests for authorization boundaries:
   - User A cannot access User B project/part IDs.
3. Await `refreshProject` updates and handle write errors.
4. Align locale defaults (`i18n` and `dayjs`) and internationalize sorting labels.
5. Remove duplicate Nuxt module registration.
6. Replace starter README with real setup and architecture docs.

## 7) Suggested Refactor Direction (Optional)
- Introduce helper guards:
  - `assertProjectOwnership(projectId, userId)`
  - `assertPartOwnership(partId, userId)` via joins.
- Consider flat top-level routers (`project`, `part`, `user`) for clearer API boundaries.
- Add a thin service layer for reusable permission checks and transaction-aware writes.

## 8) Maintainer Preferences (2026-06-27)
- Avoid multiline `watch(...)` calls; prefer single-line watcher declarations with named handlers when needed.
- Avoid very small/dumb components that fragment readability.
- Keep components readable by reducing local implementation noise.
- Keep business logic in top-level pages/components.
- Use composables to extract lifecycle-aware feature behavior into smaller maintainable units.
