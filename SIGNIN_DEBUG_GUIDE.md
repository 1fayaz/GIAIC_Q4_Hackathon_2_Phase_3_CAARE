# Sign-In Debugging Guide

## Issue Summary
User can sign up successfully, but sign-in appears to do nothing - no redirect, no error, no response.

## Root Cause Analysis

### What We've Verified ✅

1. **Backend Login Endpoint Works**
   - Endpoint: `POST http://localhost:8001/api/auth/login`
   - Successfully created test user: `debuguser@test.com`
   - Returns proper JWT token in httpOnly cookie
   - Status: 200 OK

2. **Frontend Configuration**
   - API URL correctly set to `http://localhost:8001`
   - CORS properly configured (backend allows `http://localhost:3000`)
   - TypeScript compiles without errors

3. **Code Structure**
   - SignInForm component has `'use client'` directive ✅
   - Form uses React Hook Form properly ✅
   - Button component works correctly ✅
   - Auth context provider is set up ✅

### What's Missing ❌

**No POST requests reaching backend** - Backend logs show NO `/api/auth/login` requests when user clicks Sign In button.

This indicates the issue is in the **frontend JavaScript execution**, not the backend.

## Debugging Steps Added

### 1. Console Logging
Added detailed logging to track execution flow:

**SignInForm.tsx:**
```typescript
console.log('SignInForm: Form submitted', { email });
console.log('SignInForm: Calling signIn...');
console.log('SignInForm: Sign in successful, redirecting...');
console.error('SignInForm: Sign in error:', error);
```

**auth.ts (AuthProvider):**
```typescript
console.log('AuthProvider: signIn called', { email });
console.log('AuthProvider: Calling apiClient.signIn...');
console.log('AuthProvider: API response received', response);
console.log('AuthProvider: User and session set successfully');
console.error('AuthProvider: signIn error:', error);
```

### 2. Test Page Created
Created `test_login.html` with minimal form to test backend directly.

## Testing Instructions

### Step 1: Open Browser Developer Console

1. Open browser (Chrome/Firefox/Edge)
2. Navigate to: http://localhost:3000/signin
3. Press **F12** to open Developer Tools
4. Go to **Console** tab
5. Clear console (click trash icon)

### Step 2: Attempt Sign In

1. Enter credentials:
   - Email: `debuguser@test.com`
   - Password: `TestPass123!@#`

2. Click **Sign In** button

3. **Watch the console** for:
   - ✅ `SignInForm: Form submitted` - Form handler triggered
   - ✅ `SignInForm: Calling signIn...` - Auth function called
   - ✅ `AuthProvider: signIn called` - Provider received call
   - ✅ `AuthProvider: Calling apiClient.signIn...` - API call initiated
   - ❌ Any JavaScript errors (red text)

### Step 3: Check Network Tab

1. Go to **Network** tab in DevTools
2. Filter by **Fetch/XHR**
3. Look for POST request to `/api/auth/login`

**If you see the request:**
- Check status code (should be 200)
- Check response body
- Check cookies (should have `auth_token`)

**If you DON'T see the request:**
- JavaScript error is preventing the API call
- Check Console tab for errors

### Step 4: Check for Common Issues

#### Issue A: JavaScript Error
**Symptom**: Console shows red error messages
**Solution**: Share the error message for debugging

#### Issue B: CORS Error
**Symptom**: Console shows "CORS policy" error
**Solution**: Backend CORS configuration needs adjustment

#### Issue C: Network Error
**Symptom**: Request fails with network error
**Solution**: Backend server not running or wrong port

#### Issue D: Form Not Submitting
**Symptom**: No console logs appear at all
**Solution**: React Hook Form not wired correctly

## Expected Behavior

### Successful Sign In Flow:

1. **Console logs appear:**
   ```
   SignInForm: Form submitted {email: "debuguser@test.com"}
   SignInForm: Calling signIn...
   AuthProvider: signIn called {email: "debuguser@test.com"}
   AuthProvider: Calling apiClient.signIn...
   ```

2. **Network request sent:**
   ```
   POST http://localhost:8001/api/auth/login
   Status: 200 OK
   ```

3. **Response received:**
   ```json
   {
     "access_token": "token_set_in_cookie",
     "token_type": "bearer",
     "user": {
       "id": "...",
       "email": "debuguser@test.com"
     },
     "expires_at": "..."
   }
   ```

4. **Cookie set:**
   ```
   auth_token=<jwt_token>; HttpOnly; SameSite=Lax
   ```

5. **Redirect occurs:**
   - Browser navigates to `/tasks`
   - User sees task dashboard

## Quick Test with Test Page

If frontend isn't working, test backend directly:

1. Open: `file:///D:/Phase2_H2_Q4_GIAIC/test_login.html`
2. Click "Sign In"
3. Should see JSON response with user data

This confirms backend is working independently.

## Configuration Summary

**Backend (Port 8001):**
- CORS Origins: `["http://localhost:3000"]`
- JWT Expiration: 3600 seconds (1 hour)
- Cookie: HttpOnly, SameSite=Lax

**Frontend (Port 3000):**
- API URL: `http://localhost:8001`
- Credentials: `include` (sends cookies)

## Next Steps

1. **Test in browser** following steps above
2. **Share console output** - Copy all console logs
3. **Share network tab** - Screenshot of requests
4. **Report what you see** - Any errors or unexpected behavior

## Potential Fixes

### If JavaScript Error Found:
- Fix the specific error in the code
- Restart frontend server

### If CORS Error:
- Verify backend CORS includes frontend origin
- Check credentials: 'include' in fetch

### If No Logs Appear:
- Form submission not wired correctly
- Check React Hook Form setup
- Verify button type="submit"

### If Request Fails:
- Check backend server is running
- Verify port 8001 is correct
- Test with curl/Postman

---

**Status**: Debugging in progress
**Last Updated**: 2026-02-07
**Servers Running**: Backend (8001) ✅ | Frontend (3000) ✅
