# FastAPI/Uvicorn WinError 10013 Fix - Complete Guide

## Problem
```
[WinError 10013] An attempt was made to access a socket in a way 
forbidden by its access permissions
```

## Root Causes (Windows-Specific)

1. **Port already in use** by another application
2. **Hyper-V/Docker** reserving port ranges
3. **Windows NAT** reserving ports dynamically
4. **Port in excluded range** (Windows reserves certain ports)
5. **Firewall** blocking the port

---

## Step-by-Step Diagnosis & Fix

### Step 1: Check What's Using Port 8000 (Default Uvicorn Port)

**PowerShell:**
```powershell
# Check if port 8000 is in use
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# If something is using it, you'll see the process ID (PID)
# To find what process it is:
Get-Process -Id <PID>
```

**CMD:**
```cmd
netstat -ano | findstr :8000
```

### Step 2: Check Windows Reserved/Excluded Port Ranges

**PowerShell (Run as Administrator):**
```powershell
# Show all excluded port ranges
netsh interface ipv4 show excludedportrange protocol=tcp

# This will show ranges like:
# Start Port    End Port
# ----------    --------
#       5357        5357
#       8000        8099  <- Your port might be here!
```

**This is the most common cause on Windows with Hyper-V/Docker installed!**

---

## Solutions

### Solution 1: Use a Different Port (Recommended)

Try these safe alternative ports in order:

**Option A - Port 8001:**
```bash
uvicorn main:app --reload --port 8001
```

**Option B - Port 8080:**
```bash
uvicorn main:app --reload --port 8080
```

**Option C - Port 5000:**
```bash
uvicorn main:app --reload --port 5000
```

**Option D - Port 3001:**
```bash
uvicorn main:app --reload --port 3001
```

### Solution 2: Find a Safe Port Automatically

**PowerShell script to find available port:**
```powershell
# Find first available port starting from 8001
$port = 8001
while (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
    $port++
}
Write-Host "Available port found: $port" -ForegroundColor Green
Write-Host "Run: uvicorn main:app --reload --port $port" -ForegroundColor Cyan
```

### Solution 3: Kill Process Using Port 8000

**Only if you know it's safe to kill:**

```powershell
# PowerShell
$conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($conn) {
    $pid = $conn.OwningProcess
    Stop-Process -Id $pid -Force
    Write-Host "Process killed. Try uvicorn again." -ForegroundColor Green
}
```

```cmd
REM CMD
netstat -ano | findstr :8000
REM Note the PID (last column), then:
taskkill /F /PID <PID>
```

### Solution 4: Reserve a Specific Port (Advanced)

**If you need port 8000 specifically and it's in excluded range:**

```powershell
# Run PowerShell as Administrator
# Reserve port 8000 for your use
netsh int ipv4 add excludedportrange protocol=tcp startport=8000 numberofports=1

# Then restart your computer
```

**Warning:** This requires admin rights and system restart.

---

## Quick Fix Commands

### Recommended Quick Fix (Try in Order):

```bash
# 1. Try port 8001
uvicorn main:app --reload --port 8001

# 2. If that fails, try 8080
uvicorn main:app --reload --port 8080

# 3. If that fails, try 5000
uvicorn main:app --reload --port 5000
```

### Update Your Frontend API URL

If you change the port, update your frontend to point to the new port:

```javascript
// Next.js frontend - update API_URL
const API_URL = "http://localhost:8001"  // Changed from 8000
```

Or use environment variable:
```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## Verification

After running uvicorn with a different port, you should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [PID] using WatchFiles
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Prevention Tips

1. **Use consistent ports** across your team (document in README)
2. **Check excluded ranges** before choosing a port
3. **Use environment variables** for port configuration
4. **Avoid ports 8000-8099** if you have Hyper-V/Docker
5. **Document the port** in your .env.example file

---

## Common Safe Ports for Development

| Port | Common Use | Usually Safe? |
|------|------------|---------------|
| 3000 | Next.js default | ✅ Yes |
| 3001 | Alt frontend | ✅ Yes |
| 5000 | Flask/Alt backend | ✅ Usually |
| 8001 | Alt backend | ✅ Usually |
| 8080 | Alt backend | ✅ Usually |
| 8000 | Uvicorn default | ⚠️ Often reserved by Hyper-V |

---

## Troubleshooting

### Issue: All ports seem blocked

1. **Disable Hyper-V temporarily** (requires restart):
   ```powershell
   # Run as Administrator
   bcdedit /set hypervisorlaunchtype off
   # Restart computer
   ```

2. **Check Windows Defender Firewall**:
   - Open Windows Defender Firewall
   - Allow Python through firewall
   - Create inbound rule for your port

### Issue: Port works but frontend can't connect

1. **Check CORS settings** in FastAPI:
   ```python
   # main.py - should already have this
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],  # Your frontend URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Use 0.0.0.0 instead of 127.0.0.1**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

---

## Environment Variable Configuration (Best Practice)

**backend/.env:**
```bash
PORT=8001
HOST=0.0.0.0
```

**backend/main.py:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
```

**Run with:**
```bash
python main.py
```

