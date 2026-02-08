# Verify Tasks Page is Working

## On the /tasks page:

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page (F5)
4. Look for request to "tasks" (should be http://localhost:8001/api/tasks)
5. Click on it

## Check:
- Status Code: Should be 200 (not 401)
- Response: Should show your tasks array
- Request Headers: Should have "Cookie: auth_token=..."

## If Status is 401:
- You're not actually authenticated
- The cookie isn't being sent
- Same issue affects both /tasks and /chat

## If Status is 200:
- Authentication works for /tasks
- But not for /chat
- This is strange and needs investigation

## Report Back:
- /tasks page status code: ___
- Can you see your tasks on the page: YES/NO
- Cookie header present in /tasks request: YES/NO

