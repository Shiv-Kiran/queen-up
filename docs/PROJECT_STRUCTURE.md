# Project Structure

```text
queen-puzzle/
  .github/
    workflows/                # CI/CD and daily generation automation
  docs/
    architecture/             # Architecture decisions and diagrams
    api/                      # API contracts and examples
  prisma/                     # Prisma schema, migrations, seed scripts
  public/
    assets/                   # Static assets (icons, illustrations)
  scripts/                    # Generation/maintenance scripts
  src/
    app/                      # Next.js App Router routes and layouts
    components/
      ui/                     # Reusable presentational UI primitives
      layout/                 # App-level layout components
    features/
      queens/
        components/           # Puzzle-specific UI pieces
        engine/               # Solver/generator/validator core logic
        model/                # Domain types + constants
        services/             # Feature orchestration for queens
      common/                 # Cross-puzzle feature utilities
    lib/
      constants/              # App-wide constants
      errors/                 # Shared error classes/helpers
      utils/                  # Pure utility functions
    server/
      db/                     # Prisma client and db bootstrap
      repositories/           # Data access abstractions/implementations
      services/               # Server-side use cases
      jobs/                   # Cron-executed job orchestration
    styles/                   # Global styles and design tokens
    types/                    # Shared application-level types
  tests/
    unit/                     # Isolated fast tests
    integration/              # Multi-module tests
    e2e/                      # Browser/user-flow tests
```

## Design Notes
- `features/queens/engine` remains framework-agnostic so scripts, APIs, and UI all share identical rules.
- `server/repositories` keeps data layer replaceable (SQLite -> Postgres without domain rewrites).
- `features/common` is reserved for future puzzle types and shared game mechanics.