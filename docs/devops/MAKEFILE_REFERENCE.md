# Makefile Quick Reference

## Most Common Commands

### Development Setup & Start
```bash
make db-setup      # One-time: setup database + migrations
make dev-backend   # Start backend dev server
make dev-frontend  # Start frontend dev server
make dev           # Start all (backend + frontend + docker)
```

### Database Management
```bash
make db-test       # Test database connection ✓
make db-migrate    # Run pending migrations
make db-setup      # Full setup (docker + auth fix + migrate)
make db-reset      # ⚠️ Delete all data and reinitialize
```

### Docker
```bash
make docker-up     # Start PostgreSQL & Redis
make docker-down   # Stop all containers
make docker-logs   # View container logs
```

### Code Quality
```bash
make lint          # Lint backend + frontend
make format        # Format code (black + prettier)
make type-check    # Type check (mypy + tsc)
make check         # All checks: lint + format + type-check
```

### Testing
```bash
make test-backend  # Run backend tests (pytest)
make test-frontend # Run frontend tests (vitest)
make test          # Run all tests
```

### Installation
```bash
make install       # Install all dependencies
make install-backend
make install-frontend
```

---

## Database Command Flow

```
make db-setup
    ├── docker-up          (start containers)
    ├── db-fix-auth        (fix pg_hba.conf)
    ├── db-migrate         (run migrations)
    └── db-test            (verify connection) ✓

make db-init
    ├── docker-up
    ├── db-fix-auth
    ├── db-test
    └── db-migrate
```

---

## Help

```bash
make help  # Show all available commands
```

---

## Pro Tips

### Run after pulling new code
```bash
make db-migrate    # Apply new migrations
make lint          # Check code quality
make test-backend  # Run tests
```

### Complete fresh start
```bash
make db-reset      # Delete all data + reinit
make install       # Reinstall dependencies
make check         # Verify everything
```

### Development workflow
```bash
# Terminal 1: Backend
make dev-backend

# Terminal 2: Frontend
make dev-frontend

# Terminal 3: Tests/Utils
make test-backend --watch
```

---

## All Commands

### Setup & Installation
| Command | Purpose |
|---------|---------|
| `make install` | Install all dependencies |
| `make install-backend` | Install backend only |
| `make install-frontend` | Install frontend only |
| `make setup` | Full development setup |

### Development
| Command | Purpose |
|---------|---------|
| `make dev` | Start all services |
| `make dev-backend` | Start backend server only |
| `make dev-frontend` | Start frontend server only |

### Database (New!)
| Command | Purpose |
|---------|---------|
| `make db-setup` | **Full database setup** |
| `make db-init` | Alternative init (test first) |
| `make db-test` | Test database connection |
| `make db-migrate` | Run migrations |
| `make db-fix-auth` | Fix PostgreSQL auth |
| `make db-reset` | ⚠️ Reset database |

### Docker
| Command | Purpose |
|---------|---------|
| `make docker-up` | Start containers |
| `make docker-down` | Stop containers |
| `make docker-logs` | View logs |
| `make docker-compose` | Full stack (interactive) |

### Code Quality
| Command | Purpose |
|---------|---------|
| `make lint` | Lint both |
| `make lint-backend` | Lint backend |
| `make lint-frontend` | Lint frontend |
| `make lint-fix` | Fix frontend lint |
| `make format` | Format both |
| `make format-backend` | Format backend |
| `make format-frontend` | Format frontend |
| `make type-check` | Type check both |
| `make type-check-backend` | Type check backend |
| `make type-check-frontend` | Type check frontend |
| `make check` | All checks (lint + format + type-check) |
| `make check-backend` | Backend checks |
| `make check-frontend` | Frontend checks |

### Testing
| Command | Purpose |
|---------|---------|
| `make test` | Run all tests |
| `make test-backend` | Run backend tests |
| `make test-frontend` | Run frontend tests |

### Build
| Command | Purpose |
|---------|---------|
| `make build` | Build both |
| `make build-backend` | Build backend |
| `make build-frontend` | Build frontend |

### API
| Command | Purpose |
|---------|---------|
| `make api-generate` | Generate API client from OpenAPI |

### Cleanup
| Command | Purpose |
|---------|---------|
| `make clean` | Clean all artifacts |
| `make clean-backend` | Clean backend caches |
| `make clean-frontend` | Clean frontend caches |

### Utility
| Command | Purpose |
|---------|---------|
| `make status` | Show system status |
| `make help` | Show this help |

---

## Examples

### Fresh start from scratch
```bash
make db-setup
make install-frontend
make api-generate
make dev
```

### After git pull with new migrations
```bash
make db-migrate
make lint
make type-check
make test-backend
```

### Clean slate
```bash
make db-reset
make clean
make install
make db-migrate
make dev
```

### Code review checklist
```bash
make check          # Lint + format + type-check
make test-backend   # Run tests
make test-frontend
```

---

## Notes

- Most commands are chainable, e.g. `make db-setup dev-backend`
- Database commands are **sequential** (each step depends on previous)
- Code quality commands can run in **parallel** independently
- All paths use relative `$(PWD)` for portability
- Database uses environment variables from `apps/backend/.env`

---

**For detailed information, see:**
- `DATABASE_SETUP.md` - Complete database guide
- `CLAUDE.md` - Development environment guide
- `Makefile` - Source code for all targets

---

**Last Updated:** 2025-12-21
