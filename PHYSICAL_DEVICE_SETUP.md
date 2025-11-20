# 📱 Running YarnFlow on Physical Device - Complete Guide

## 🎯 Quick Start (3 Steps)

### Step 1: Install Expo Go on Your Phone

**Android:**
1. Open **Google Play Store**
2. Search for **"Expo Go"**
3. Install the app

**iOS:**
1. Open **App Store**
2. Search for **"Expo Go"**
3. Install the app

---

### Step 2: Start the Development Server

```bash
cd d:\React-native\MyFirstApp
npm start
```

---

### Step 3: Scan QR Code

When you see the Expo prompt:
```
It is recommended to log in with your Expo account...
> Log in
  Proceed anonymously
```

**Select "Proceed anonymously"** (use arrow keys, press Enter)

Then:
- **Android**: Open Expo Go app → Tap "Scan QR Code" → Scan the QR code from terminal
- **iOS**: Open Camera app → Point at QR code → Tap notification

---

## ⚠️ Important: Same WiFi Network

**Your phone and computer MUST be on the same WiFi network!**

Check:
- ✅ Phone WiFi: Settings → WiFi → Check network name
- ✅ Computer WiFi: Check you're on the same network

---

## 🔧 Configure API for Physical Device

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for **"IPv4 Address"** under your WiFi adapter
Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
```
Look for **"inet"** under your WiFi interface
Example: `192.168.1.100`

---

### Step 2: Update `services/common.js`

Open `services/common.js` and find line 19:

```javascript
const PHYSICAL_DEVICE_IP = null; // Set to your IP if using physical device
```

Change it to your IP address:

```javascript
const PHYSICAL_DEVICE_IP = '192.168.1.100'; // Replace with YOUR IP
```

**Example:**
```javascript
// Before
const PHYSICAL_DEVICE_IP = null;

// After (use YOUR IP address)
const PHYSICAL_DEVICE_IP = '192.168.1.105';
```

---

### Step 3: Restart the Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

---

## 📋 Complete Walkthrough

### 1. Start Backend Server
```bash
cd path/to/your/nodejs/backend
npm start
```
✅ Backend should be running on port 3050

---

### 2. Find Your IP Address

**Windows:**
```bash
ipconfig
```

**Output example:**
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.105  ← This is your IP
```

---

### 3. Update API Configuration

Edit `services/common.js` line 19:
```javascript
const PHYSICAL_DEVICE_IP = '192.168.1.105'; // Your IP here
```

---

### 4. Start React Native App
```bash
cd d:\React-native\MyFirstApp
npm start
```

---

### 5. Handle Expo Login Prompt

When you see:
```
It is recommended to log in with your Expo account...
> Log in
  Proceed anonymously
```

**Choose "Proceed anonymously"**
- Use arrow keys to select
- Press Enter

---

### 6. Scan QR Code

**Android:**
1. Open **Expo Go** app
2. Tap **"Scan QR Code"**
3. Point camera at QR code in terminal
4. Wait for app to load

**iOS:**
1. Open **Camera** app (not Expo Go)
2. Point at QR code
3. Tap the notification that appears
4. Expo Go will open automatically

---

## 🐛 Troubleshooting

### Problem: "Unable to connect to server"

**Solution 1: Check WiFi**
- Phone and computer on same WiFi? ✅
- Not using mobile data? ✅

**Solution 2: Check IP Address**
- Correct IP in `services/common.js`? ✅
- Try running `ipconfig` again (IP might have changed)

**Solution 3: Check Firewall**
- Windows Firewall might be blocking
- Allow Node.js through firewall

---

### Problem: "Network request failed" in app

**Solution: Backend not accessible**

1. **Check backend is running:**
   ```bash
   curl http://YOUR_IP:3050/api/dashboard/stats
   ```

2. **Update backend to listen on all interfaces:**
   ```javascript
   // In your backend server.js
   app.listen(3050, '0.0.0.0', () => {
     console.log('Server running on port 3050');
   });
   ```

3. **Check Windows Firewall:**
   - Allow port 3050 through firewall
   - Or temporarily disable firewall for testing

---

### Problem: QR code not scanning

**Solution:**
- Make sure QR code is fully visible in terminal
- Try maximizing terminal window
- Use better lighting
- Clean camera lens

---

### Problem: "Proceed anonymously" not working

**Solution:**
- Just press Enter (it will proceed)
- Or create free Expo account at https://expo.dev/signup
- Login once, then it won't ask again

---

## 🎯 Quick Reference

### Platform-Specific API URLs

| Setup | API URL | Configuration |
|-------|---------|---------------|
| **Physical Device** | `http://YOUR_IP:3050/api` | Set `PHYSICAL_DEVICE_IP` |
| **Android Emulator** | `http://10.0.2.2:3050/api` | Default |
| **iOS Simulator** | `http://localhost:3050/api` | Default |
| **Web Browser** | `http://localhost:3050/api` | Default |

---

## ✅ Checklist Before Running

- [ ] Expo Go installed on phone
- [ ] Phone and computer on same WiFi
- [ ] Backend server running on port 3050
- [ ] Found computer's IP address
- [ ] Updated `PHYSICAL_DEVICE_IP` in `services/common.js`
- [ ] Restarted React Native server
- [ ] Selected "Proceed anonymously"
- [ ] Scanned QR code

---

## 🚀 Expected Result

When everything works:

1. **Terminal shows:**
   ```
   🌐 Platform: android (or ios)
   🌐 API Mode: DEVELOPMENT
   🔗 API URL: http://192.168.1.105:3050/api
   📱 Using Physical Device Mode
   ```

2. **App loads on phone**
3. **Dashboard shows data** (or error if backend not running)
4. **Can navigate between tabs**

---

## 💡 Pro Tips

1. **Save your IP:** Your IP might change, so save it somewhere
2. **Use Expo account:** Login once to avoid the prompt every time
3. **Keep backend running:** Don't close backend terminal
4. **Check logs:** Terminal shows all errors and API calls
5. **Shake phone:** Opens Expo dev menu for debugging

---

## 🔄 Daily Development Workflow

```bash
# 1. Start backend
cd path/to/backend
npm start

# 2. Start React Native (in new terminal)
cd d:\React-native\MyFirstApp
npm start

# 3. Select "Proceed anonymously"
# 4. Scan QR code with Expo Go
# 5. Start developing!
```

---

## 📞 Need Help?

Common issues:
1. **Can't connect:** Check WiFi and IP address
2. **API errors:** Check backend is running
3. **QR not scanning:** Try better lighting
4. **App crashes:** Check terminal for errors

---

## 🎉 Success!

Once you see the YarnFlow Dashboard on your phone, you're all set! 

You can now:
- ✅ Navigate through all tabs
- ✅ See the workflow visualization
- ✅ Test API connections
- ✅ Develop features on real device

**Happy coding!** 🚀
