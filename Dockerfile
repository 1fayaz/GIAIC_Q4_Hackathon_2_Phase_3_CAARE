# Hugging Face Spaces (Docker SDK) — FastAPI backend
# HF requires the Dockerfile at the repo root and serves on port 7860.
FROM python:3.11-slim

# Avoid .pyc files and enable unbuffered logs (so HF shows output live).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install backend dependencies first (better layer caching).
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend source.
COPY backend ./backend

# Run from inside backend/ so the `app.*` package imports resolve.
# (Every module uses `from app.core...`, not `from backend.app...`.)
WORKDIR /app/backend

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
