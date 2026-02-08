# FastAPI Module Import Error - Complete Fix

## Problem Diagnosis

**Error:** "Error loading ASGI app. Could not import module 'main'"

**Your Project Structure:**
```
backend/
├── app/
│   ├── __init__.py          ✅ Exists
│   ├── main.py              ✅ Your FastAPI app is here
│   ├── routes/
│   ├── models/
│   ├── core/
│   └── ...
├── .env
└── requirements.txt
```

**What You Ran (WRONG):**
```bash
cd backend
uvicorn main:app --reload --port 8001
```

**Why It Failed:**
- Uvicorn looked for `backend/main.py` (doesn't exist)
- Your actual file is at `backend/app/main.py`
- Python module path should be `app.main`, not `main`

---

## ✅ CORRECT SOLUTION

### Option 1: Use Module Path (Recommended)

```bash
cd backend
uvicorn app.main:app --reload --port 8001 --host 0.0.0.0
```

**Explanation:**
- `app.main` = Import the `main` module from the `app` package
- `:app` = Get the `app` object from that module
- This works because `app/__init__.py` exists

---

### Option 2: Use Python Module Syntax

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8001 --host 0.0.0.0
```

**Benefits:**
- More explicit about using Python's module system
- Ensures correct PYTHONPATH handling
- Recommended for production deployments

---

## 🔍 Understanding the Import Path

**Uvicorn Import Syntax:** `module.path:variable`

| Command | What Uvicorn Looks For | Result |
|---------|------------------------|--------|
| `uvicorn main:app` | `backend/main.py` → `app` variable | ❌ File doesn't exist |
| `uvicorn app.main:app` | `backend/app/main.py` → `app` variable | ✅ Correct! |
| `uvicorn app:app` | `backend/app/__init__.py` → `app` variable | ❌ No app in __init__.py |

---

## ✅ VERIFICATION

After running the correct command, you should see:

```
INFO:     Will watch for changes in these directories: ['D:\giaic\quater 4 hackathon\Phase3_H2_Q4_GIAIC\backend']
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test the API:**
- Swagger Docs: http://localhost:8001/docs
- Health Check: http://localhost:8001/health
- Root: http://localhost:8001/

---

## 📝 Common Variations

### If main.py was in backend/ root:
```bash
uvicorn main:app --reload --port 8001
```

### If main.py was in backend/src/main.py:
```bash
uvicorn src.main:app --reload --port 8001
```

### If app variable was named differently (e.g., application):
```bash
uvicorn app.main:application --reload --port 8001
```

---

## 🛠️ Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'app'"

**Solution:** Make sure you're in the `backend/` directory:
```bash
pwd  # Should show: .../Phase3_H2_Q4_GIAIC/backend
cd backend  # If not in backend directory
```

### Issue: "AttributeError: module 'app.main' has no attribute 'app'"

**Solution:** Check that your main.py has the FastAPI instance:
```python
# backend/app/main.py should have:
app = FastAPI(...)  # ✅ This line exists at line 72
```

### Issue: Still getting import errors

**Check PYTHONPATH:**
```bash
# From backend/ directory
python -c "import app.main; print('Import successful!')"
```

If this fails, there's a Python environment issue.

---

## 🎯 FINAL WORKING COMMAND

```bash
# Navigate to backend directory
cd "D:\giaic\quater 4 hackathon\Phase3_H2_Q4_GIAIC\backend"

# Run with correct module path
uvicorn app.main:app --reload --port 8001 --host 0.0.0.0
```

**Or as one-liner:**
```bash
cd backend && uvicorn app.main:app --reload --port 8001 --host 0.0.0.0
```

---

## 📚 Key Takeaways

1. **Module path follows directory structure:** `app/main.py` → `app.main`
2. **Colon separates module from variable:** `app.main:app`
3. **Always run from the directory containing your package** (backend/)
4. **Package needs `__init__.py`** (you have this ✅)

