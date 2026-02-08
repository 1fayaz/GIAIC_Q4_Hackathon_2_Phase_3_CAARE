# CMD Commands

# Check for Node processes
tasklist | findstr node.exe

# Kill all Node processes
taskkill /F /IM node.exe

# Verify they're gone
tasklist | findstr node.exe
