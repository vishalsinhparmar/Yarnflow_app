# 🚀 QUICK FIX - Mobile App Not Connecting

## ✅ What I Fixed

1. **Port Configuration**: Changed from `3020` → `3050` in `services/common.js`
2. **IP Address**: Verified `192.168.205.1` is correct
3. **Backend Status**: Confirmed backend is running and accessible

## ⚠️ ONE STEP REMAINING - ADD FIREWALL RULE

### Option 1: Run the Batch File (Easiest)

1. **Right-click** `ADD_FIREWALL_RULE.bat`
2. Select **"Run as administrator"**
3. Click **Yes** when prompted
4. Done! ✅

### Option 2: Manual Command

**Open PowerShell or Command Prompt as Administrator:**

```powershell
netsh advfirewall firewall add rule name="Node.js Port 3050" dir=in action=allow protocol=TCP localport=3050
```

---

## 🧪 TEST BEFORE USING MOBILE APP

### Step 1: Test from Phone Browser

Open your phone's browser (Chrome/Safari) and go to:

```
http://192.168.205.1:3050/api/dashboard/stats
```

**Expected**: You should see JSON data (not an error)

### Step 2: If Phone Browser Works, Restart Expo

```bash
# Stop current Expo server (Ctrl+C)
npx expo start --clear
```

### Step 3: Scan QR Code

Use Expo Go app to scan the QR code and your app should work!

---

## 🎯 TROUBLESHOOTING

### If phone browser shows "Can't connect" or timeout:

1. **Check firewall rule was added:**
   ```bash
   netsh advfirewall firewall show rule name="Node.js Port 3050"
   ```

2. **Ensure phone and computer on SAME WiFi network**

3. **Verify backend is running:**
   ```bash
   netstat -ano | findstr :3050
   ```

### If app still shows "Network request failed":

1. **Restart Expo with cache clear:**
   ```bash
   npx expo start --clear
   ```

2. **Force close Expo Go app** on your phone and reopen

3. **Scan QR code again**

---

## 📱 Your Configuration

- **Backend IP**: `192.168.205.1`
- **Backend Port**: `3050`
- **API URL**: `http://192.168.205.1:3050/api`
- **Test Endpoint**: `http://192.168.205.1:3050/api/dashboard/stats`

---

## ✅ CHECKLIST

- [x] Port fixed to 3050 in `services/common.js`
- [x] IP address is correct (192.168.205.1)
- [x] Backend is running
- [x] Backend accessible from computer browser
- [ ] **Firewall rule added** ← DO THIS NOW
- [ ] Backend accessible from phone browser
- [ ] Expo restarted with `--clear`
- [ ] App working on mobile

---

## 🆘 NEED HELP?

Run the diagnostic tool:
```bash
node test-mobile-connection.js
```

This will show you exactly what's working and what needs to be fixed.

---

**Once you add the firewall rule and test from your phone's browser, your app will work!** 🎉
