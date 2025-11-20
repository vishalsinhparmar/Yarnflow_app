# 🧪 Test Inventory API - Debug Guide

## 🎯 Quick Test Your Backend

### 1. Test in Browser
Open this URL in your browser:
```
http://10.132.41.159:3050/api/inventory
```

**Expected Result:**
- ✅ Should show JSON data
- ✅ Status 200 OK
- ❌ If you see error page = Backend issue

---

### 2. Test with curl (Command Line)

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://10.132.41.159:3050/api/inventory" -Method GET
```

**Mac/Linux:**
```bash
curl http://10.132.41.159:3050/api/inventory
```

---

### 3. Check Backend Server

**Is your backend running?**
```bash
# In your backend folder
npm start
# or
node server.js
# or
nodemon server.js
```

**Check the console output:**
- Should see: "Server running on port 3050" or similar
- Should NOT see: Connection errors, MongoDB errors, etc.

---

## 🔍 Common Backend Errors

### Error 1: Server Not Running
```
❌ ECONNREFUSED
```
**Fix:** Start your backend server

---

### Error 2: MongoDB Not Connected
```
❌ MongoNetworkError
❌ MongooseServerSelectionError
```
**Fix:** 
- Check MongoDB is running
- Check connection string in `.env`
- Verify database credentials

---

### Error 3: Route Not Found
```
❌ Cannot GET /api/inventory
```
**Fix:**
- Check route is registered in Express
- Verify route path matches

---

### Error 4: Aggregation Pipeline Error
```
❌ PipelineExecutionError
❌ Invalid aggregation stage
```
**Fix:**
- Check your MongoDB aggregation pipeline
- Verify field names exist in database

---

## 🛠️ Backend Quick Fix

### Minimal Working Route

Add this to your backend to test:

```javascript
// In your Express server (e.g., server.js or routes/inventory.js)

router.get('/inventory', async (req, res) => {
  try {
    console.log('📦 Inventory route hit');
    
    // Simple test response
    res.json({
      success: true,
      data: [
        {
          categoryId: 'test-cat-1',
          categoryName: 'Test Category',
          totalProducts: 1,
          products: [
            {
              productId: 'test-prod-1',
              productName: 'Test Product',
              productCode: 'TEST001',
              currentStock: 100,
              receivedStock: 150,
              issuedStock: 50,
              unit: 'Bags',
              currentWeight: 5000,
              totalWeight: 7500,
              receivedWeight: 7500,
              issuedWeight: 2500,
              lotCount: 2,
              supplierNames: 'Test Supplier',
              suppliers: ['Test Supplier'],
              lots: []
            }
          ]
        }
      ],
      pagination: {
        total: 1,
        totalProducts: 1,
        page: 1,
        pages: 1,
        limit: 20
      }
    });
  } catch (error) {
    console.error('❌ Inventory error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## 📊 Expected Response Format

Your backend MUST return this structure:

```json
{
  "success": true,
  "data": [
    {
      "categoryId": "string",
      "categoryName": "string",
      "totalProducts": number,
      "products": [
        {
          "productId": "string",
          "productName": "string",
          "productCode": "string",
          "currentStock": number,
          "receivedStock": number,
          "issuedStock": number,
          "unit": "string",
          "currentWeight": number,
          "totalWeight": number,
          "receivedWeight": number,
          "issuedWeight": number,
          "lotCount": number,
          "supplierNames": "string",
          "suppliers": ["string"],
          "lots": []
        }
      ]
    }
  ],
  "pagination": {
    "total": number,
    "totalProducts": number,
    "page": number,
    "pages": number,
    "limit": number
  }
}
```

---

## 🔧 Debug Your Backend

### Add Logging:

```javascript
router.get('/inventory', async (req, res) => {
  try {
    console.log('1️⃣ Starting inventory fetch...');
    
    // Your database query
    const data = await YourModel.find();
    console.log('2️⃣ Data fetched:', data.length, 'items');
    
    // Your aggregation/processing
    const processed = processData(data);
    console.log('3️⃣ Data processed:', processed.length, 'categories');
    
    // Send response
    res.json({ success: true, data: processed });
    console.log('4️⃣ Response sent successfully');
    
  } catch (error) {
    console.error('❌ Error at step:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 🌐 Network Issues

### Can't Connect to Backend?

**Check Firewall:**
```powershell
# Windows - Allow port 3050
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -LocalPort 3050 -Protocol TCP -Action Allow
```

**Check Both Devices on Same Network:**
```bash
# On your computer
ipconfig  # Windows
ifconfig  # Mac/Linux

# Should show: 10.132.41.159
```

**Test Backend from Computer:**
```
http://localhost:3050/api/inventory
```
Should work if backend is running.

---

## 🎯 Step-by-Step Debugging

### Step 1: Can you access backend from computer?
```
http://localhost:3050/api/inventory
```
- ✅ YES → Backend works, might be network issue
- ❌ NO → Backend has error, check logs

### Step 2: Can you access backend from phone/device?
```
http://10.132.41.159:3050/api/inventory
```
- ✅ YES → Everything works!
- ❌ NO → Network/firewall issue

### Step 3: Check React Native app
- If Steps 1 & 2 work, restart your React Native app
- Clear cache: `npx expo start -c`

---

## 🚀 Quick Test Script

Create `test-api.js` in your project:

```javascript
// test-api.js
const API_URL = 'http://10.132.41.159:3050/api/inventory';

async function testAPI() {
  console.log('Testing API:', API_URL);
  
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Categories:', data.data?.length);
    console.log('✅ Full response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
```

Run it:
```bash
node test-api.js
```

---

## 📝 Checklist

Before asking for help, verify:

- [ ] Backend server is running
- [ ] Can access `http://localhost:3050/api/inventory` in browser
- [ ] Returns 200 status (not 500, 404, etc.)
- [ ] Returns valid JSON
- [ ] MongoDB/Database is connected
- [ ] Has data in database
- [ ] Firewall allows port 3050
- [ ] Both devices on same network
- [ ] IP address is correct (10.132.41.159)
- [ ] CORS is enabled in backend

---

## 💡 Still Not Working?

### Share These Details:

1. **Backend console output** (copy the error)
2. **Browser test result** (screenshot or error message)
3. **curl/PowerShell test result**
4. **Backend route code** (the inventory route)
5. **Database connection status**

---

**Next:** Once backend returns 200 OK with proper data, your React Native app will work perfectly! The frontend is already fixed. ✅
