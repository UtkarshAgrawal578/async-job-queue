# Async Job Queue Dashboard

A small full-stack system where a user submits a batch job (e.g. "process 50 items"), the batch is split into per-item sub-jobs and processed asynchronously in the background, and a dashboard shows live progress without polling the server every second.

## Live Links

- **App:** https://async-job-queue-ten.vercel.app
- **Repo:** https://github.com/UtkarshAgrawal578/async-job-queue  

## Tech Stack

- **Next.js** (App Router) — frontend + REST API routes
- **TypeScript** throughout, strict mode
- **PostgreSQL** (via Neon, free tier) + **Prisma** ORM
- **BullMQ** + **Redis** (via Upstash, free tier) — background job queue
- **Zod** — request validation
- **Server-Sent Events (SSE)** — live dashboard updates

## Setup & Run Locally

### 1. Clone and install
```bash
git clone https://github.com/UtkarshAgrawal578/async-job-queue
cd async-job-queue
npm install
```

### 2. Environment variables
Create a `.env` file in the root:
```
DATABASE_URL="postgresql://neondb_owner:npg_p3fNcigDAwo4@ep-royal-scene-b3iflilh-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

REDIS_URL="rediss://default:gQAAAAAABFW0AAIgcDI1Y2E1ZjIwZjRiYzU0MzdmYjQ2ZjdkNGRkMjlmNWY0Yg@pleased-dinosaur-284084.upstash.io:6379"
```


### 3. Push the database schema
```bash
npx prisma db push
```

### 4. Run the app and the worker (two terminals)
```bash
# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — background worker
npm run worker
```

Visit `http://localhost:3000`.

## Architecture

```
User → Next.js API route → Postgres (create Job + N JobItems)
                          → Redis queue (enqueue N sub-jobs)

Worker (separate process) → picks up sub-jobs from Redis
                           → simulates work (random delay + random success/fail)
                           → updates JobItem status in Postgres

Dashboard → opens one SSE connection per job
          → server pushes an update only when something changes
          → closes automatically once the batch is complete
```

### Why a separate worker process?

Next.js API routes are request/response — they can't run a long-lived process that continuously listens to a queue. The worker (`src/worker/index.ts`) is a plain Node.js script, deployed separately from the Next.js app, that runs independently and keeps listening for jobs.

- **Frontend + API** are deployed on **Vercel**.
- **Worker** is deployed on **Render**, as a free-tier **Web Service** rather than a "Background Worker" service (Render only offers Background Workers on paid plans). Since free Web Services must bind to a port and respond to HTTP requests, the worker process starts a minimal health-check HTTP server alongside the BullMQ worker in the same process — the HTTP server itself does nothing functional, it only satisfies Render's free-tier requirement.

### Why REST + Zod instead of tRPC?

tRPC gives end-to-end type safety, but adds real setup overhead (context, router, provider wiring). Given the time limit, REST API routes with Zod validation give equivalent type-safety guarantees (no `any`, validated request bodies) with a much simpler setup. Shared types between frontend and backend live in `src/types/index.ts`.

### Why BullMQ?

Simplest queue to stand up for this scope, with a free managed Redis instance (Upstash) requiring no self-hosting.
### Why SSE instead of polling?

"SSE keeps a single open connection per job view instead of repeated HTTP requests from the client. The server only pushes an update when the job's state actually changes, and closes the connection once the batch completes.

This is a pragmatic middle ground, not a fully event-driven design — see Trade-offs below.

### Why manual retry instead of BullMQ's built-in retry?

BullMQ's automatic retries would fire in the background without the user's knowledge, conflicting with the explicit "Retry" button the assignment asks for. Retries are handled entirely by the app: a failed `JobItem` is reset to `pending` and re-enqueued only when the user clicks Retry.

### Database schema

- `Job` — the batch (`count`, overall `status`, timestamps)
- `JobItem` — one row per sub-job (`index`, `status`, `attempts`, `error`, timestamps), with a foreign key to `Job` and cascading delete

Both statuses are separate enums (`JobStatus` vs `JobItemStatus`) since a batch's lifecycle (`pending → running → completed`) differs slightly from an item's (`pending → running → success/failed`).

## Trade-offs

Given the 3-day time limit, the following trade-offs were made consciously:

- **REST instead of tRPC** — tRPC was noted as a plus in the assignment, but REST + Zod was chosen to prioritize finishing the core requirements solidly within the time available.
- **SSE polls the database every 1s server-side** rather than using a fully push-based mechanism (e.g. Postgres `LISTEN/NOTIFY` or Redis pub-sub). The client never polls, but the server does a lightweight DB check per second per open connection. For this scope (one dashboard, one job at a time), this is a reasonable trade-off; a production version with many concurrent viewers would move to a real pub-sub mechanism.
- **Worker on Render's free Web Service tier** spins down after ~15 minutes of inactivity, causing a delayed response (30–60s) on the first job after being idle.A cron-job.org ping hits the worker's health-check endpoint every 10 minutes to prevent Render's free-tier idle spin-down
- **Prisma pinned to v6** to keep the schema-based `datasource { url = env(...) }` config, avoiding Prisma 7's mandatory driver-adapter migration (`prisma.config.ts` + `@prisma/adapter-*`) for this scope.
- **Simulated failure rate is fixed at 30%** in the worker, purely to make retry behavior easy to observe during review; this would be configurable or removed in a real system.