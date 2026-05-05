# Deployment Guide

This monorepo deploys as **two services**:

- **Frontend (Next.js)** → Vercel
- **Backend (FastAPI)** → Render / Railway / Fly.io (Vercel does not run long-lived FastAPI)
- **Database** → Neon Serverless Postgres (already in use)

---

## 1. Rotate secrets first

Anything that ever appeared in chat, screenshots, or a public commit must be replaced before deploying:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

Rotate:
- Neon DB password (Neon dashboard → Roles → Reset password)
- `JWT_SECRET` in `backend/.env`
- `AUTH_SECRET` in `frontend/.env.local`

---

## 2. Push to GitHub

```bash
git init
git add .
git status               # confirm no .env, no cookies.txt, no test_register.json
git commit -m "feat: initial commit — FAN Tasks"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

The root `.gitignore` already blocks `.env*`, `cookies.txt`, `test_register.json`, `.venv/`, `node_modules/`, `.next/`.

---

## 3. Deploy the backend (FastAPI on Render — free tier works)

1. Create a new **Web Service** on https://dashboard.render.com
2. Connect the GitHub repo, set **Root Directory** to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (from `backend/.env.example`):
   - `DATABASE_URL` — your Neon connection string with `+asyncpg` and `?ssl=require`
   - `JWT_SECRET` — fresh value
   - `JWT_ALGORITHM=HS256`
   - `JWT_EXPIRATION=3600`
   - `LOG_LEVEL=INFO`
   - `ENVIRONMENT=production` ← critical (flips cookies to `Secure; SameSite=None`)
   - `CORS_ORIGINS=["https://your-app.vercel.app"]` ← set after step 4 if you don't know yet
6. Deploy. Note the URL, e.g. `https://fan-tasks-api.onrender.com`.

---

## 4. Deploy the frontend (Next.js on Vercel)

1. Import the repo on https://vercel.com/new
2. **Root Directory**: `frontend`
3. Framework preset: Next.js (auto-detected)
4. Environment variables (Production scope):
   - `NEXT_PUBLIC_API_URL=https://fan-tasks-api.onrender.com` (from step 3)
   - `AUTH_SECRET` — fresh value
   - `BETTER_AUTH_URL=https://your-app.vercel.app` (you can set this after the first deploy)
5. Deploy. Note the URL, e.g. `https://fan-tasks.vercel.app`.

---

## 5. Wire CORS + Better Auth URLs

After both URLs exist, update them on each side and redeploy:

- Render → `CORS_ORIGINS=["https://fan-tasks.vercel.app"]`
- Vercel → `BETTER_AUTH_URL=https://fan-tasks.vercel.app`

---

## 6. Smoke test

1. Visit the Vercel URL.
2. Sign up → check Network tab: `Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=None`.
3. Reload — session should persist.
4. Create / edit / delete a task → confirm it round-trips to Render.
5. Hit `https://fan-tasks-api.onrender.com/docs` and confirm Swagger loads.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Failed to fetch` on signin | CORS or wrong API URL | Check `NEXT_PUBLIC_API_URL` and `CORS_ORIGINS` match exactly (https, no trailing slash) |
| Login succeeds but dashboard says "not authenticated" | Cookie not stored cross-site | Confirm `ENVIRONMENT=production` on backend so cookie has `Secure; SameSite=None` |
| 502 on first backend request | Render free tier cold start | First request takes ~30s after idle — normal |
| `DATABASE_URL must use asyncpg driver` | Wrong scheme | Use `postgresql+asyncpg://...`, not `postgres://` |

---

## Why Vercel can't host the backend

FastAPI relies on long-lived async sessions (`asyncpg` connection pool, SQLModel session-per-request). Vercel only supports stateless Python serverless functions, which would require rewriting the request lifecycle, the DB pool, and the Better Auth integration. Render / Railway / Fly each give you a real container with persistent processes — the right shape for this app.
