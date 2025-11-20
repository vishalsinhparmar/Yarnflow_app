# 🔍 Testing Your Connection

## ✅ Your IP Address is Correct
- **IP:** `10.132.41.159`
- **This is your WiFi/Hotspot IP** ✅

---

## 🧪 Test 1: Check if Backend is Accessible

Open Command Prompt and run:

```bash
curl http://10.132.41.159:3050/api/dashboard/stats
```

**Expected Result:**
- Should return JSON data
- Or error message from your backend

**If it fails:**
- Backend is not accessible from this IP
- Need to configure backend to listen on `0.0.0.0`

---

## 🧪 Test 2: Check if Backend is Running

```bash
curl http://localhost:3050/api/dashboard/stats
```

**Expected Result:**
- Should return JSON data

**If this works but Test 1 fails:**
- Backend is only listening on localhost
- Need to change backend configuration

---

## 🔧 Fix Backend Configuration

### **Your Backend Server File** (server.js or app.js)

**Find this line:**
```javascript
app.listen(3050, () => {
  console.log('Server running on port 3050');
});
```

**Change to:**
```javascript
app.listen(3050, '0.0.0.0', () => {
  console.log('✅ Server running on port 3050');
  console.log('✅ Accessible on all network interfaces');
  console.log('✅ Local: http://localhost:3050');
  console.log('✅ Network: http://10.132.41.159:3050');
});
```

**The `'0.0.0.0'` is crucial!** It makes your server accessible from:
- localhost (your laptop)
- Your network IP (your phone via hotspot)

---

## 🧪 Test 3: Test from Your Phone's Browser

1. Open **Chrome** or **Safari** on your phone
2. Go to: `http://10.132.41.159:3050/api/dashboard/stats`

**Expected Result:**
- Should show JSON data
- Or error message from backend

**If it fails:**
- Backend not accessible from phone
- Check firewall settings
- Check backend is listening on `0.0.0.0`

---

## 🛠️ Complete Fix Steps

### **Step 1: Update Backend**

**File:** Your backend `server.js` or `app.js`

```javascript
const express = require('express');
const app = express();

// Your middleware and routes...

// IMPORTANT: Listen on 0.0.0.0
app.listen(3050, '0.0.0.0', () => {
  console.log('✅ Server running on port 3050');
  console.log('✅ Accessible from: http://10.132.41.159:3050');
});
```

### **Step 2: Restart Backend**

```bash
# Stop backend (Ctrl+C)
# Start again
npm start
```

### **Step 3: Verify Backend is Accessible**

```bash
curl http://10.132.41.159:3050/api/dashboard/stats
```

### **Step 4: Restart React Native**

```bash
# Stop React Native (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

### **Step 5: Select "Proceed anonymously"**

When you see the Expo prompt:
1. Press **DOWN arrow** (↓)
2. Press **ENTER**

### **Step 6: Scan QR Code**

Open Expo Go and scan the QR code

---

## 🎯 What You Should See

### **In Terminal (React Native):**
```
🌐 Platform: android
🌐 API Mode: DEVELOPMENT
🔗 API URL: http://10.132.41.159:3050/api
📱 Physical Device IP: 10.132.41.159
```

### **In Terminal (Backend):**
```
✅ Server running on port 3050
✅ Accessible on all network interfaces
✅ Network: http://10.132.41.159:3050
```

### **On Your Phone:**
- YarnFlow Dashboard loads
- Shows data from backend
- No "Network request failed" error

---

## 🐛 If Still Getting "Network request failed"

### **Check 1: Is Backend Running?**
```bash
# Should show backend process
netstat -ano | findstr :3050
```

### **Check 2: Windows Firewall**

**Option 1: Allow Node.js**
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find Node.js
4. Check both Private and Public networks
5. Click OK

**Option 2: Allow Port 3050**
1. Windows Defender Firewall
2. Advanced settings
3. Inbound Rules → New Rule
4. Port → TCP → 3050
5. Allow the connection
6. Apply to all profiles

**Option 3: Temporarily Disable (Testing Only)**
1. Windows Security → Firewall & network protection
2. Turn off temporarily
3. Test app
4. Turn back on

### **Check 3: Backend Listening on Correct Interface**

In your backend terminal, you should see:
```
✅ Server running on port 3050
✅ Accessible on all network interfaces
```

If you only see "Server running on port 3050", backend is not configured correctly.

---

## 📋 Quick Checklist

- [ ] Backend has `'0.0.0.0'` in `app.listen()`
- [ ] Backend is running
- [ ] Can access `http://localhost:3050/api/dashboard/stats` from laptop
- [ ] Can access `http://10.132.41.159:3050/api/dashboard/stats` from laptop
- [ ] Windows Firewall allows Node.js or port 3050
- [ ] `PHYSICAL_DEVICE_IP = "10.132.41.159"` in `services/common.js`
- [ ] React Native server restarted with `--clear`
- [ ] Selected "Proceed anonymously"
- [ ] Scanned QR code

---

## 🎉 Success Indicators

✅ **Backend Terminal:**
```
✅ Server running on port 3050
✅ Accessible on all network interfaces
GET /api/dashboard/stats 200 45ms
```

✅ **React Native Terminal:**
```
🌐 Platform: android
🌐 API Mode: DEVELOPMENT
🔗 API URL: http://10.132.41.159:3050/api
📱 Physical Device IP: 10.132.41.159
```

✅ **Phone Screen:**
- Dashboard loads
- Shows statistics
- Can navigate tabs

---

## 💡 Pro Tip

**Test backend accessibility BEFORE running React Native:**

```bash
# From Command Prompt
curl http://10.132.41.159:3050/api/dashboard/stats

# Should return JSON data
# If it fails, fix backend first!
```

This saves time debugging React Native when the issue is actually the backend.
