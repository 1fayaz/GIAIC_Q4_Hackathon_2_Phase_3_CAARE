# Check if Cookie is Being Sent

## In Browser DevTools:

1. Go to http://localhost:3000/chat
2. Open DevTools (F12)
3. Go to "Network" tab
4. Refresh page (F5)
5. Find "conversations" request
6. Click on it
7. Go to "Headers" tab
8. Scroll to "Request Headers" section

## Look for this line:
```
Cookie: auth_token=eyJ...
```

## CRITICAL:
- Is the Cookie header present? YES or NO?
- If YES: Copy the first 20 characters of the token value
- If NO: This is the problem - cookie not being sent

## Also Check:
In "Application" tab → Cookies → http://localhost:3000
- Is "auth_token" cookie present? YES or NO?
- What is the "Domain" value? (should be "localhost")
- What is the "Path" value? (should be "/")
- Is "HttpOnly" checked? (should be YES)
- Is "SameSite" set to "Lax"? (should be YES)

