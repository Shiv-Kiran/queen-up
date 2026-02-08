# Queen Puzzle

LinkedIn-style Queens puzzle built with Next.js, Prisma, and a custom puzzle engine.

## Tech
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (default local), Postgres-ready path for deployment

## Getting Started
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - copy `.env.example` to `.env`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Initialize the local SQLite schema:
   - `npm run db:init`
5. Start the app:
   - `npm run dev`
6. Generate initial local puzzles:
   - `npm run puzzles:ensure:initial -- 30`

## Core Commands
- `npm run puzzles:ensure:initial -- 30`: ensure at least 30 puzzles exist
- `npm run puzzles:generate:initial -- 30`: force-generate 30 new puzzles
- `npm run puzzles:generate:daily`: create one daily puzzle
- `npm run test`: run engine and generator tests
- `npm run lint`: lint
- `npm run typecheck`: TypeScript check

## Security Model
- Puzzle solution is stored in DB (`puzzleData.solution`) and never exposed by `GET /api/puzzles/by-index/:index`.
- Validation checks are server-side in `POST /api/puzzles/:id/validate`.
- Admin generation endpoints require `PUZZLE_ADMIN_TOKEN`.

## Daily Cron (GitHub Actions)
- Workflow: `.github/workflows/generate-daily-puzzle.yml`
- Required repository secrets:
  - `DAILY_PUZZLE_ENDPOINT` (e.g. `https://your-domain.com/api/admin/generate-daily`)
  - `PUZZLE_ADMIN_TOKEN` (must match server env)

## Deploying to Vercel with Free Postgres
1. Provision a free Neon Postgres database.
2. Set `DATABASE_URL` and `PUZZLE_ADMIN_TOKEN` in Vercel project env vars.
3. Use build command:
   - `npm run prisma:generate:postgres && npm run db:push:postgres && npm run build`

Neon is recommended for free tier + Vercel compatibility.
