# Queen Puzzle

LinkedIn-style Queens puzzle built with Next.js, Prisma, and a custom puzzle engine, with daily cronjob puzzle updates. I wanted to have my own practice playground for the puzzle, will add more puzzles to keep myself sharp. 

link: https://queenup.shivkiranbagathi.com

<img width="1787" height="796" alt="image" src="https://github.com/user-attachments/assets/3e014704-3ab5-474e-a998-278925338346" />

## Daily Puzzle Cron
Workflow file: `.github/workflows/generate-daily-puzzle.yml`

Required GitHub repository secrets:
- `DAILY_PUZZLE_ENDPOINT` (e.g. `https://your-domain.com/api/admin/generate-daily`)
- `PUZZLE_ADMIN_TOKEN` (must match your Vercel environment value)

Optional email notification secrets:
- `SMTP_SERVER`
- `SMTP_PORT` (defaults to `587` if omitted)
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `NOTIFY_EMAIL_FROM`
- `NOTIFY_EMAIL_TO`

Daily notification emails include a `response.json` attachment from the generation endpoint, including puzzle payload or detailed error telemetry.


