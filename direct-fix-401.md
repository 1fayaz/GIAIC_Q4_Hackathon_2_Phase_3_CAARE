# Direct Fix for 401 Error

## The 401 error means the backend is rejecting your authentication.

## MOST LIKELY CAUSE: Cookie Domain Mismatch

The cookie might be set for `localhost:8001` (backend) instead of `localhost:3000` (frontend).

## FIX: Check Backend Cookie Configuration

The backend sets cookies when you log in. Let's verify it's setting them correctly.

### Check backend/app/routes/auth.py

The cookie should be set with:
- Domain: NOT SET (so it defaults to the request origin)
- Path: /
- SameSite: lax
- Secure: False (for localhost)

### Current Configuration (from our earlier check):
```python
response.set_cookie(
    key="auth_token",
    value=access_token,
    httponly=True,
    secure=False,
    samesite="lax",
    max_age=settings.JWT_EXPIRATION,
    path="/"
)
```

This looks correct. The issue might be that the cookie is being set for the wrong domain.

## ALTERNATIVE FIX: Use localStorage Instead of Cookies

If cookies continue to fail, we can switch to localStorage (less secure but will work).

## IMMEDIATE TEST: Manual Cookie Check

1. Go to http://localhost:3000/tasks
2. Open DevTools → Application → Cookies → http://localhost:3000
3. Look at the "auth_token" cookie
4. Check the "Domain" column - what does it say?
   - If it says "localhost" → GOOD
   - If it says "localhost:8001" → BAD (wrong domain)
   - If it says ".localhost" → GOOD
   - If missing → You're not logged in

## IF DOMAIN IS WRONG:

The backend is setting the cookie for its own domain (8001) instead of the frontend domain (3000).

This happens when the backend doesn't properly handle CORS and cookie domains.

### Solution: Add domain parameter to cookie

We need to NOT set a domain, or set it to the frontend domain.

