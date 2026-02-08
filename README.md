# Queen Puzzle

LinkedIn-style Queens puzzle built with Next.js, Prisma, and a custom puzzle engine.

## Tech
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (default local), Postgres-ready

## Getting Started
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - copy `.env.example` to `.env`
3. Run Prisma migration:
   - `npx prisma migrate dev --name init`
4. Start the app:
   - `npm run dev`

## Current Status
- Project scaffolding complete
- Engine, DB schema, API routes, scripts, and UI gameplay in progress
