# Check if Servers are Running

## Check Backend (Port 8001)
```bash
# Windows PowerShell
Test-NetConnection -ComputerName localhost -Port 8001

# CMD or Git Bash
curl http://localhost:8001/health
```

Expected response:
```json
{"status":"healthy"}
```

## Check Frontend (Port 3000)
```bash
# Windows PowerShell
Test-NetConnection -ComputerName localhost -Port 3000

# CMD or Git Bash
curl http://localhost:3000
```

Expected: HTML response from Next.js

## Check Both at Once
```bash
# Git Bash
curl http://localhost:8001/health && curl http://localhost:3000 -I
```

