# Remove Lock File

## PowerShell:
Remove-Item -Path ".next\dev\lock" -Force -ErrorAction SilentlyContinue
Write-Host "Lock file removed (if it existed)" -ForegroundColor Green

## CMD:
del /F /Q ".next\dev\lock" 2>nul
echo Lock file removed (if it existed)

## Git Bash (if using):
rm -f .next/dev/lock
echo "Lock file removed (if it existed)"
