# Step-by-Step Authentication Debugging

## STEP 1: Check if You're Logged In

### In Your Browser:
1. Go to http://localhost:3000
2. Are you on the /tasks or /chat page?
   - YES → You're logged in, continue to Step 2
   - NO (on /signin page) → You're NOT logged in, sign in first

### If You're on /signin:
1. Enter your email and password
2. Click "Sign In"
3. You should be redirected to /tasks
4. If login fails, check backend terminal for errors

## STEP 2: Check if Cookie Exists

### In Browser DevTools:
1. Press F12 to open DevTools
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Cookies" in left sidebar
4. Click "http://localhost:3000"
5. Look for a cookie named "auth_token"

### What You Should See:
```
Name: auth_token
Value: eyJ... (long JWT token)
Domain: localhost
Path: /
HttpOnly: ✓ (checked)
Secure: (empty)
SameSite: Lax
```

### If Cookie is Missing:
- You're not logged in properly
- Sign out and sign in again
- Check backend terminal for login errors

### If Cookie Exists:
- Continue to Step 3

## STEP 3: Check if Cookie is Being Sent

### In Browser DevTools:
1. Stay on the /chat page
2. Go to "Network" tab
3. Refresh the page (F5)
4. Look for request to "conversations"
5. Click on it
6. Go to "Headers" section
7. Scroll down to "Request Headers"
8. Look for "Cookie:" header

### What You Should See:
```
Cookie: auth_token=eyJ...
```

### If Cookie Header is Missing:
- Cookie exists but not being sent
- This is a CORS or domain issue
- Continue to Step 4

### If Cookie Header is Present:
- Cookie is being sent
- Check the "Response" tab
- What status code do you see?
  - 401 → Token is invalid/expired
  - 500 → Backend error
  - 200 → Should work (but error in frontend code)

## STEP 4: Check CORS Configuration

### Check Backend .env:
```bash
cat backend/.env | grep CORS_ORIGINS
```

Should show:
```
CORS_ORIGINS=["http://localhost:3000"]
```

### If Different:
1. Update backend/.env:
   ```
   CORS_ORIGINS=["http://localhost:3000"]
   ```
2. Restart backend server
3. Try again

## STEP 5: Check Backend Terminal for Errors

### Look for These Errors:
- "CORS error"
- "Token validation failed"
- "Invalid token"
- "Token expired"

### If You See Token Errors:
- Token is expired or invalid
- Sign out and sign in again

## STEP 6: Nuclear Option - Clear Everything

### If Nothing Works:
1. Close all browser tabs for localhost:3000
2. Open DevTools → Application → Clear site data
3. Close browser completely
4. Restart both backend and frontend servers
5. Open browser fresh
6. Sign in again
7. Try chat interface

