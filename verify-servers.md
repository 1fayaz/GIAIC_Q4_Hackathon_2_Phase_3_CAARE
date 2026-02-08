# Verify Servers are Running

## Test Backend Health Endpoint
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{"status":"healthy"}
```

## Test Backend API Documentation
Open in browser:
- Swagger UI: http://localhost:8001/docs
- You should see all API endpoints listed

## Test Frontend
Open in browser:
- Frontend: http://localhost:3000
- You should see the login page

## Test Chat Conversations Endpoint (After Login)
```bash
# This will fail with 401 if not logged in (expected)
curl http://localhost:8001/api/chat/conversations
```

Expected (before login):
```json
{"success":false,"error":{"code":"UNAUTHORIZED","message":"..."}}
```

This is correct! It means the endpoint exists and requires authentication.

