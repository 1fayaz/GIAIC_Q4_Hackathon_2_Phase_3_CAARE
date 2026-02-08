# FastAPI Port Diagnostic Script for Windows
Write-Host "=== FastAPI/Uvicorn Port Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check for running Python/Uvicorn processes
Write-Host "1. Checking for running Python processes..." -ForegroundColor Yellow
$pythonProcs = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "Found Python processes:" -ForegroundColor Red
    $pythonProcs | Format-Table Id, ProcessName, StartTime -AutoSize
} else {
    Write-Host "No Python processes running." -ForegroundColor Green
}
Write-Host ""

# Check port 8000
Write-Host "2. Checking if port 8000 is in use..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "Port 8000 is IN USE by PID: $($port8000.OwningProcess)" -ForegroundColor Red
    $proc = Get-Process -Id $port8000.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Process: $($proc.ProcessName)" -ForegroundColor Red
    }
} else {
    Write-Host "Port 8000 is FREE." -ForegroundColor Green
}
Write-Host ""

# Check Windows excluded port ranges
Write-Host "3. Checking Windows excluded port ranges..." -ForegroundColor Yellow
Write-Host "(This requires Administrator privileges)" -ForegroundColor Gray
try {
    $excluded = netsh interface ipv4 show excludedportrange protocol=tcp
    if ($excluded -match "8000") {
        Write-Host "WARNING: Port 8000 is in Windows excluded range!" -ForegroundColor Red
        Write-Host "This is common with Hyper-V/Docker installed." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check excluded ranges (run as Administrator)" -ForegroundColor Gray
}
Write-Host ""

# Find available alternative ports
Write-Host "4. Finding available alternative ports..." -ForegroundColor Yellow
$testPorts = @(8001, 8080, 5000, 3001, 9000)
foreach ($port in $testPorts) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if (-not $conn) {
        Write-Host "Port $port is AVAILABLE" -ForegroundColor Green
    } else {
        Write-Host "Port $port is in use" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== Recommended Actions ===" -ForegroundColor Cyan
Write-Host "1. Use an available port from above (e.g., 8001)" -ForegroundColor White
Write-Host "2. Run: cd backend" -ForegroundColor White
Write-Host "3. Run: uvicorn app.main:app --reload --port 8001" -ForegroundColor Green
Write-Host ""
