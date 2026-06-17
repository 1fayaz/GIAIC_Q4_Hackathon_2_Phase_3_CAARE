---
title: FAN Tasks API
emoji: ✅
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# ✅ FAN Tasks — Full-Stack Multi-User Todo App

> A production-deployed, multi-user task manager built with **Spec-Driven Development (SDD)**. Next.js frontend, FastAPI backend, JWT auth, and a serverless Postgres database — fully separated, fully deployed.

> **Note:** The YAML block above is [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces-config-reference) configuration for the backend deployment. GitHub renders it as a small table — it's harmless here and required by HF.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| **Frontend (Next.js)** | https://giaicq4hackathon2phase3caare.vercel.app |
| **Backend API (FastAPI)** | https://fan007ali-todo-app-phase3-q4-giaic.hf.space |
| **API Docs (Swagger)** | https://fan007ali-todo-app-phase3-q4-giaic.hf.space/docs |

Sign up (passwords must be **at least 12 characters**), log in, and manage your tasks. Each user only ever sees their own data.

---

## ✨ Features

- 🔐 **Secure authentication** — email/password signup & signin, JWT in an httpOnly cookie, bcrypt-hashed passwords
- 👥 **Multi-user data isolation** — every task is scoped to its owner via `user_id`; cross-user access is rejected
- ✅ **Full task CRUD** — create, read, update, complete, and delete tasks
- 🏷️ **Rich task fields** — title, description, priority, tags, due date, completion status
- 🔎 **Filtering & search** — by status, priority, tag, due date, and free-text search
- 📱 **Responsive UI** — glassmorphic design that works on desktop and mobile
- 🌐 **Cross-domain auth** — `SameSite=None; Secure` cookies so the Vercel frontend and HF backend authenticate cleanly

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, React Hook Form |
| **Backend** | Python 3.11+, FastAPI, SQLModel, async SQLAlchemy |
| **Database** | Neon Serverless PostgreSQL (asyncpg driver) |
| **Auth** | JWT (python-jose), bcrypt (passlib), httpOnly cookies |
| **Deployment** | Frontend → **Vercel** · Backend → **Hugging Face Spaces (Docker)** · DB → **Neon** |
| **Methodology** | Spec-Driven Development with Spec-Kit Plus + Claude Code |

---

## 📁 Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/            # config, database, auth (JWT/bcrypt)
│   │   ├── models/          # SQLModel tables (User, Task)
│   │   ├── routes/          # /api/auth, /api/tasks endpoints
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── dependencies/    # auth dependency (get_current_user)
│   │   └── main.py          # FastAPI app + CORS + lifecycle
│   ├── migrations/          # SQL migrations
│   └── requirements.txt
├── frontend/                # Next.js 16 App Router frontend
│   ├── app/
│   │   ├── (auth)/          # signin / signup pages
│   │   └── (dashboard)/     # protected tasks dashboard
│   ├── components/          # UI + auth + task components
│   ├── hooks/               # useAuth, useTasks
│   ├── lib/                 # api-client, auth provider, types
│   └── middleware.ts        # (pass-through — see note below)
├── specs/                   # SDD specifications, plans, tasks
├── history/                 # Prompt History Records (PHRs)
├── Dockerfile               # Hugging Face Space (backend) container
├── DEPLOYMENT.md            # Full deployment guide
└── README.md
```

---

## 🔌 API Endpoints

**Auth** (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account, set auth cookie |
| `POST` | `/api/auth/login` | Sign in, set auth cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET`  | `/api/auth/session` | Current user from cookie |

**Tasks** (`/api/tasks`) — all require authentication, scoped to the current user
| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/tasks` | List tasks (supports filters) |
| `GET`    | `/api/tasks/{id}` | Get one task |
| `POST`   | `/api/tasks` | Create a task |
| `PUT`    | `/api/tasks/{id}` | Update a task |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

Interactive docs: **`/docs`** (Swagger) on the backend.

---

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Neon (or any) PostgreSQL connection string

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # then fill in real values
uvicorn app.main:app --reload --port 8000
```

Backend runs at http://localhost:8000 (docs at `/docs`).

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env.local  # then fill in real values
npm run dev
```

Frontend runs at http://localhost:3000.

---

## 🔐 Environment Variables

### `backend/.env`
```bash
DATABASE_URL=postgresql+asyncpg://USER:PASS@HOST/DB?ssl=require
JWT_SECRET=<openssl rand -base64 32>
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
ENVIRONMENT=development            # "production" when deployed (flips cookies to Secure; SameSite=None)
CORS_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=INFO
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000   # the deployed backend URL in production
AUTH_SECRET=<openssl rand -base64 32>
```

> ⚠️ **Never commit secrets.** `.env`, `.env.local`, `.vercel/`, and logs are gitignored. Use fresh secrets per environment.

---

## 🌐 Deployment

This is a **two-service** deployment (see `DEPLOYMENT.md` for full details):

- **Backend → Hugging Face Spaces (Docker SDK).** The root `Dockerfile` installs `backend/requirements.txt` and runs `uvicorn app.main:app` from inside `backend/` on port `7860`. Set the backend env vars as **Space secrets**, including `ENVIRONMENT=production` and `CORS_ORIGINS=["https://<your-vercel-app>.vercel.app"]`.
- **Frontend → Vercel.** Root directory `frontend`, framework auto-detected. Set `NEXT_PUBLIC_API_URL` (the HF backend URL) and `AUTH_SECRET`.

### Cross-domain auth note
Because the frontend (Vercel) and backend (HF) live on **different domains**, the backend issues its auth cookie with `SameSite=None; Secure` (enabled by `ENVIRONMENT=production`). Edge middleware on the frontend domain **cannot read** a cookie scoped to the backend domain, so `frontend/middleware.ts` is a documented pass-through and route protection is handled **client-side** in `app/(dashboard)/layout.tsx` via the `/api/auth/session` check.

---

## 🧪 Methodology — Spec-Driven Development

This project was built with **SDD**: every feature went through `spec → plan → tasks → implement`, with all implementation done via specialized Claude Code agents. Artifacts live in:

- `specs/` — feature specifications, architecture plans, and task breakdowns
- `history/prompts/` — Prompt History Records (PHRs) capturing each step
- `.specify/` — Spec-Kit Plus templates and project constitution

---

## 📄 License

Built for the GIAIC Quarter 4 Hackathon (Phase 3).
