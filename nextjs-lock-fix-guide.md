# Next.js Lock File Fix - Complete Guide (Windows)

## Quick Fix (PowerShell - Run as Administrator if needed)

```powershell
# 1. Kill all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Remove lock file
Remove-Item -Path ".next\dev\lock" -Force -ErrorAction SilentlyContinue

# 3. (Optional) Clean entire .next directory
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Restart dev server
npm run dev
```

## Quick Fix (CMD - Run as Administrator if needed)

```cmd
REM 1. Kill all Node processes
taskkill /F /IM node.exe

REM 2. Remove lock file
del /F /Q ".next\dev\lock" 2>nul

REM 3. (Optional) Clean entire .next directory
rmdir /S /Q ".next" 2>nul

REM 4. Restart dev server
npm run dev
```

## Prevention Tips

1. **Always use Ctrl+C to stop the dev server** (don't close terminal directly)
2. **Use only one terminal** for the dev server
3. **Check for running processes** before starting: `tasklist | findstr node.exe`
4. **Add to .gitignore** (should already be there):
   ```
   .next/
   ```

## Troubleshooting

### Issue persists after following steps?

1. **Check port 3000 is free:**
   ```powershell
   # PowerShell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
   
   # CMD
   netstat -ano | findstr :3000
   ```

2. **Kill process using port 3000:**
   ```powershell
   # PowerShell (replace PID with actual process ID)
   Stop-Process -Id <PID> -Force
   
   # CMD
   taskkill /F /PID <PID>
   ```

3. **Restart your terminal** (close and reopen)

4. **Restart your computer** (last resort)

## Why This Happens

- Dev server crashed without cleanup
- Force-killed process (Task Manager, system shutdown)
- Multiple terminals tried to start dev server
- Windows file locking issues

## Safe to Delete?

✅ YES - Safe to delete:
- `.next/dev/lock` (lock file)
- `.next/` directory (build cache - will rebuild)

❌ NO - Don't delete:
- `node_modules/` (unless reinstalling)
- `package.json` or `package-lock.json`
- Source code files

