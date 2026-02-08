# Quick Fix Commands for Your FastAPI Backend

## Your Project Structure:
- Backend: D:\giaic\quater 4 hackathon\Phase3_H2_Q4_GIAIC\backend
- Main file: backend/app/main.py
- Current command failing: uvicorn main:app --reload

## IMMEDIATE FIX (Choose One Method)

### Method 1: Use Port 8001 (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run with port 8001
uvicorn app.main:app --reload --port 8001
```

### Method 2: Use Port 8080

```bash
cd backend
uvicorn app.main:app --reload --port 8080
```

### Method 3: Use Port 5000

```bash
cd backend
uvicorn app.main:app --reload --port 5000
```

---

## DIAGNOSTIC COMMANDS (Run First to Understand the Issue)

### PowerShell - Check Port 8000:
```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

### PowerShell - Check Excluded Ranges (Run as Admin):
```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

### PowerShell - Kill Python Processes (if needed):
```powershell
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
```

### CMD - Check Port 8000:
```cmd
netstat -ano | findstr :8000
```

### CMD - Kill Python Processes:
```cmd
taskkill /F /IM python.exe
```

---

## UPDATE YOUR .ENV FILE (If Changing Port)

If you use port 8001, you may want to document it:

```bash
# backend/.env - Add this line:
PORT=8001
```

Then update your main.py to use it (optional):

```python
# backend/app/main.py
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
```

Then run with:
```bash
cd backend
python -m app.main
```

---

## UPDATE FRONTEND API URL (If You Have Frontend)

If you change from port 8000 to 8001, update your frontend:

```javascript
// frontend/.env.local or config
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## VERIFICATION

After running uvicorn, you should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Test the API:
```bash
# PowerShell or CMD
curl http://localhost:8001/docs
```

Or open in browser:
http://localhost:8001/docs

---

## COMMON CAUSES ON WINDOWS

1. **Hyper-V/Docker Reserved Ports**: Windows reserves port ranges 8000-8099
2. **Previous Uvicorn Still Running**: Didn't stop properly with Ctrl+C
3. **Another Application**: Something else using port 8000
4. **Windows NAT**: Dynamic port reservation

---

## PREVENTION

1. Always stop with Ctrl+C (don't close terminal)
2. Use consistent port across team (document in README)
3. Check for running processes before starting
4. Use environment variables for port configuration

