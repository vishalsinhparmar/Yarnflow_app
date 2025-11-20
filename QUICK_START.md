# YarnFlow Mobile - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd d:\React-native\MyFirstApp
npm install
```

### Step 2: Configure Your Backend API

**Option A: Android Emulator (Default - Already Configured)**
```javascript
// services/common.js - Line 16
const DEVELOPMENT_API = 'http://10.0.2.2:3050/api';
```

**Option B: Physical Android Device**
1. Find your computer's IP address:
   - Windows: Open CMD → `ipconfig` → Look for IPv4 Address
   - Example: `192.168.1.100`

2. Update `services/common.js`:
```javascript
const DEVELOPMENT_API = 'http://YOUR_IP:3050/api';
// Example: 'http://192.168.1.100:3050/api'
```

3. Make sure your phone and computer are on the **same WiFi network**

### Step 3: Start Your Backend Server
```bash
# Navigate to your Node.js backend folder
cd path/to/yarnflow-backend

# Start the server (should run on port 3050)
npm start
```

### Step 4: Run the App
```bash
# Start Expo
npm start

# Press 'a' for Android
# OR
npm run android
```

---

## 📱 What You'll See

### 1. **Dashboard Tab** 🏠
- Supply chain workflow visualization
- Key metrics (POs, Inventory, Sales, Deliveries)
- Quick action buttons
- **Connects to your backend API!**

### 2. **Master Data Tab** 📁
- Customers management
- Suppliers management
- Products catalog
- Categories

### 3. **Purchase Tab** 🛒
- Purchase Orders
- Goods Receipt Notes (GRN)
- Purchase workflow guide

### 4. **Inventory Tab** 📦
- Inventory lots tracking
- Stock levels
- Low stock alerts

### 5. **Sales Tab** 💼
- Sales Orders
- Sales Challan (Delivery tracking)
- Sales workflow guide

---

## 🔌 Testing API Connection

The Dashboard screen will automatically try to connect to your backend when you open the app.

### ✅ **Success:**
- You'll see stats cards with numbers from your database
- No error messages

### ❌ **Error:**
- You'll see: "⚠️ Failed to load dashboard data"
- Check:
  1. Is your backend server running?
  2. Is the API URL correct in `services/common.js`?
  3. Can you access `http://YOUR_API_URL/dashboard/stats` in a browser?

---

## 📝 Using the API Services

All API services are ready to use! Here's how:

### Import Services
```typescript
import { 
  customerAPI, 
  supplierAPI, 
  productAPI,
  purchaseOrderAPI,
  grnAPI,
  inventoryAPI,
  salesOrderAPI,
  salesChallanAPI 
} from '@/services';
```

### Example: Fetch Customers
```typescript
const loadCustomers = async () => {
  try {
    const response = await customerAPI.getAll();
    console.log('Customers:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example: Create Purchase Order
```typescript
const createPO = async () => {
  try {
    const po = await purchaseOrderAPI.create({
      supplier: supplierId,
      items: [
        { product: productId, quantity: 100, unitPrice: 500 }
      ],
      expectedDeliveryDate: '2024-12-31'
    });
    console.log('Created PO:', po);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🎯 Next Steps

### For Beginners:
1. **Explore the app** - Navigate through all tabs
2. **Check the Dashboard** - See if it connects to your backend
3. **Read YARNFLOW_SETUP.md** - Detailed documentation
4. **Start with Master Data** - Build Customers list screen first

### For Experienced Developers:
1. **Build detailed screens** - Use the API services already created
2. **Create reusable components** - Card, Form, Table components
3. **Add authentication** - JWT-based login
4. **Implement full CRUD** - For all modules

---

## 📚 Documentation Files

- **QUICK_START.md** (this file) - Get started quickly
- **YARNFLOW_SETUP.md** - Complete setup guide with API examples
- **IMPLEMENTATION_SUMMARY.md** - What's done and what's next
- **README copy.md** - YarnFlow business logic explained

---

## 🆘 Common Issues

### "Cannot connect to API"
```bash
# Check if backend is running
curl http://localhost:3050/api/dashboard/stats

# For Android emulator, test with:
curl http://10.0.2.2:3050/api/dashboard/stats
```

### "Network request failed"
- Backend not running
- Wrong API URL
- Firewall blocking connection
- Device not on same WiFi (for physical device)

### "Module not found"
```bash
# Clear cache and reinstall
npm install
npx expo start --clear
```

---

## 🎨 Project Structure

```
YarnFlow Mobile/
├── services/          ✅ All API services ready
├── app/(tabs)/        ✅ All screens created
├── components/        ⚠️ Needs more components
└── Documentation/     ✅ Complete guides
```

---

## 💡 Pro Tips

1. **Use the formatters:**
   ```typescript
   import { formatters } from '@/services';
   formatters.currency(50000); // ₹50,000
   ```

2. **Check console logs:**
   - API URL is logged on app start
   - All API errors are logged

3. **Pull to refresh:**
   - Dashboard has pull-to-refresh
   - Add it to other screens too

4. **Error handling:**
   - All API services throw errors
   - Always use try-catch

---

## 🚀 You're Ready!

The foundation is complete. Now build the detailed screens using the API services provided.

**Start with:** Customers List Screen (Master Data)

**Pattern:**
1. Import API service
2. Fetch data in useEffect
3. Display in FlatList
4. Add loading/error states
5. Add create/edit functionality

Good luck building YarnFlow Mobile! 🎉
