# HoopAdmin

HoopAdmin is a basketball club license management system built for local clubs. It manages players, licenses, templates, and document generation.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Fastify, Prisma 6
- **Database**: PostgreSQL 16
- **Package Manager**: pnpm (monorepo with workspaces)
- **Authentication**: NextAuth (Auth.js) + JWT
- **CI/CD**: GitHub Actions
- **Deployment**: Docker Compose (API + DB), VPS deploy via SSH (API container + static frontend)

## Prerequisites

- Node.js 20 (see `.nvmrc`)
- pnpm 9+
- PostgreSQL 16 (or Docker for containerized DB)
- Docker & Docker Compose (optional, for deployment)

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd hoop
pnpm install
```

### 2. Environment Setup

```bash
# Backend
cp .env.example apps/api/.env
# Edit DATABASE_URL, JWT_SECRET, CORS_ORIGIN

# Frontend
cp .env.example apps/web/.env.local
# Edit NEXT_PUBLIC_API_URL, API_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

| Variable            | File                | Description                         |
| ------------------- | ------------------- | ----------------------------------- |
| DATABASE_URL        | apps/api/.env       | PostgreSQL connection string        |
| JWT_SECRET          | apps/api/.env       | Secret for signing JWT tokens       |
| PORT                | apps/api/.env       | API server port (default: 3001)     |
| HOST                | apps/api/.env       | API server host (default: 0.0.0.0)  |
| CORS_ORIGIN         | apps/api/.env       | Allowed CORS origin                 |
| NEXT_PUBLIC_API_URL | apps/web/.env.local | Public API URL for browser requests |
| API_URL             | apps/web/.env.local | Server-side API URL                 |
| NEXTAUTH_SECRET     | apps/web/.env.local | NextAuth session encryption secret  |
| NEXTAUTH_URL        | apps/web/.env.local | NextAuth callback URL               |

### 3. Database Setup

Start PostgreSQL (optional, if not using Docker):

```bash
pnpm db:dev   # Starts PostgreSQL via Docker
```

Apply migrations and seed:

```bash
cd apps/api
pnpm exec prisma migrate deploy
pnpm prisma:seed
```

### 4. Run Development

```bash
# From project root
pnpm dev        # Both API + Web
pnpm dev:api    # API only (port 3001)
pnpm dev:web    # Web only (port 3000)
```

### 5. Default Login

- **Email**: admin@bcanalamanga.mg
- **Password**: password123

## Available Scripts

| Script            | Description                                 |
| ----------------- | ------------------------------------------- |
| `pnpm dev`        | Start both API and web in development mode  |
| `pnpm dev:api`    | Start API server only                       |
| `pnpm dev:web`    | Start web frontend only                     |
| `pnpm build`      | Build all packages                          |
| `pnpm build:api`  | Build API (TypeScript compilation)          |
| `pnpm build:web`  | Build web (Next.js production build)        |
| `pnpm lint`       | Run ESLint across all packages              |
| `pnpm test`       | Run all tests                               |
| `pnpm db:dev`     | Start PostgreSQL via Docker for development |
| `pnpm db:stop`    | Stop development database containers        |
| `pnpm db:migrate` | Run Prisma migrations (development)         |
| `pnpm db:seed`    | Seed database with default data             |

## Project Structure

```
hoop/
├── apps/
│   ├── api/          # Fastify backend (DDD architecture)
│   └── web/          # Next.js frontend (FSD architecture)
├── packages/
│   └── shared/       # Shared types, schemas, utilities
├── docs/plans/       # Design documents and plans
└── .github/workflows/  # CI/CD pipelines
```

## Architecture

### Frontend — Feature-Sliced Design (FSD)

```
apps/web/src/
├── app/              # Next.js App Router — pages & layouts
│   ├── (auth)/       # Public routes (login)
│   └── (dashboard)/  # Protected routes (all features)
├── features/         # Business features (self-contained)
│   ├── auth/         # Login form
│   ├── dashboard/    # Stats cards
│   ├── documents/    # Document generator
│   ├── licenses/     # License CRUD
│   ├── players/      # Player CRUD
│   ├── settings/     # Club info, seasons
│   └── templates/    # Template CRUD
├── shared/           # Reusable UI, utilities, config
│   ├── config/       # Site configuration
│   ├── lib/          # API client, auth, utilities
│   └── ui/           # UI primitives (Button, Card, Table, etc.)
└── widgets/          # Layout components
    ├── header/       # Top header bar
    ├── shell/        # Dashboard shell (responsive layout)
    └── sidebar/      # Navigation sidebar
```

Each feature follows the pattern:

- `api/` — API client functions
- `ui/` — React components

The `shared/` layer provides primitives that features build on. Features never import from other features directly — they communicate through the shared layer and page-level composition.

### Backend — Domain-Driven Design (DDD)

```
apps/api/src/
├── domain/           # Core business entities & interfaces
│   ├── license/      # License entity + repository interface
│   ├── player/       # Player entity + repository interface
│   ├── season/       # Season entity + repository interface
│   └── user/         # User entity + repository interface
├── application/      # Use cases (orchestrate domain logic)
│   ├── auth/         # authenticateUser
│   ├── license/      # createLicense, listLicenses, etc.
│   └── player/       # createPlayer, listPlayers, etc.
├── infrastructure/   # External implementations
│   ├── prisma/       # Prisma repositories (DB queries)
│   └── template/     # Template processor (XLSX/DOCX)
└── interface/        # HTTP layer
    ├── plugins/      # Fastify plugins (auth, error handling)
    └── routes/       # Route handlers
```

Data flow: **Route → Application Use Case → Domain Repository → Prisma Implementation**

The domain layer defines interfaces (ports). Infrastructure provides concrete implementations (adapters). This makes it easy to swap PostgreSQL for another database without touching business logic.

### Shared Package

```
packages/shared/src/
├── constants/    # Enums (Role, Gender, LicenseStatus), labels, template placeholders
├── schemas/      # Zod validation schemas shared between frontend and backend
├── types/        # TypeScript interfaces (Club, Player, License, Season, Template)
└── utils/        # Pure utility functions (computeCategory)
```

The shared package is imported as `@hoop/shared` by both `apps/api` and `apps/web`.

## Docker Deployment

```bash
# Production (API + PostgreSQL)
docker compose up -d

# Development database only (hot reload runs locally)
docker compose -f docker-compose.dev.yml up -d
```

Production `docker-compose.yml` runs the API and PostgreSQL. The web app is built and deployed separately (see CI/CD). Set `DB_PASSWORD`, `JWT_SECRET`, and `CORS_ORIGIN` as environment variables or in a `.env` file.

## CI/CD

- **CI** (`ci.yml`): Runs on every push/PR to `main` — installs deps, format check, lints, runs API tests (with PostgreSQL service), runs web tests, builds both apps
- **Deploy** (`deploy.yml`): Runs on push to `main` — builds web, deploys API via SSH (Docker), uploads frontend static files to VPS. Requires `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `API_URL` secrets.

## License

Private — all rights reserved.
