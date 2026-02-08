# Kill Process Using Port 8000

## PowerShell:
```powershell
# Find the process
$conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($conn) {
    $pid = $conn.OwningProcess
    Write-Host "Killing process $pid"
    Stop-Process -Id $pid -Force
}
```

## CMD:
```cmd
REM Find the PID
netstat -ano | findstr :8000
REM Note the PID (last column), then:
taskkill /F /PID <PID>
```

## After killing, run:
```bash
cd backend
uvicorn app.main:app --reload
```
