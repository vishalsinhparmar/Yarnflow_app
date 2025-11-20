# 🎨 Use Mock Data Temporarily (While Fixing Backend)

## 🎯 Purpose
Test your UI while you fix the backend 500 error.

---

## 📝 How to Add Mock Data

### Option 1: Quick Mock (Recommended)

Replace the `loadInventory` function in `app/(tabs)/inventory.tsx`:

```typescript
const loadInventory = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // 🎨 TEMPORARY MOCK DATA - Remove when backend is fixed
    const mockResponse = {
      success: true,
      data: [
        {
          categoryId: 'cat-cotton',
          categoryName: 'Cotton Yarn',
          totalProducts: 2,
          products: [
            {
              productId: 'prod-cotton-1',
              productName: 'Cotton 3.0',
              productCode: 'PROD001',
              currentStock: 70,
              receivedStock: 210,
              issuedStock: 140,
              unit: 'Bags',
              currentWeight: 3500.50,
              totalWeight: 10500.00,
              receivedWeight: 10500.00,
              issuedWeight: 7000.00,
              lotCount: 4,
              grnCount: 4,
              supplierNames: 'White Cotton, yarnflow',
              suppliers: ['White Cotton', 'yarnflow'],
              lots: [
                {
                  lotNumber: 'LOT2025110029',
                  grnNumber: 'GRN2025110026',
                  status: 'Active',
                  supplierName: 'White Cotton',
                  warehouse: 'Surat-Daskroi',
                  receivedQuantity: 10,
                  currentQuantity: 10,
                  issuedQuantity: 0,
                  receivedDate: '2025-11-05',
                  movements: [
                    {
                      type: 'Received',
                      quantity: 10,
                      reference: 'GRN2025110026',
                      notes: 'Received via GRN PKRK/PO/25-26/031',
                      date: '2025-11-05'
                    }
                  ]
                }
              ],
              grns: []
            },
            {
              productId: 'prod-cotton-2',
              productName: 'Cotton Yarn 20s',
              productCode: 'PROD002',
              currentStock: 150,
              receivedStock: 200,
              issuedStock: 50,
              unit: 'Bags',
              currentWeight: 7500.00,
              totalWeight: 10000.00,
              receivedWeight: 10000.00,
              issuedWeight: 2500.00,
              lotCount: 3,
              grnCount: 3,
              supplierNames: 'yarnflow',
              suppliers: ['yarnflow'],
              lots: [],
              grns: []
            }
          ]
        },
        {
          categoryId: 'cat-polyester',
          categoryName: 'Polyester',
          totalProducts: 1,
          products: [
            {
              productId: 'prod-poly-1',
              productName: 'Polyester Yarn 30s',
              productCode: 'PROD003',
              currentStock: 80,
              receivedStock: 100,
              issuedStock: 20,
              unit: 'Bags',
              currentWeight: 4000.00,
              totalWeight: 5000.00,
              receivedWeight: 5000.00,
              issuedWeight: 1000.00,
              lotCount: 2,
              grnCount: 2,
              supplierNames: 'Poly Suppliers',
              suppliers: ['Poly Suppliers'],
              lots: [],
              grns: []
            }
          ]
        }
      ],
      pagination: {
        total: 2,
        totalProducts: 3,
        page: 1,
        pages: 1,
        limit: 20
      }
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use mock data instead of API call
    const response = mockResponse;
    
    // Rest of your existing code (data sanitization)
    if (response && response.success && Array.isArray(response.data)) {
      const cleanData = response.data.map((category: any) => ({
        categoryId: category.categoryId || 'uncategorized',
        categoryName: category.categoryName || 'Uncategorized',
        totalProducts: category.totalProducts || category.products?.length || 0,
        products: Array.isArray(category.products) ? category.products.map((product: any) => ({
          productId: product.productId || product._id,
          productName: product.productName || '',
          productCode: product.productCode || '',
          currentStock: Number(product.currentStock) || 0,
          receivedStock: Number(product.receivedStock) || 0,
          issuedStock: Number(product.issuedStock) || 0,
          unit: product.unit || 'Bags',
          currentWeight: Number(product.currentWeight) || 0,
          totalWeight: Number(product.totalWeight) || 0,
          receivedWeight: Number(product.receivedWeight) || 0,
          issuedWeight: Number(product.issuedWeight) || 0,
          lotCount: Number(product.lotCount) || 0,
          grnCount: Number(product.grnCount) || 0,
          supplierNames: product.supplierNames || '',
          suppliers: Array.isArray(product.suppliers) ? [...product.suppliers] : [],
          lots: Array.isArray(product.lots) ? [...product.lots] : [],
          grns: Array.isArray(product.grns) ? [...product.grns] : [],
        })) : []
      }));
      
      setInventory({
        success: true,
        data: cleanData,
        pagination: response.pagination || null
      });
      
      const expanded: Record<string, boolean> = {};
      cleanData.forEach((cat: any) => {
        expanded[cat.categoryId] = true;
      });
      setExpandedCategories(expanded);
    } else {
      setInventory({ success: true, data: [], pagination: null });
    }
  } catch (err: any) {
    setError(err.message || 'Failed to load inventory');
    console.error('Inventory error:', err);
    setInventory(null);
  } finally {
    setLoading(false);
  }
};
```

---

## 🔄 How to Switch Back to Real API

When your backend is fixed, just replace the mock data section with the real API call:

```typescript
const loadInventory = async () => {
  try {
    setLoading(true);
    setError(null);
    const params: any = {
      page: 1,
      limit: 20,
      sortBy: 'latestReceiptDate',
      sortOrder: 'desc'
    };
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }
    
    // ✅ Real API call
    const response = await inventoryAPI.getAll(params);
    
    // Rest of your existing code...
```

---

## 🎨 What You'll See with Mock Data

### Main Screen:
- ✅ 2 Statistics cards (orange): 3 Products, 2 Categories
- ✅ 2 Statistics cards (green): 300 Total Stock, 17.0 Tons
- ✅ Search bar (functional)
- ✅ 2 Categories: Cotton Yarn (2 products), Polyester (1 product)
- ✅ Each product card with all details

### Product Detail Screen:
- ✅ Product header
- ✅ 4 Summary cards
- ✅ Supplier badges
- ✅ Lot cards with movement history (for Cotton 3.0)

---

## 🧪 Test All Features

With mock data, you can test:

1. **View Inventory List** ✅
2. **See Statistics** ✅
3. **Expand/Collapse Categories** ✅
4. **Search Products** ✅ (will filter mock data)
5. **View Product Details** ✅
6. **See Lot Information** ✅
7. **View Movement History** ✅
8. **Navigate Back** ✅
9. **Pull to Refresh** ✅

---

## 📝 Important Notes

### ⚠️ Remember:
- This is **TEMPORARY** for UI testing only
- **Remove mock data** when backend is fixed
- Mock data **won't update** (it's static)
- Search will **filter mock data** (not real search)

### ✅ Benefits:
- Test UI immediately
- Find UI bugs while backend is being fixed
- Show stakeholders the design
- Develop frontend independently

---

## 🔧 Alternative: Create Mock Service

For better organization, create a separate mock service:

### File: `services/mockInventoryData.ts`

```typescript
export const mockInventoryData = {
  success: true,
  data: [
    // ... your mock data here
  ],
  pagination: {
    total: 2,
    totalProducts: 3,
    page: 1,
    pages: 1,
    limit: 20
  }
};
```

### Then in `inventory.tsx`:

```typescript
import { mockInventoryData } from '@/services/mockInventoryData';

const loadInventory = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Toggle between mock and real
    const USE_MOCK = true;  // Set to false when backend is ready
    
    let response;
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      response = mockInventoryData;
    } else {
      const params: any = { /* ... */ };
      response = await inventoryAPI.getAll(params);
    }
    
    // Rest of your code...
```

---

## 🎯 Quick Toggle

Add a flag at the top of your file:

```typescript
// At the top of app/(tabs)/inventory.tsx
const USE_MOCK_DATA = true;  // 🎨 TOGGLE THIS

export default function InventoryScreen() {
  // ... your code
  
  const loadInventory = async () => {
    if (USE_MOCK_DATA) {
      // Load mock data
    } else {
      // Load real API data
    }
  };
```

---

## ✅ When to Remove Mock Data

Remove mock data when:
1. ✅ Backend returns 200 OK
2. ✅ Backend returns proper JSON structure
3. ✅ You can access `http://10.132.41.159:3050/api/inventory` successfully
4. ✅ Real data matches expected format

---

## 🚀 Summary

**Now:**
- Use mock data to test UI
- Fix backend 500 error
- Verify backend returns correct format

**Later:**
- Remove mock data
- Switch back to real API
- Test with real data

**Your UI is ready - just waiting for backend!** ✅
