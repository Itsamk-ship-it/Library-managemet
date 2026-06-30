# 📚 Bookworm — Library Management System

A full-stack library management application: browse a catalog, borrow & return
books, track reading history, and manage the collection from an admin dashboard.

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + TypeScript + Vite + React Router |
| Backend  | Node.js + Express + TypeScript |
| ORM/DB   | Prisma + PostgreSQL |
| Cache    | Redis (popular-book cache, sessions, rate limiting) |
| Deploy   | Docker Compose (Postgres, Redis, API, Nginx-served SPA) |

## Features

- **Authentication** — register/login with JWT, bcrypt-hashed passwords, Redis-backed sessions (supports logout / "log out everywhere").
- **Book catalog** — search by title/author/ISBN, filter by category, sort, paginate.
- **Borrow & return** — transactional copy tracking, per-user loan limits, due dates, overdue flags.
- **Categories** — organize and filter the collection.
- **Reading history** — every loan recorded per user.
- **Admin dashboard** — collection/member/loan stats, most-borrowed books, recent activity.
- **Admin book management** — full CRUD for books and categories.
- **Redis** — caches the "popular books" list, stores sessions, and powers per-IP/per-user rate limiting (fails open if Redis is down).

## Data model (PostgreSQL via Prisma)

- **User** — `id, email, name, password, role (USER|ADMIN)`
- **Category** — `id, name, slug`
- **Book** — `id, title, author, isbn, description, coverUrl, publishedAt, totalCopies, available, borrowCount, categoryId`
- **BorrowRecord** — `id, userId, bookId, status (BORROWED|RETURNED|OVERDUE), borrowedAt, dueAt, returnedAt`

---

## Quick start with Docker (recommended)

Requires Docker + Docker Compose.

```bash
cd library-management
docker compose up --build
```

This starts Postgres, Redis, the API, and the Nginx-served frontend. On first
boot the backend runs `prisma db push` to create the schema.

Then seed demo data (categories, books, and demo users):

```bash
docker compose exec backend node dist/seed.js
```

- **App:** http://localhost:8080
- **API:** http://localhost:4000/api/health

### Demo accounts

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@library.dev    | admin123  |
| User  | reader@library.dev   | user1234  |

---

## Local development (without Docker for the apps)

You still need Postgres and Redis. The easiest way is to run just those two with
Docker:

```bash
docker compose up -d postgres redis
```

### Backend

```bash
cd backend
cp .env.example .env          # adjust if needed
npm install
npm run prisma:push           # create tables
npm run seed                  # load demo data
npm run dev                   # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env          # optional
npm install
npm run dev                   # http://localhost:5173 (proxies /api -> :4000)
```

---

## API overview

Base path: `/api`

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Log in (returns JWT, also sets cookie) |
| GET  | `/auth/me` | Current user |
| POST | `/auth/logout` | End current session |
| POST | `/auth/logout-all` | End all sessions |

### Books
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/books` | — | List w/ `?q=&category=&sort=&page=&limit=` |
| GET | `/books/popular` | — | Cached top-borrowed books |
| GET | `/books/:id` | — | Book detail |
| POST | `/books/:id/borrow` | user | Borrow a copy |
| POST | `/books/:id/return` | user | Return a copy |
| POST | `/books` | admin | Create |
| PUT | `/books/:id` | admin | Update |
| DELETE | `/books/:id` | admin | Delete |

### Categories
| GET `/categories` | POST `/categories` (admin) | DELETE `/categories/:id` (admin) |

### Borrows (current user)
| GET `/borrows/active` | GET `/borrows/history` |

### Admin
| GET `/admin/stats` | GET `/admin/users` | GET `/admin/loans` |

---

## Configuration

Backend env vars (see `backend/.env.example`):

| Var | Default | Notes |
|-----|---------|-------|
| `DATABASE_URL` | local Postgres | Prisma connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `JWT_SECRET` | dev placeholder | **change in production** |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list (comma-separated) |
| `LOAN_PERIOD_DAYS` | `14` | Default loan length |
| `MAX_CONCURRENT_BORROWS` | `5` | Per-user active loan cap |

## Project structure

```
library-management/
├── docker-compose.yml
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.ts            # Express app + server
│       ├── config/env.ts
│       ├── lib/                # prisma, redis, sessions, jwt, errors
│       ├── middleware/         # auth, rate limiting, error handling
│       ├── controllers/        # auth, book, category, borrow, admin
│       ├── routes/
│       └── seed.ts
└── frontend/
    └── src/
        ├── api/                # fetch client + types
        ├── context/AuthContext.tsx
        ├── components/         # Navbar, BookCard, ProtectedRoute
        └── pages/              # catalog, detail, loans, history, admin
```
