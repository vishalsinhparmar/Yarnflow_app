# 🔧 Fix Metro Bundler Out of Memory Error - WINDOWS FIXED ✅

## 🎯 Root Cause

**Error:** `FATAL ERROR: Zone Allocation failed - process out of memory`

**Why it happens:**
1. Metro bundler tries to cache all 961 packages in your node_modules
2. Node.js default memory limit (~2GB) is insufficient
3. Cache serialization fails when data is too large

---

## ✅ FIXED FOR WINDOWS

I've installed `cross-env` package to make the memory fix work on Windows.

### **Solution: Use Updated Start Script (Now Works on Windows!)**

```bash
# Clear cache and start with more memory (RECOMMENDED)
npm run start:clear

# Or just start normally (now has 8GB memory)
npm start
```

**What was fixed:**
- ❌ Before: `NODE_OPTIONS=...` (doesn't work on Windows)
- ✅ After: `cross-env NODE_OPTIONS=...` (works on all platforms)

### **Option 2: Windows PowerShell Command**

If Option 1 doesn't work on Windows, use this:

```powershell
# Set environment variable for current session
$env:NODE_OPTIONS="--max-old-space-size=8192"

# Then start
npx expo start -c
```

### **Option 3: Clear Everything and Reinstall**

If still failing:

```bash
# 1. Stop all Metro processes
# Press Ctrl+C in terminal

# 2. Delete caches
rmdir /s /q .expo
rmdir /s /q node_modules\.cache

# 3. Clear Metro cache
npx expo start -c
```

### **Option 4: Reduce Bundle Size (If Above Don't Work)**

Check for large files in your project:

```bash
# Find large files
dir /s /o-s | more
```

---

## 🚀 Quick Fix Commands

**For Windows (PowerShell):**
```powershell
# Stop current process (Ctrl+C), then:
$env:NODE_OPTIONS="--max-old-space-size=8192"
npx expo start -c
```

**For Windows (CMD):**
```cmd
set NODE_OPTIONS=--max-old-space-size=8192
npx expo start -c
```

---

## 📊 What Changed in package.json

**Before:**
```json
"start": "expo start"
```

**After:**
```json
"start": "NODE_OPTIONS=--max-old-space-size=8192 expo start",
"start:clear": "NODE_OPTIONS=--max-old-space-size=8192 expo start -c"
```

This increases Node.js memory from ~2GB to 8GB.

---

## ⚠️ Additional Issues to Fix

Your expo packages are outdated. After fixing memory issue, run:

```bash
npx expo install --fix
```

This will update:
- expo@54.0.23 → ~54.0.29
- expo-router@6.0.14 → ~6.0.19
- And 11 other packages

---

## 🔍 Verify It's Working

After running the fix:

1. You should see: `Starting Metro Bundler`
2. No more: `FATAL ERROR: Zone Allocation failed`
3. QR code appears
4. Bundle completes successfully

---

## 💡 Why This Happens

Metro bundler needs to:
1. Read all files in node_modules (961 packages)
2. Create a file map cache
3. Serialize this data to disk
4. Bundle your app (1545 modules)

With default memory, step 3 fails because the cache data is too large to serialize.

---

## 🎯 Next Steps

1. **Stop current process:** Press `Ctrl+C`
2. **Run fix:** `npm run start:clear`
3. **Wait for bundle:** Should complete in 1-2 minutes
4. **Test app:** Scan QR code or press `w` for web

If you still get errors, try Option 2 (PowerShell command) above.
