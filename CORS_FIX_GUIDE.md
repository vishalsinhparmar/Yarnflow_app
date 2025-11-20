# CORS Error Fix Guide

## 🚨 Understanding the Error

**Error:** `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`

**What it means:** 
- You're running the app on **web browser** (`npm run web`)
- Browsers block requests from `http://localhost:8082` to `http://10.0.2.2:3050`
- This is a **browser security feature** called CORS

**Important:** This error **ONLY happens on web**. React Native mobile apps don't have CORS restrictions!

---

## ✅ Solution 1: Run on Android (Recommended)

React Native is meant for mobile apps, not web. Run on Android:

```bash
# Stop the web server (Ctrl+C)

# Run on Android
npm run android

# Or start Expo and press 'a'
npm start
# Then press 'a' for Android
```

**No CORS issues on mobile!** ✅

---

## ✅ Solution 2: Enable CORS in Backend (For Web Testing)

If you want to test on web, add CORS middleware to your Node.js backend:

### Step 1: Install CORS package in your backend

```bash
# In your Node.js backend folder
cd path/to/your/backend
npm install cors
```

### Step 2: Add CORS middleware to your Express server

```javascript
// In your backend server.js or app.js
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Or enable CORS for specific origin
app.use(cors({
  origin: ['http://localhost:8082', 'http://localhost:8081', 'http://localhost:19006'],
  credentials: true
}));

// Your other middleware and routes...
app.use(express.json());
app.use('/api', yourRoutes);

app.listen(3050, () => {
  console.log('Server running on port 3050');
});
```

### Step 3: Restart your backend server

```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

---

## ✅ Solution 3: Update API URL for Web

Update `services/common.js` to use `localhost` when running on web:

```javascript
// services/common.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const EXPO_API_URL = Constants.expoConfig?.extra?.apiUrl;
const isDevelopment = __DEV__;

// Different URLs for different platforms
let DEVELOPMENT_API;

if (Platform.OS === 'web') {
  // For web, use localhost
  DEVELOPMENT_API = 'http://localhost:3050/api';
} else if (Platform.OS === 'android') {
  // For Android emulator, use 10.0.2.2
  DEVELOPMENT_API = 'http://10.0.2.2:3050/api';
} else if (Platform.OS === 'ios') {
  // For iOS simulator, use localhost
  DEVELOPMENT_API = 'http://localhost:3050/api';
}

const PRODUCTION_API = 'https://yarnflow-production.up.railway.app/api';

export const API_BASE_URL = EXPO_API_URL || (isDevelopment ? DEVELOPMENT_API : PRODUCTION_API);

console.log(`🌐 Platform: ${Platform.OS}`);
console.log(`🌐 API Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🔗 API URL: ${API_BASE_URL}`);
```

---

## 📱 Platform-Specific API URLs

| Platform | API URL | Notes |
|----------|---------|-------|
| **Android Emulator** | `http://10.0.2.2:3050/api` | Special IP for emulator |
| **iOS Simulator** | `http://localhost:3050/api` | Can use localhost |
| **Physical Device** | `http://192.168.1.XXX:3050/api` | Use your computer's IP |
| **Web Browser** | `http://localhost:3050/api` | Needs CORS enabled |

---

## 🎯 Recommended Approach

### For Development:
1. **Use Android/iOS** for testing (no CORS issues)
2. **Enable CORS in backend** if you need web testing
3. **Use platform-specific URLs** in `common.js`

### For Production:
1. Deploy backend with CORS enabled
2. Use production URL: `https://yarnflow-production.up.railway.app/api`
3. Build native apps (Android APK, iOS IPA)

---

## 🐛 Troubleshooting

### Still seeing CORS error?

1. **Check if backend has CORS enabled:**
   ```bash
   # Test with curl
   curl -H "Origin: http://localhost:8082" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        http://localhost:3050/api/dashboard/stats
   ```

2. **Check backend logs** - Should show CORS headers

3. **Clear browser cache** - Old CORS policies might be cached

4. **Use Android instead** - Avoid CORS entirely!

---

## 💡 Why CORS Doesn't Affect Mobile Apps

- **Web browsers** enforce CORS for security
- **React Native apps** make direct HTTP requests (like Postman)
- **No browser** = No CORS restrictions
- **Mobile is the primary target** for React Native

---

## Summary

✅ **Best Solution:** Run on Android (`npm run android`)
✅ **For Web Testing:** Enable CORS in backend
✅ **Platform Detection:** Use different URLs per platform

**React Native apps are meant for mobile, not web!** 🚀
