# PowerShell Commands

# Check for Node processes
Get-Process -Name node -ErrorAction SilentlyContinue

# Kill all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Verify they're gone
Get-Process -Name node -ErrorAction SilentlyContinue
