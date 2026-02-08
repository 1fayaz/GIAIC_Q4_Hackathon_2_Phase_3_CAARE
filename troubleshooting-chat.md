# Chat Interface Troubleshooting Guide

## Error: "Failed to load conversations: {}"

### Check 1: Backend is Running
```bash
curl http://localhost:8001/health
```
Expected: `{"status":"healthy"}`

If this fails:
- Backend is not running
- Start it with: `cd backend && uvicorn app.main:app --reload --port 8001`

### Check 2: Frontend API URL is Correct
Check `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

If it says `http://localhost:8000`, change it to `8001` and restart frontend.

### Check 3: Authentication is Working
Open browser DevTools (F12) → Network tab
- Refresh the page
- Look for request to `/api/chat/conversations`
- Check the response:
  - 401 Unauthorized → Authentication issue (try logging out and back in)
  - 500 Internal Server Error → Backend error (check backend terminal for errors)
  - Network Error → Backend not running or wrong port

### Check 4: CORS Configuration
Check backend terminal for CORS errors like:
```
CORS error: Origin 'http://localhost:3000' not allowed
```

If you see this, check `backend/.env`:
```
CORS_ORIGINS=["http://localhost:3000"]
```

### Check 5: Database Connection
Backend terminal should show:
```
INFO:     Application startup complete.
```

If you see database errors:
- Check `backend/.env` has correct `DATABASE_URL`
- Verify Neon database is accessible

### Check 6: OpenAI API Key
If chat sends but gets error "AI agent not configured":
- Check `backend/.env` has `OPENAI_API_KEY`
- Verify the key is valid

## Error: Chat sends but no response

### Check Backend Logs
Look in backend terminal for errors like:
```
ERROR: OPENAI_API_KEY not configured
```

Solution: Add to `backend/.env`:
```
OPENAI_API_KEY=sk-proj-...
```

### Check Network Tab
Open DevTools → Network → Look for `/api/chat/message` request
- Check response status code
- Check response body for error details

## Error: "Conversation not found"

This happens if:
1. You're trying to load a conversation that was deleted
2. Database was reset

Solution:
- Start a new conversation (send a new message)
- Old conversation IDs are no longer valid

