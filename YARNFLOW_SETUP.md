# YarnFlow Mobile App - Setup & Development Guide

## 🎯 Project Overview

YarnFlow Mobile is a React Native app for managing textile supply chain operations, including:
- **Master Data Management**: Customers, Suppliers, Products, Categories
- **Purchase Flow**: Purchase Orders → GRN → Inventory Lots
- **Sales Flow**: Sales Orders → Sales Challan (Delivery Tracking)
- **Real-time Dashboard**: Metrics, workflow visualization, and alerts

---

## 📁 Project Structure

```
YarnFlow-Mobile/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx            # Dashboard (Home)
│   │   ├── master-data.tsx      # Master Data Management
│   │   ├── purchase.tsx         # Purchase Orders
│   │   ├── inventory.tsx        # Inventory & GRN
│   │   └── sales.tsx            # Sales Orders & Challan
│   ├── _layout.tsx              # Root layout
│   └── modal.tsx                # Modal screens
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   └── ...                      # Feature-specific components
├── services/                     # API service layer
│   ├── common.js                # Base API config
│   ├── dashboardAPI.js          # Dashboard endpoints
│   ├── masterDataAPI.js         # Master data CRUD
│   ├── purchaseOrderAPI.js      # Purchase order operations
│   ├── grnAPI.js                # Goods receipt operations
│   ├── inventoryAPI.js          # Inventory management
│   ├── salesOrderAPI.js         # Sales order operations
│   ├── salesChallanAPI.js       # Delivery tracking
│   └── index.js                 # Centralized exports
├── constants/                    # App constants & themes
├── hooks/                        # Custom React hooks
└── assets/                       # Images, fonts, icons
```

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js >= 18.x
npm or yarn
Expo CLI
Android Studio (for Android development)
```

### Installation

1. **Install dependencies:**
```bash
cd MyFirstApp
npm install
```

2. **Configure API URL:**

Edit `services/common.js` to set your backend URL:

```javascript
// For Android Emulator
const DEVELOPMENT_API = 'http://10.0.2.2:3050/api';

// For Physical Device (use your computer's IP)
const DEVELOPMENT_API = 'http://192.168.1.XXX:3050/api';

// For Production
const PRODUCTION_API = 'https://yarnflow-production.up.railway.app/api';
```

Or set it in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://your-api-url.com/api"
    }
  }
}
```

3. **Start the development server:**
```bash
npm start
```

4. **Run on Android:**
```bash
npm run android
```

---

## 🔌 API Integration

### Available API Services

All API services are located in the `services/` folder:

#### 1. **Dashboard API** (`dashboardAPI.js`)
```javascript
import { dashboardAPI } from './services';

// Get dashboard statistics
const stats = await dashboardAPI.getStats();

// Get real-time metrics
const metrics = await dashboardAPI.getRealtimeMetrics();
```

#### 2. **Master Data API** (`masterDataAPI.js`)
```javascript
import { customerAPI, supplierAPI, productAPI, categoryAPI } from './services';

// Customers
const customers = await customerAPI.getAll();
const customer = await customerAPI.getById(id);
await customerAPI.create(customerData);
await customerAPI.update(id, customerData);
await customerAPI.delete(id);

// Suppliers
const suppliers = await supplierAPI.getAll();
// ... similar CRUD operations

// Products
const products = await productAPI.getAll();
const lowStock = await productAPI.getLowStock();
// ... similar CRUD operations

// Categories
const categories = await categoryAPI.getAll();
// ... similar CRUD operations
```

#### 3. **Purchase Order API** (`purchaseOrderAPI.js`)
```javascript
import { purchaseOrderAPI } from './services';

// Get all purchase orders
const pos = await purchaseOrderAPI.getAll();

// Create purchase order
const newPO = await purchaseOrderAPI.create({
  supplier: supplierId,
  items: [
    { product: productId, quantity: 100, unitPrice: 500 }
  ],
  // ... other fields
});

// Approve PO
await purchaseOrderAPI.approve(poId);
```

#### 4. **GRN API** (`grnAPI.js`)
```javascript
import { grnAPI } from './services';

// Create GRN
const grn = await grnAPI.create({
  purchaseOrder: poId,
  items: [
    { 
      product: productId, 
      receivedQuantity: 100,
      actualWeight: 5020, // in kg
      qualityCheck: 'passed'
    }
  ]
});

// Approve GRN
await grnAPI.approve(grnId);
```

#### 5. **Inventory API** (`inventoryAPI.js`)
```javascript
import { inventoryAPI } from './services';

// Get all inventory lots
const lots = await inventoryAPI.getAll();

// Get low stock items
const lowStock = await inventoryAPI.getLowStock();

// Reserve stock for sales
await inventoryAPI.reserveStock(lotId, quantity);
```

#### 6. **Sales Order API** (`salesOrderAPI.js`)
```javascript
import { salesOrderAPI } from './services';

// Create sales order
const so = await salesOrderAPI.create({
  customer: customerId,
  items: [
    { product: productId, quantity: 50, unitPrice: 600 }
  ]
});

// Approve and dispatch
await salesOrderAPI.approve(soId);
await salesOrderAPI.dispatch(soId, challanId);
```

#### 7. **Sales Challan API** (`salesChallanAPI.js`)
```javascript
import { salesChallanAPI } from './services';

// Create delivery challan
const challan = await salesChallanAPI.create({
  salesOrder: soId,
  vehicle: {
    number: 'MH-12-AB-1234',
    driver: { name: 'Ramesh Kumar', phone: '9876543210' }
  },
  destination: { city: 'Mumbai', state: 'Maharashtra' }
});

// Update delivery status
await salesChallanAPI.markInTransit(challanId);
await salesChallanAPI.markDelivered(challanId, { 
  receivedBy: 'Customer Name',
  receivedAt: new Date()
});

// Track delivery
const tracking = await salesChallanAPI.track(challanNumber);
```

---

## 📱 Screen Development Guide

### Creating a New Screen

1. **Create screen file in `app/` folder:**
```typescript
// app/purchase-orders.tsx
import { View, Text, FlatList } from 'react-native';
import { purchaseOrderAPI } from '../services';
import { useState, useEffect } from 'react';

export default function PurchaseOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await purchaseOrderAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <View>
            <Text>{item.poNumber}</Text>
            <Text>{item.supplier.name}</Text>
          </View>
        )}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
}
```

---

## 🎨 UI Components to Create

### Priority Components:

1. **Card Component** - Display data in cards
2. **DataTable Component** - List view with sorting/filtering
3. **Form Components** - Input fields, dropdowns, date pickers
4. **Modal Component** - For create/edit forms
5. **StatusBadge Component** - Color-coded status indicators
6. **SearchBar Component** - Search functionality
7. **FilterPanel Component** - Advanced filtering
8. **EmptyState Component** - When no data available
9. **LoadingSpinner Component** - Loading states
10. **ErrorBoundary Component** - Error handling

---

## 🔐 API Configuration Tips

### For Android Emulator:
- Use `10.0.2.2` instead of `localhost`
- Example: `http://10.0.2.2:3050/api`

### For iOS Simulator:
- Use `localhost` directly
- Example: `http://localhost:3050/api`

### For Physical Device:
- Use your computer's local IP address
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Example: `http://192.168.1.100:3050/api`
- Make sure device and computer are on the same WiFi network

### For Production:
- Use your deployed backend URL
- Example: `https://yarnflow-production.up.railway.app/api`

---

## 📊 Data Flow Example

### Complete Purchase-to-Sales Flow:

```javascript
// 1. Create Purchase Order
const po = await purchaseOrderAPI.create({
  supplier: supplierId,
  items: [{ product: productId, quantity: 100, unitPrice: 500 }]
});

// 2. Approve PO
await purchaseOrderAPI.approve(po._id);

// 3. Create GRN when goods arrive
const grn = await grnAPI.create({
  purchaseOrder: po._id,
  items: [{ 
    product: productId, 
    receivedQuantity: 100,
    actualWeight: 5020
  }]
});

// 4. Approve GRN (creates inventory lot automatically)
await grnAPI.approve(grn._id);

// 5. Create Sales Order
const so = await salesOrderAPI.create({
  customer: customerId,
  items: [{ product: productId, quantity: 50, unitPrice: 600 }]
});

// 6. Approve SO (reserves inventory)
await salesOrderAPI.approve(so._id);

// 7. Create Sales Challan for delivery
const challan = await salesChallanAPI.create({
  salesOrder: so._id,
  vehicle: { number: 'MH-12-AB-1234' }
});

// 8. Mark as in transit
await salesChallanAPI.markInTransit(challan._id);

// 9. Mark as delivered
await salesChallanAPI.markDelivered(challan._id, {
  receivedBy: 'Customer Name'
});
```

---

## 🧪 Testing API Endpoints

You can test all endpoints using the API services:

```javascript
// Test in a React Native component
import YarnFlowAPI from './services';

// Test dashboard
const testDashboard = async () => {
  const stats = await YarnFlowAPI.dashboard.getStats();
  console.log('Dashboard Stats:', stats);
};

// Test master data
const testMasterData = async () => {
  const customers = await YarnFlowAPI.masterData.customers.getAll();
  console.log('Customers:', customers);
};
```

---

## 📝 Next Steps

1. **Create Navigation Structure** - Set up tabs/drawer navigation
2. **Build Dashboard Screen** - Show workflow and metrics
3. **Create Master Data Screens** - CRUD for customers, suppliers, products
4. **Build Transaction Screens** - PO, GRN, SO, Challan screens
5. **Add Authentication** - Login/logout functionality
6. **Implement State Management** - Context API or Redux
7. **Add Offline Support** - Cache data locally
8. **Create Reports** - PDF generation for documents

---

## 🐛 Common Issues & Solutions

### Issue: Cannot connect to API
**Solution:** 
- Check if backend server is running
- Verify API URL in `services/common.js`
- For Android emulator, use `10.0.2.2` not `localhost`
- For physical device, use computer's IP address

### Issue: CORS errors
**Solution:** 
- This shouldn't happen in React Native (no CORS in mobile apps)
- If testing on web, configure CORS in your backend

### Issue: Network request failed
**Solution:**
- Check internet connection
- Verify backend is accessible
- Check firewall settings
- Ensure backend allows connections from your IP

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Navigation](https://reactnavigation.org/)

---

## 🤝 Development Workflow

1. **Start Backend Server** (Node.js)
2. **Start Expo Dev Server** (`npm start`)
3. **Run on Device/Emulator** (`npm run android`)
4. **Make Changes** - Hot reload will update automatically
5. **Test API Integration** - Check console logs
6. **Build Screens** - One module at a time

---

**Ready to build YarnFlow Mobile! 🚀**

Start with the Dashboard screen and Master Data, then move to transaction screens (PO → GRN → Inventory → SO → Challan).
