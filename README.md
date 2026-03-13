# SmokeShop Platform

A regulated commerce platform for tobacco and vape retail in Texas. Single Next.js app serving customers, store owners, and platform admins with role-based routing.

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.15.4
- **PostgreSQL** with PostGIS extension
- **Redis** (optional in dev, required in production)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd smoke-shop-platform
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

### 3. Database setup

```bash
# Create the database
createdb smokeshop

# Enable PostGIS
psql smokeshop -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations
cd apps/web
pnpm db:migrate
```

### 4. Start development

```bash
# From root
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
smoke-shop-platform/
├── apps/web/                    # Next.js app (all portals)
│   ├── src/
│   │   ├── app/                 # Route groups: (auth), (customer), (store), (admin)
│   │   ├── components/          # UI + shared components
│   │   ├── config/              # Navigation config
│   │   ├── db/                  # Drizzle schema + migrations
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Auth, DB, tRPC, utilities
│   │   ├── server/              # tRPC routers
│   │   ├── stores/              # Zustand stores
│   │   └── types/               # TypeScript types
│   ├── drizzle.config.ts
│   ├── next.config.ts
│   └── tailwind.config.ts
├── packages/
│   ├── config/eslint/           # Shared ESLint config
│   ├── config/tsconfig/         # Shared TypeScript configs
│   └── validators/              # Shared Zod validation schemas
├── .github/workflows/           # CI/CD pipelines
├── turbo.json                   # Turborepo config
└── .env.example                 # Environment variables template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run tests |
| `pnpm format` | Format code with Prettier |

### Database commands (from `apps/web/`)

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate new migration |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema to DB (dev) |
| `pnpm db:studio` | Open Drizzle Studio |

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **API**: tRPC
- **Database**: PostgreSQL + PostGIS + Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth)
- **Cache**: Redis (Upstash)
- **Payments**: Authorize.net
- **IDV**: Veriff
- **Delivery**: DoorDash Drive API

## Portals

- **Customer** (`/`) — Browse stores, shop, checkout
- **Store Owner** (`/store`) — Manage products, orders, settings
- **Admin** (`/admin`) — Platform management
