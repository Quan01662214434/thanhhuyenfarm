# Thanh Huyen Farm — Plant OS (monorepo)

Enterprise-style SaaS scaffold for **farm / plant operations** with **QR traceability**, **JWT + RBAC**, **Prisma / PostgreSQL**, **realtime notifications (Socket.IO)**, **object storage (S3-compatible MinIO)**, and a **Next.js 15** dashboard (emerald / V0-inspired UI).

## Structure

- `apps/frontend` — Next.js 15 App Router, Tailwind v4, Zustand, React Query, Framer Motion, Recharts, Lucide, dark mode (`next-themes`).
- `apps/backend` — NestJS 10, Prisma 6, Swagger at `/api/docs`, throttling, Helmet, cron (`@nestjs/schedule`), WebSocket gateway (`/realtime`).
- `packages/types` — shared enums / JWT payload types.
- `packages/eslint-config`, `packages/ui` — shared tooling stubs.
- `docker/` — Compose stack (Postgres, Redis, MinIO, API, Web, Nginx), API docs, reverse proxy.
- `docs/` — architecture notes, ERD, diagrams.

## Quick start (local dev)

1. **Database (mặc định: SQLite, không cần cài PostgreSQL)**  
   File `apps/backend/dev.db` được tạo bằng `prisma db push`. Nếu dùng PostgreSQL/Docker, đổi `provider` + `DATABASE_URL` trong `schema.prisma` / `.env` và dùng lại migrations Postgres.

2. **Backend**

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cd apps/backend
   npx prisma db push
   npx prisma db seed
   npm run start:dev
   ```

   API: `http://localhost:4000/api` · Swagger: `http://localhost:4000/api/docs`

3. **Frontend**

   ```bash
   cp apps/frontend/.env.example apps/frontend/.env.local
   cd apps/frontend
   npm run dev
   ```

   UI: `http://localhost:3000`

4. **Demo login (after seed)**  
   `owner@farm.demo` / `Demo@12345`

5. **Public plant page (QR)**  
   After seed, open **Plants** in the dashboard and use **Public view**, or `/scan` with plant id + token `demo-public-token-secure`.

## One-command Docker (full stack)

```bash
cp docker/.env.example docker/.env
# Edit docker/.env — set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET to long random strings
docker compose -f docker/docker-compose.yml --env-file docker/.env up --build
```

- App (via Nginx): `http://localhost:8080`  
- API (proxied): `http://localhost:8080/api`  
- MinIO console: `http://localhost:9001`  

The backend container runs `prisma migrate deploy` and `prisma db seed` on startup.

## Implemented vs roadmap

**In this repo:** monorepo layout, full Prisma schema (multi-tenant `Organization`, soft deletes, audit-friendly fields), auth (access + refresh JWT, refresh rotation), RBAC guards, plants CRUD + secure public lookup by `plantId` + `qrToken`, users listing, tasks + Kanban API, notifications + broadcast gateway stub, analytics overview, upload to MinIO (with graceful fallback), daily cron example, Docker + Nginx, seed data, dashboard UI (overview, plants, team, tasks, notifications, settings, employee mobile nav, public plant timeline).

**Natural next steps for production:** device/session API, Redis-backed Bull queues, Socket.IO auth + per-org rooms, disease CRUD + heatmap tiles, season/report export (PDF/Excel), IoT ingest service, AI endpoints behind a provider, exhaustive e2e tests, CI workflow.

## Scripts (root)

| Script        | Description                              |
|---------------|------------------------------------------|
| `npm run dev:fe` | Next dev (`apps/frontend`)            |
| `npm run dev:be` | Nest watch (`apps/backend`)          |
| `npm run db:migrate` | `prisma migrate dev` (backend)   |
| `npm run db:seed`    | `prisma db seed`                |
| `npm run docker:up`  | Compose up (see `package.json`) |

## License

Private / UNLICENSED — adjust for your product.
