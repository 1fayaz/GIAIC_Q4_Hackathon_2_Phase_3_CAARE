# PowerShell script to check and kill Node processes
Write-Host "Checking for Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, StartTime -AutoSize
    
    $response = Read-Host "Kill all Node processes? (y/n)"
    if ($response -eq 'y') {
        $nodeProcesses | Stop-Process -Force
        Write-Host "All Node processes terminated." -ForegroundColor Green
    }
} else {
    Write-Host "No Node.js processes running." -ForegroundColor Green
}
