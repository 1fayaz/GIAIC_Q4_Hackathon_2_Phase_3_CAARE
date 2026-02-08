# Fix Authentication Issue

## Quick Fix: Clear Session and Re-login

### Step 1: Clear Browser Data
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Clear site data" button
4. Refresh page

### Step 2: Sign In Again
1. Go to http://localhost:3000
2. Sign in with your credentials
3. After successful login, you should be redirected to /tasks
4. Now click "AI Chat" in navigation

### Step 3: Verify Cookie is Set
After logging in:
1. Open DevTools → Application → Cookies
2. You should see a cookie (session/token)
3. Check it has these properties:
   - Domain: localhost
   - Path: /
   - HttpOnly: ✓
   - Secure: (empty for localhost)

## If Still Not Working: Check CORS

### Backend Terminal - Look for CORS Errors
Check your backend terminal for errors like:
```
CORS error: Origin 'http://localhost:3000' not allowed
```

### Fix CORS Issue
Check `backend/.env`:
```bash
CORS_ORIGINS=["http://localhost:3000"]
```

If it's different, update it and restart backend.

## If Still Not Working: Check Cookie Domain

### Issue: Cookie Set for Wrong Domain
If the cookie is set for `localhost:8001` instead of `localhost:3000`:

**Solution:** Backend needs to set cookie for the frontend domain.

Check backend auth routes - cookies should be set with:
- Domain: Not set (defaults to request origin)
- SameSite: Lax or None
- Secure: False (for localhost)

