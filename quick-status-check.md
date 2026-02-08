# Quick Status Check

## ✅ Pre-flight Checklist

### 1. Check if ports are free
```bash
# Check port 8001 (backend)
netstat -an | grep 8001

# Check port 3000 (frontend)
netstat -an | grep 3000
```

If you see "LISTENING", something is already using that port.

### 2. Check .env files exist
```bash
# Backend .env
ls backend/.env

# Frontend .env.local
ls frontend/.env.local
```

Both should exist.

### 3. Check API URL is correct
```bash
cat frontend/.env.local | grep API_URL
```

Should show: `NEXT_PUBLIC_API_URL=http://localhost:8001`

### 4. Check OpenAI API key exists
```bash
cat backend/.env | grep OPENAI_API_KEY
```

Should show: `OPENAI_API_KEY=sk-proj-...`

