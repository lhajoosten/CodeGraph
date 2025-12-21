# Database Setup & Automation Guide

This guide explains how to set up and manage the CodeGraph database using automated Make targets.

## Quick Start

### First-Time Setup
```bash
make db-setup
```

This single command will:
1. Start PostgreSQL and Redis containers (`docker-up`)
2. Fix PostgreSQL authentication configuration (`db-fix-auth`)
3. Run all database migrations (`db-migrate`)
4. Test the database connection (`db-test`)

### Verify Connection Works
```bash
make db-test
```

Output:
```
✓ Database connection successful!
  PostgreSQL version: PostgreSQL 16.11 (Debian 16.11-1.pgdg12+1) on x86_64...
```

---

## Available Make Targets

### Database Setup Commands

#### `make db-setup` (Recommended for first-time setup)
**Full database initialization pipeline**

Runs in sequence:
1. `docker-up` → Start PostgreSQL/Redis containers
2. `db-fix-auth` → Fix pg_hba.conf authentication
3. `db-migrate` → Run all database migrations
4. `db-test` → Verify connection works

**Use when:**
- Setting up development environment for the first time
- Need complete database initialization from scratch

---

#### `make db-init`
**Alternative initialization (test before migrate)**

Runs in sequence:
1. `docker-up` → Start PostgreSQL/Redis containers
2. `db-fix-auth` → Fix pg_hba.conf authentication
3. `db-test` → Verify connection works
4. `db-migrate` → Run all database migrations

**Use when:**
- Want to verify connection before running migrations
- Prefer testing first, migrating second

---

### Component Commands

#### `make docker-up`
**Start PostgreSQL and Redis containers**

```bash
make docker-up
```

Starts:
- PostgreSQL 16 with pgvector extension (port 5432)
- Redis 7 (port 6379)

Wait for health checks (≈5 seconds)

---

#### `make db-fix-auth`
**Fix PostgreSQL authentication (pg_hba.conf)**

```bash
make db-fix-auth
```

Adds these entries to pg_hba.conf:
```
host    all             all             172.18.0.0/16           md5
host    all             all             0.0.0.0/0               md5
```

**Why this is needed:**
- Docker routes `localhost:5432` through Docker gateway IP (172.18.0.1)
- PostgreSQL's default pg_hba.conf doesn't allow connections from this IP
- This command makes PostgreSQL accept local development connections

**Automatically called by:**
- `make db-setup`
- `make db-init`

---

#### `make db-migrate`
**Run database migrations**

```bash
make db-migrate
```

Runs Alembic to apply all pending migrations:
```
INFO  [alembic.runtime.migration] Running upgrade  -> dc9632ea5e9f, initial schema
INFO  [alembic.runtime.migration] Running upgrade dc9632ea5e9f -> 2d8c6a39a218, add_cookie_auth_foundation
...
```

Creates tables:
- users
- tasks
- repositories
- agent_runs
- user_sessions
- refresh_tokens
- email_verification_tokens
- password_reset_tokens

**Manually run when:**
- You created a new migration with `poetry run alembic revision --autogenerate -m "..."`
- You pulled new migrations from git

---

#### `make db-test`
**Test database connection**

```bash
make db-test
```

Tests asyncpg connection to PostgreSQL:
```
✓ Database connection successful!
  PostgreSQL version: PostgreSQL 16.11 (Debian 16.11-1.pgdg12+1) on x86_...
```

**Use to verify:**
- PostgreSQL is running and healthy
- Authentication is correctly configured
- Connection parameters in .env are correct

---

#### `make db-reset` (⚠️ Careful!)
**Reset database completely**

```bash
make db-reset
```

**Warning:** This will:
1. Stop all Docker containers
2. Delete all volumes (including database data)
3. Restart PostgreSQL and Redis
4. Re-run all migrations

**Use when:**
- You need a fresh database state
- You want to wipe all test data
- Something is corrupted

---

## Common Workflows

### Setting Up Development Environment
```bash
# Initial setup
make db-setup

# Start development servers
make dev-backend
make dev-frontend
```

### After Pulling New Code with Migrations
```bash
# Apply new migrations
make db-migrate

# Verify everything works
make db-test
```

### Resetting Database During Development
```bash
# Complete reset
make db-reset

# Or if you just want to clear data but keep schema
docker exec codegraph-postgres psql -U codegraph -d codegraph -c "TRUNCATE TABLE users CASCADE;"
```

### Creating New Migrations
```bash
cd apps/backend

# Create migration
poetry run alembic revision --autogenerate -m "Add user preferences table"

# Apply it
make db-migrate

# Verify
make db-test
```

### Checking Database Status
```bash
# Test connection
make db-test

# View Docker containers
make docker-up  # shows status

# View logs
make docker-logs
```

---

## Troubleshooting

### `✗ Connection failed: no pg_hba.conf entry for host "172.18.0.1"`
**PostgreSQL authentication isn't fixed yet**

```bash
make db-fix-auth
make db-test
```

### `✗ Connection failed: Connection refused`
**PostgreSQL container isn't running**

```bash
make docker-up
sleep 5
make db-test
```

### `✗ Connection failed: FATAL: password authentication failed`
**Wrong credentials in .env**

Check `apps/backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://codegraph:codegraph@localhost:5432/codegraph
```

Should match docker-compose.yml:
```yaml
POSTGRES_USER: codegraph
POSTGRES_PASSWORD: codegraph
POSTGRES_DB: codegraph
```

### `ERROR: relation "users" does not exist`
**Migrations haven't been run**

```bash
make db-migrate
make db-test
```

### Database stuck/corrupted
**Full reset**

```bash
make db-reset
```

---

## Technical Details

### PostgreSQL Configuration

**Image:** `pgvector/pgvector:pg16`
- PostgreSQL 16.11
- pgvector extension for vector similarity (AI embeddings)

**Credentials:**
```
User: codegraph
Password: codegraph
Database: codegraph
Port: 5432
```

**Volume:** `postgres_data:/var/lib/postgresql/data`
- Data persists across container restarts
- Deleted with `make db-reset`

### Connection String
```
postgresql+asyncpg://codegraph:codegraph@localhost:5432/codegraph
```

**Components:**
- `postgresql` - PostgreSQL protocol
- `asyncpg` - Async Python driver
- `codegraph:codegraph` - username:password
- `localhost:5432` - host:port
- `codegraph` - database name

### Authentication Fix (pg_hba.conf)

Default PostgreSQL pg_hba.conf only allows:
- Local Unix socket connections
- IPv4 127.0.0.1 (localhost)
- IPv6 ::1

Docker routes connections through gateway IP `172.18.0.1`, which wasn't allowed.

**Solution:** Add entries to pg_hba.conf:
```
host    all             all             172.18.0.0/16           md5
host    all             all             0.0.0.0/0               md5
```

- `172.18.0.0/16` - Docker network range (includes 172.18.0.1)
- `0.0.0.0/0` - All IPv4 (development only, don't use in production!)

---

## Environment Variables

In `apps/backend/.env`:

```env
# Database connection
DATABASE_URL=postgresql+asyncpg://codegraph:codegraph@localhost:5432/codegraph

# Connection pool
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=0

# Echo SQL queries (for debugging)
DB_ECHO=False
```

---

## Next Steps After Setup

1. **Start the backend**
   ```bash
   make dev-backend
   ```

2. **Start the frontend** (in another terminal)
   ```bash
   make dev-frontend
   ```

3. **Generate API client** (if needed)
   ```bash
   make api-generate
   ```

4. **Run tests**
   ```bash
   make test-backend
   ```

---

## Reference

For more information:
- Database models: `apps/backend/src/models/`
- Migrations: `apps/backend/migrations/`
- Configuration: `apps/backend/.env`
- Docker setup: `docker/docker-compose.yml`
- Makefile targets: `Makefile`

---

**Last Updated:** 2025-12-21
