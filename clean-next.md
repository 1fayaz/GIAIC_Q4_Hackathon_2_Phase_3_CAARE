# Clean .next Directory

## PowerShell:
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ".next directory cleaned" -ForegroundColor Green

## CMD:
rmdir /S /Q ".next" 2>nul
echo .next directory cleaned

## Git Bash:
rm -rf .next
echo ".next directory cleaned"
