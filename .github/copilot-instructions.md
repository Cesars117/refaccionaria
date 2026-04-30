# Copilot Instructions for inventory-system 🚀

Quick, focused guidance for AI coding agents working in this repository. Keep edits tight and preserve existing behavior unless a clear test/fix is included.

## Project at-a-glance
- Next.js (app dir) app using Next 16+ features. Main server entry: `app/page.tsx` and routes under `app/`.
- PostgreSQL + Prisma for data layer. Prisma schema: `prisma/schema.prisma`.
- Production output configured as `standalone` via `next.config.ts` (Vercel deployment). README also mentions Vercel.

## Important files to read before changing code
- UI & server actions: `app/actions.ts`, `app/page.tsx`, `app/items/new/page.tsx`
- DB client pattern: `lib/db.ts` (singleton attached to globalThis to avoid multi-connections in dev)
- Data model: `prisma/schema.prisma` (models: Item, Category, Location — note enums are represented as strings)
- Seeding & verification: `seed.ts` and `verify-data.ts`
- Deploy and build: `deploy.ps1`, `next.config.ts`, `package.json`

## Key conventions & patterns
- Server components by default (app directory). Use async server functions for data loading.
- `use server` and exported functions in `app/actions.ts` are used as Form actions. Preserve signatures expecting `FormData` (e.g., `createItem(formData: FormData)`).
- Absolute imports use `@/*` via `tsconfig.json` paths (e.g., `@/lib/db`).
- DB access always goes through `lib/db.ts` (the Prisma client instance). Avoid creating new Prisma clients except in safe tooling scripts.
- Status & type strings are hardcoded in code & DB (e.g., Item.status: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `LOST`; Location.type: `WAREHOUSE`, `VEHICLE`, `SITE`). Use these exact strings when reading/writing values.

## Developer workflows (commands)
- Local dev server: `npm run dev` (Next dev server on localhost:3000)
- Build: `npm run build` → produces `.next/standalone` because of `next.config.ts`
- Start (production-like): `npm run start` (after build)
- Lint: `npm run lint` (calls `eslint`)
- Prisma (migrations & client):
  - Apply dev migrations: `npx prisma migrate dev`
  - Deploy migrations in CI/prod: `npx prisma migrate deploy`
  - Generate client: `npx prisma generate` (run if you edit Prisma schema)
- Seed data: `seed.ts` exists and can be executed to populate initial Category/Location data. Common ways to run:
  - `npx ts-node seed.ts` (if ts-node is available)
  - Or run `node` on compiled JS after transpiling
- Quick verification: `node verify-data.ts` (via ts-node or compiled JS) prints items and counts.

## Deployment notes & Gotchas ⚠️
- There are two deployment flows: Vercel (README) or manual Hostinger script `deploy.ps1` which packages `.next/standalone` and uploads `deploy.zip` to the server.
- Important: `deploy.ps1` runs `npm install --omit=dev` on the server. In this repository `@prisma/client` appears under `devDependencies` — that will break runtime DB access in production. Make sure `@prisma/client` is in `dependencies` before deploying to production.

## Testing and debugging tips
- DB issues: check `POSTGRES_URL` env var (Prisma datasource uses this) and run `npx prisma migrate status`.
- To reproduce server actions locally, use the dev server and submit the forms in `app/items/new/page.tsx`.
- Use `verify-data.ts` to dump DB contents and confirm seed ran.

## Small edits guidance (what to change and how)
- When modifying server actions, keep the `use server` directive and preserve `FormData`/server-only imports. Remember to call `revalidatePath('/')` if you change data that affects the index page.
- If you add or rename fields in `prisma/schema.prisma`, run `npx prisma migrate dev` and `npx prisma generate`, and update any code that reads/writes the column (check `app/actions.ts`, `verify-data.ts`).
- When adjusting strings used as enums (status/type), update all UI selects and database seed logic (`seed.ts`, `app/actions.ts`).

## When you need review / acceptance tests
- DB schema changes require migration + a smoke test: run migrations, then run `seed.ts` (or use UI to create items) and call `verify-data.ts` to assert expected rows.
- UI/Server changes should be validated manually in dev by creating an item via `/items/new` and confirming it appears on `/`.

---
If any section is unclear or you'd like more examples (e.g., sample prisma migration workflow or a sample seed test), tell me which part you want expanded and I’ll iterate. ✅
