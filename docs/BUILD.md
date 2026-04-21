# Build & Deployment Guide

This document covers local development setup, production builds, and deployment options.

---

## Local Development

### Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |

### First-time setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd ai-training-practical

# 2. Install all workspace dependencies (root + backend + frontend)
npm install

# 3. Create backend environment file
cp backend/.env.example backend/.env     # or create from scratch (see below)

# 4. Run database migrations
npm run db:migrate:dev -w backend

# 5. Seed with sample data
npm run db:seed -w backend

# 6. Start both servers
npm run dev
```

#### Minimum `backend/.env`

```dotenv
DATABASE_URL="file:./prisma/dev.db"
BACKEND_PORT=5001
FRONTEND_URL="http://localhost:5173"
```

#### Minimum `frontend/.env.development`

```dotenv
VITE_API_BASE_URL=http://localhost:5001/api
```

### Starting the dev servers

```bash
# Both servers (recommended — uses concurrently, logs to logs/)
npm run dev

# Verbose — shows all output directly in the terminal
npm run dev:verbose

# Individual workspaces
npm run dev -w backend      # Backend only  (port 5001)
npm run dev -w frontend     # Frontend only (port 5173)
```

Log files when using `npm run dev`:
- `logs/backend.log`
- `logs/frontend.log`

### Ports

| Service | Port | URL |
|---------|------|-----|
| Backend (Express) | 5001 | http://localhost:5001 |
| Frontend (Vite) | 5173 | http://localhost:5173 |

To change ports update `backend/.env` (`BACKEND_PORT`) and `frontend/.env.development` (`VITE_API_BASE_URL`).

---

## Database

The project uses **SQLite** via **Prisma ORM**. The database file lives at `backend/prisma/dev.db`.

### Migrations

```bash
# Apply pending migrations (development)
npm run db:migrate:dev -w backend

# Create a new migration after editing schema.prisma
# (prompts for a migration name)
npx prisma migrate dev --name your-migration-name --schema backend/prisma/schema.prisma

# Reset database (drops all data, re-applies all migrations, re-seeds)
npx prisma migrate reset --schema backend/prisma/schema.prisma

# Apply migrations in CI/production (no interactive prompts)
npx prisma migrate deploy --schema backend/prisma/schema.prisma
```

### Seed data

```bash
# Populate with sample tasks, parking zones, and analytics rows
npm run db:seed -w backend
```

The seed script is at `backend/prisma/seed.ts`.

### Prisma Studio (visual database browser)

```bash
npx prisma studio --schema backend/prisma/schema.prisma
# Opens at http://localhost:5555
```

### Schema location

```
backend/prisma/
├── schema.prisma     # Source of truth for all models
├── dev.db            # SQLite file (git-ignored)
├── seed.ts           # Seed script
└── migrations/       # Applied migration history
```

---

## Production Build

### Backend

```bash
# Compile TypeScript to JavaScript (output: backend/dist/)
npm run build -w backend

# Start the compiled server
npm run start -w backend
# or: node backend/dist/server.js
```

Production environment variables to configure:

```dotenv
NODE_ENV=production
DATABASE_URL="file:/data/prod.db"   # Use an absolute path in production
BACKEND_PORT=5001
FRONTEND_URL=https://your-domain.com
```

### Frontend

```bash
# Build optimised static bundle (output: frontend/dist/)
npm run build -w frontend

# Preview the production build locally
npm run serve -w frontend   # Serves on port 5173
```

Production environment variables (`frontend/.env.production`):

```dotenv
VITE_API_BASE_URL=https://your-domain.com/api
```

### Build both at once

There is no root-level `build` script by default. Add one to `package.json` if needed, or run sequentially:

```bash
npm run build -w backend && npm run build -w frontend
```

---

## Code Quality

```bash
# Lint all workspaces
npm run lint

# Auto-format with Prettier
npm run format

# TypeScript type checking (no emit)
npm run type-check -w frontend
npx tsc --noEmit -p backend/tsconfig.json
```

---

## Deployment Options

### Option A — Single server (Node.js + static file serving)

1. Build backend and frontend.
2. Configure Express to serve `frontend/dist` as static files.
3. Run `node backend/dist/server.js` behind a process manager (PM2, systemd).

Add to `backend/src/app.ts` before the API routes:

```typescript
import path from 'path';
import express from 'express';

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
  );
}
```

### Option B — Separate hosting

| Part | Platform examples |
|------|------------------|
| Frontend (static) | Vercel, Netlify, Cloudflare Pages |
| Backend (Node.js) | Render, Railway, Fly.io, AWS App Runner |
| Database | Upgrade SQLite → PostgreSQL for persistent cloud hosting |

Set `VITE_API_BASE_URL` in the frontend build to your deployed backend URL.

### Option C — Docker (if Dockerfiles are added)

No Docker setup exists today. To add it:

1. Create `backend/Dockerfile` with a multi-stage Node.js build.
2. Create `frontend/Dockerfile` with a Vite build and Nginx serve stage.
3. Create `docker-compose.yml` at the root to wire them together.

---

## CI/CD Checklist

Before deploying:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run test` passes (all suites green)
- [ ] `npm run test:coverage` meets the 80% threshold
- [ ] `npm run build -w backend` compiles without TypeScript errors
- [ ] `npm run build -w frontend` compiles without errors
- [ ] Database migrations are applied (`prisma migrate deploy`)
- [ ] Environment variables are set in the deployment target
- [ ] `POST /api/melbourne/refresh` returns `{"synced": N}` after deploy (N > 3000)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot find module '@prisma/client'` | Run `npx prisma generate --schema backend/prisma/schema.prisma` |
| `Database is locked` | Only one process should own the SQLite file. Kill duplicate backend processes. |
| `EADDRINUSE :::5001` | Kill the process: `lsof -ti:5001 \| xargs kill -9` |
| `EADDRINUSE :::5173` | Kill the process: `lsof -ti:5173 \| xargs kill -9` |
| Frontend shows old data | Clear Vite cache: `rm -rf frontend/node_modules/.vite` |
| Migrations out of sync | `npx prisma migrate reset --schema backend/prisma/schema.prisma` (destroys data) |
| TypeScript compile errors on build | `npm run type-check -w frontend` for frontend; `tsc -p backend/tsconfig.json` for backend |
