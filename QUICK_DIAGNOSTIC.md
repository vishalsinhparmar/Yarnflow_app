# 🚨 QUICK DIAGNOSTIC - Connection Issues

## 🔍 **Since it was working this morning, something changed. Let's find what:**

### **Step 1: Check Your Current IP Address**
```bash
# Run this in Command Prompt:
ipconfig

# Look for your current IP address
# Compare with: 10.132.41.159
```

**Most Common Issue:** Your IP address changed since this morning!

---

### **Step 2: Test Backend Server**
```bash
# Test if backend is running:
curl http://localhost:3050/api/health

# Test if backend is accessible on network:
curl http://10.132.41.159:3050/api/health
```

---

### **Step 3: Quick Fixes Based on Common Issues**

#### **🔧 Fix 1: IP Address Changed (90% of cases)**
If your IP is different from `10.132.41.159`:

1. **Update services/common.js:**
```javascript
const PHYSICAL_DEVICE_IP = "YOUR_NEW_IP_HERE"; // Replace with current IP
```

2. **Restart React Native:**
```bash
npx expo start --clear
```

#### **🔧 Fix 2: Backend Server Issues**
```bash
# If backend tests fail, restart your backend:
cd your-backend-folder
npm start

# Should show:
🚀 Server is running on 0.0.0.0:3050
🌐 Network: http://10.132.41.159:3050
```

#### **🔧 Fix 3: Network/WiFi Changed**
- **Check if both devices are on same WiFi network**
- **If using hotspot, make sure it's still active**

#### **🔧 Fix 4: Windows Firewall**
```bash
# Run as Administrator:
netsh advfirewall firewall add rule name="Node.js Port 3050" dir=in action=allow protocol=TCP localport=3050
```

---

### **Step 4: Enhanced Debug Information**

I've added enhanced debugging to your `common.js`. After restarting your React Native app, check the console for:

```bash
🔍 ============ API CONFIGURATION DEBUG ============
🌐 Platform: android
🌐 API Mode: DEVELOPMENT
🔗 API URL: http://10.132.41.159:3050/api
🔧 Backend Port: 3050
📱 Physical Device IP: 10.132.41.159
🔗 Full API URL: http://10.132.41.159:3050/api
✅ URL is valid: http://10.132.41.159:3050/api
🔍 ================================================
```

---

### **Step 5: Test Connection Manually**

#### **From Your Computer:**
```bash
# Test these URLs in browser:
http://localhost:3050/
http://10.132.41.159:3050/
http://10.132.41.159:3050/api/health
```

#### **From Your Phone Browser:**
```bash
# Open phone browser, test:
http://10.132.41.159:3050/api/health
```

---

## 🎯 **Most Likely Solutions (in order of probability):**

### **1. IP Address Changed (90%)**
```bash
# Check current IP:
ipconfig | findstr "IPv4"

# Update services/common.js with new IP
# Restart React Native with --clear
```

### **2. Backend Server Stopped (80%)**
```bash
# Restart backend:
cd your-backend-folder
npm start
```

### **3. WiFi Network Changed (70%)**
```bash
# Make sure both devices on same network
# Check WiFi settings on both devices
```

### **4. Windows Firewall Reset (60%)**
```bash
# Re-allow Node.js through firewall
# Or temporarily disable firewall to test
```

---

## 🚀 **Quick Test Script**

Create this file to test everything quickly:

```javascript
// test-connection.js
const testConnection = async () => {
  const urls = [
    'http://localhost:3050/',
    'http://10.132.41.159:3050/',
    'http://10.132.41.159:3050/api/health'
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      console.log(`✅ ${url} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
};

testConnection();
```

---

## 🔧 **Automated IP Update Script**

```javascript
// auto-update-ip.js
const { execSync } = require('child_process');
const fs = require('fs');

// Get current IP
const ipOutput = execSync('ipconfig', { encoding: 'utf8' });
const ipMatch = ipOutput.match(/IPv4 Address[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/);

if (ipMatch) {
  const currentIP = ipMatch[1];
  console.log(`Current IP: ${currentIP}`);
  
  // Update common.js
  const commonPath = './services/common.js';
  let content = fs.readFileSync(commonPath, 'utf8');
  content = content.replace(
    /const PHYSICAL_DEVICE_IP = "[^"]*"/,
    `const PHYSICAL_DEVICE_IP = "${currentIP}"`
  );
  fs.writeFileSync(commonPath, content);
  
  console.log(`✅ Updated PHYSICAL_DEVICE_IP to ${currentIP}`);
  console.log('🔄 Please restart React Native with: npx expo start --clear');
} else {
  console.log('❌ Could not detect IP address');
}
```

---

## 📋 **Troubleshooting Checklist**

### **Quick Checks:**
- [ ] IP address is still `10.132.41.159` (run `ipconfig`)
- [ ] Backend server is running (check terminal)
- [ ] Can access `http://localhost:3050/` in browser
- [ ] Can access `http://10.132.41.159:3050/` in browser
- [ ] Both devices on same WiFi network
- [ ] Windows Firewall allows Node.js

### **If All Above Pass:**
- [ ] React Native restarted with `--clear`
- [ ] Console shows correct API URL
- [ ] No CORS errors in browser dev tools
- [ ] Backend shows incoming requests in logs

---

## 🎉 **Expected Fix Time: 2-5 minutes**

**Most likely:** Your IP address changed since this morning. Update the IP in `services/common.js` and restart React Native.

**Run the diagnostic steps above and let me know what you find!** 🚀
