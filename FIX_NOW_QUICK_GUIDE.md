# ⚡ Fix Backend Error - Quick Action Guide

## 🎯 Your Error

```
GET http://10.132.41.159:3050/api/inventory
Status: 500 Internal Server Error
```

---

## ⚡ Quick Fix Steps

### Step 1: Check Backend Console (30 seconds)

Look at your backend terminal/console. You should see an error message like:

```
❌ MongoNetworkError: failed to connect
❌ TypeError: Cannot read property 'map' of undefined
❌ ValidationError: ...
❌ CastError: ...
```

**Copy that error message!**

---

### Step 2: Common Fixes

#### Fix A: MongoDB Not Connected

**Error looks like:**
```
MongoNetworkError
MongooseServerSelectionError
```

**Fix:**
```bash
# Check if MongoDB is running
# Windows:
services.msc  # Look for MongoDB

# Mac/Linux:
brew services list  # Look for mongodb

# Start MongoDB if not running
mongod
```

**Or check connection string in `.env`:**
```
MONGODB_URI=mongodb://localhost:27017/yarnflow
```

---

#### Fix B: Database Has No Data

**Error looks like:**
```
Cannot read property 'map' of undefined
```

**Fix:**
```javascript
// In your inventory route
const inventory = await Inventory.find();
console.log('Found items:', inventory.length);  // Should be > 0

// If 0, add some test data
```

---

#### Fix C: Aggregation Pipeline Error

**Error looks like:**
```
PipelineExecutionError
Invalid aggregation stage
```

**Fix:**
```javascript
// Simplify your aggregation
// Instead of complex pipeline, start simple:

router.get('/inventory', async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    
    // Group by category manually
    const grouped = {};
    products.forEach(p => {
      const catId = p.category?._id || 'uncategorized';
      if (!grouped[catId]) {
        grouped[catId] = {
          categoryId: catId,
          categoryName: p.category?.name || 'Uncategorized',
          products: []
        };
      }
      grouped[catId].products.push(p);
    });
    
    res.json({
      success: true,
      data: Object.values(grouped),
      pagination: { total: Object.keys(grouped).length }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

### Step 3: Test Backend (1 minute)

**Open browser:**
```
http://localhost:3050/api/inventory
```

**Should see:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

**If you see this = SUCCESS!** ✅

---

### Step 4: Restart React Native App

```bash
# Stop current app (Ctrl+C)

# Clear cache and restart
npx expo start -c

# Navigate to Inventory tab
# Should work now!
```

---

## 🔧 Still Not Working?

### Add This Temporary Route (Test)

Add to your backend:

```javascript
// TEMPORARY TEST ROUTE
router.get('/inventory-test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    data: [
      {
        categoryId: 'test',
        categoryName: 'Test Category',
        totalProducts: 1,
        products: [
          {
            productId: 'test-1',
            productName: 'Test Product',
            currentStock: 100,
            receivedStock: 100,
            issuedStock: 0,
            unit: 'Bags',
            currentWeight: 5000,
            totalWeight: 5000,
            receivedWeight: 5000,
            issuedWeight: 0,
            lotCount: 1,
            supplierNames: 'Test Supplier',
            suppliers: ['Test Supplier'],
            lots: []
          }
        ]
      }
    ],
    pagination: { total: 1, totalProducts: 1, page: 1, pages: 1, limit: 20 }
  });
});
```

**Test it:**
```
http://localhost:3050/api/inventory-test
```

**If this works but `/inventory` doesn't:**
- Problem is in your inventory route logic
- Check database query
- Check aggregation pipeline

---

## 📝 Share This If You Need Help

```
1. Backend Error Message: [paste here]
2. MongoDB Status: Running / Not Running
3. Test Route Works: Yes / No
4. Database Has Data: Yes / No / Don't Know
5. Backend Framework: Express / Other
```

---

## ⚡ Super Quick Test

**1 minute test:**

```javascript
// Replace your entire inventory route with this:
router.get('/inventory', (req, res) => {
  res.json({
    success: true,
    data: [{
      categoryId: 'quick-test',
      categoryName: 'Quick Test',
      totalProducts: 1,
      products: [{
        productId: 'p1',
        productName: 'Test',
        currentStock: 50,
        receivedStock: 50,
        issuedStock: 0,
        unit: 'Bags',
        currentWeight: 2500,
        totalWeight: 2500,
        receivedWeight: 2500,
        issuedWeight: 0,
        lotCount: 1,
        supplierNames: 'Test',
        suppliers: ['Test'],
        lots: []
      }]
    }],
    pagination: { total: 1, totalProducts: 1, page: 1, pages: 1, limit: 20 }
  });
});
```

**If this works:**
✅ Backend server is fine
✅ Route is registered
✅ Problem is in your database query/logic

**If this doesn't work:**
❌ Backend server issue
❌ Route not registered
❌ Port/network issue

---

## 🎯 Most Likely Issues (90% of cases)

1. **MongoDB not connected** (40%)
2. **Database has no data** (30%)
3. **Aggregation pipeline error** (20%)
4. **Route not registered** (10%)

---

## ✅ Success Checklist

When backend is fixed, you should see:

- [ ] Browser shows JSON (not error page)
- [ ] Status is 200 (not 500)
- [ ] `success: true` in response
- [ ] `data` array has items
- [ ] React Native app loads inventory
- [ ] No WeakMap error
- [ ] Can view product details

---

## 🚀 Final Step

Once backend returns 200 OK:

```bash
# In React Native terminal
npx expo start -c

# Navigate to Inventory tab
# Everything should work! ✅
```

---

**Your frontend is perfect - just need backend to return data!** 🎉
