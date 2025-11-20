# Purchase Order API Documentation

Complete API reference for Purchase Order management - Ready for React Native integration.

---

## 📋 Table of Contents
1. [Base Configuration](#base-configuration)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Business Logic](#business-logic)
5. [React Native Integration](#react-native-integration)

---

## 🔧 Base Configuration

```javascript
const API_BASE_URL = 'http://your-server.com/api';
const PO_ENDPOINT = '/purchase-orders';
```

---

## 🌐 API Endpoints

### 1. Get All Purchase Orders (with Pagination & Filters)
```
GET /purchase-orders
```

**Query Parameters:**
```javascript
{
  page: 1,              // Page number (default: 1)
  limit: 10,            // Items per page (default: 10)
  search: '',           // Search by PO number, supplier, notes
  supplier: '',         // Filter by supplier ID
  status: '',           // Filter by status
  priority: '',         // Filter by priority
  dateFrom: '',         // Filter by date range (ISO format)
  dateTo: '',           // Filter by date range (ISO format)
  overdue: 'true'       // Filter overdue POs
}
```

**Response:**
```javascript
{
  success: true,
  data: [/* Array of PO objects */],
  pagination: {
    current: 1,
    pages: 5,
    total: 50,
    limit: 10
  }
}
```

---

### 2. Get Purchase Order by ID
```
GET /purchase-orders/:id
```

**Response:**
```javascript
{
  success: true,
  data: {
    _id: "...",
    poNumber: "PKRK/PO/01",
    supplier: { _id: "...", companyName: "VTX" },
    category: { _id: "...", categoryName: "Cotton Yarn" },
    items: [
      {
        product: { _id: "...", productName: "Cotton 30s" },
        productName: "Cotton 30s",
        quantity: 100,
        weight: 5000,
        unit: "Bags",
        notes: "",
        receivedQuantity: 0,
        receivedWeight: 0,
        pendingQuantity: 100,
        pendingWeight: 5000,
        receiptStatus: "Pending"
      }
    ],
    status: "Draft",
    orderDate: "2025-11-19T00:00:00.000Z",
    expectedDeliveryDate: "2025-11-25T00:00:00.000Z",
    notes: "",
    internalNotes: "",
    createdAt: "2025-11-19T10:00:00.000Z",
    updatedAt: "2025-11-19T10:00:00.000Z"
  }
}
```

---

### 3. Create Purchase Order
```
POST /purchase-orders
```

**Request Body:**
```javascript
{
  supplier: "supplier_id",
  category: "category_id",
  expectedDeliveryDate: "2025-11-25",
  items: [
    {
      product: "product_id",
      quantity: 100,
      weight: 5000,
      unit: "Bags",
      notes: ""
    }
  ],
  notes: "Optional notes",
  internalNotes: "Optional internal notes"
}
```

**Response:**
```javascript
{
  success: true,
  message: "Purchase order created successfully",
  data: {/* Created PO object */}
}
```

---

### 4. Update Purchase Order
```
PUT /purchase-orders/:id
```

**Request Body:** (Same as Create, but all fields optional)
```javascript
{
  supplier: "supplier_id",
  category: "category_id",
  expectedDeliveryDate: "2025-11-25",
  items: [
    {
      product: "product_id",
      productName: "Cotton 30s", // Required for existing items
      quantity: 100,
      weight: 5000,
      unit: "Bags",
      notes: ""
    }
  ],
  notes: "Updated notes"
}
```

**Important Notes:**
- Can only update Draft POs completely
- For Sent/Acknowledged/Approved POs, only status and notes can be updated
- Must include `productName` when updating items

**Response:**
```javascript
{
  success: true,
  message: "Purchase order updated successfully",
  data: {/* Updated PO object */}
}
```

---

### 5. Cancel Purchase Order
```
PATCH /purchase-orders/:id/cancel
```

**Request Body:**
```javascript
{
  cancellationReason: "Reason for cancellation",
  cancelledBy: "Admin",
  notes: "Optional additional notes"
}
```

**Business Rules:**
- Cannot cancel already Cancelled/Fully_Received/Closed POs
- Cancellation reason is appended to internal notes
- Status changes to 'Cancelled'

**Response:**
```javascript
{
  success: true,
  message: "Purchase order cancelled successfully",
  data: {/* Cancelled PO object */}
}
```

---

### 6. Delete Purchase Order
```
DELETE /purchase-orders/:id
```

**Business Rules:**
- ⚠️ **Can ONLY delete Cancelled POs**
- Cannot delete if PO has associated GRNs
- Permanent deletion (cannot be undone)

**Response:**
```javascript
{
  success: true,
  message: "Purchase order deleted successfully"
}
```

**Error Response (if has GRNs):**
```javascript
{
  success: false,
  message: "Cannot delete purchase order. It has 2 associated GRN(s). Please delete or reassign the GRNs first."
}
```

---

### 7. Update Purchase Order Status
```
PATCH /purchase-orders/:id/status
```

**Request Body:**
```javascript
{
  status: "Approved",
  notes: "Optional status change notes"
}
```

**Valid Status Transitions:**
- Draft → Sent, Cancelled
- Sent → Acknowledged, Cancelled
- Acknowledged → Approved, Cancelled
- Approved → Partially_Received, Fully_Received, Cancelled
- Partially_Received → Fully_Received, Cancelled
- Fully_Received → Closed

**Response:**
```javascript
{
  success: true,
  message: "Purchase order status updated successfully",
  data: {/* Updated PO object */}
}
```

---

### 8. Get Purchase Order Statistics
```
GET /purchase-orders/stats
```

**Response:**
```javascript
{
  success: true,
  data: {
    totalPOs: 50,
    statusBreakdown: [
      { _id: "Draft", count: 10 },
      { _id: "Sent", count: 5 },
      { _id: "Approved", count: 15 },
      { _id: "Partially_Received", count: 12 },
      { _id: "Fully_Received", count: 6 },
      { _id: "Cancelled", count: 2 }
    ],
    overduePOs: 3,
    totalValue: 1500000
  }
}
```

---

## 📊 Data Models

### Purchase Order Schema
```javascript
{
  poNumber: String,              // Auto-generated: PKRK/PO/01, PKRK/PO/02, etc.
  supplier: ObjectId,            // Reference to Supplier
  category: ObjectId,            // Reference to Category
  items: [
    {
      product: ObjectId,         // Reference to Product
      productName: String,       // Required
      quantity: Number,          // Required, min: 1
      weight: Number,            // Default: 0, min: 0
      unit: String,              // Default: 'Bags'
      notes: String,
      receivedQuantity: Number,  // Default: 0
      receivedWeight: Number,    // Default: 0
      pendingQuantity: Number,   // Auto-calculated
      pendingWeight: Number,     // Auto-calculated
      receiptStatus: String      // 'Pending', 'Partial', 'Complete'
    }
  ],
  status: String,                // See Status Enum below
  orderDate: Date,               // Auto-set to current date
  expectedDeliveryDate: Date,    // Required
  notes: String,
  internalNotes: String,
  lastModifiedBy: String,
  createdAt: Date,               // Auto-generated
  updatedAt: Date                // Auto-updated
}
```

### Status Enum
```javascript
[
  'Draft',              // Initial state
  'Sent',              // Sent to supplier
  'Acknowledged',      // Supplier acknowledged
  'Approved',          // Approved for receipt
  'Partially_Received', // Some items received
  'Fully_Received',    // All items received
  'Cancelled',         // Cancelled
  'Closed'             // Closed/Completed
]
```

---

## 🎯 Business Logic

### PO Number Generation
- **Format:** `PKRK/PO/XX` (e.g., PKRK/PO/01, PKRK/PO/02)
- **Logic:** Finds max existing number and increments
- **Deletion Safe:** Never reuses deleted PO numbers
- **Scalable:** No padding limit, supports unlimited POs

### Item Calculations (Auto-calculated on save)
```javascript
pendingQuantity = quantity - receivedQuantity
pendingWeight = weight - receivedWeight
```

### Receipt Status (Auto-updated)
- **Pending:** receivedQuantity === 0
- **Partial:** 0 < receivedQuantity < quantity
- **Complete:** receivedQuantity >= quantity

### Validation Rules
1. **Create:**
   - Supplier must exist
   - Category must exist
   - All products must exist
   - At least one item required
   - expectedDeliveryDate required

2. **Update:**
   - Draft POs: All fields can be updated
   - Sent/Acknowledged/Approved: Only status and notes
   - Must include productName for items

3. **Cancel:**
   - Cannot cancel Cancelled/Fully_Received/Closed POs

4. **Delete:**
   - Can ONLY delete Cancelled POs
   - Cannot delete if has GRNs

---

## 📱 React Native Integration

### Complete API Service Example

```javascript
// services/purchaseOrderAPI.js
import axios from 'axios';

const API_BASE_URL = 'http://your-server.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // Your auth token getter
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const purchaseOrderAPI = {
  // Get all POs with pagination
  getAll: async (params = {}) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  // Get PO by ID
  getById: async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  // Create new PO
  create: async (poData) => {
    const response = await api.post('/purchase-orders', poData);
    return response.data;
  },

  // Update PO
  update: async (id, poData) => {
    const response = await api.put(`/purchase-orders/${id}`, poData);
    return response.data;
  },

  // Cancel PO
  cancel: async (id, data = {}) => {
    const response = await api.patch(`/purchase-orders/${id}/cancel`, data);
    return response.data;
  },

  // Delete PO (Cancelled only)
  delete: async (id) => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data;
  },

  // Update status
  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/purchase-orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/purchase-orders/stats');
    return response.data;
  },

  // Search POs
  search: async (searchTerm, filters = {}) => {
    return purchaseOrderAPI.getAll({ search: searchTerm, ...filters });
  },

  // Get by status
  getByStatus: async (status, page = 1, limit = 10) => {
    return purchaseOrderAPI.getAll({ status, page, limit });
  },

  // Get overdue POs
  getOverdue: async () => {
    return purchaseOrderAPI.getAll({ overdue: 'true' });
  },
};

export default purchaseOrderAPI;
```

---

### React Native Component Example

```javascript
// screens/PurchaseOrderListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import purchaseOrderAPI from '../services/purchaseOrderAPI';

const PurchaseOrderListScreen = ({ navigation }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch POs
  const fetchPurchaseOrders = async (page = 1, status = '') => {
    try {
      setLoading(true);
      const response = await purchaseOrderAPI.getAll({
        page,
        limit: 10,
        status,
      });
      setPurchaseOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders(1, statusFilter);
  }, [statusFilter]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchaseOrders(pagination.current, statusFilter);
  };

  // Handle PO actions
  const handlePOAction = async (action, po) => {
    switch (action) {
      case 'view':
        navigation.navigate('PurchaseOrderDetail', { poId: po._id });
        break;

      case 'edit':
        navigation.navigate('PurchaseOrderForm', { purchaseOrder: po });
        break;

      case 'cancel':
        Alert.alert(
          'Cancel Purchase Order',
          'Are you sure you want to cancel this purchase order?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes',
              onPress: async () => {
                try {
                  await purchaseOrderAPI.cancel(po._id, {
                    cancellationReason: 'Cancelled by user',
                    cancelledBy: 'Mobile App',
                  });
                  Alert.alert('Success', 'Purchase order cancelled');
                  fetchPurchaseOrders(pagination.current, statusFilter);
                } catch (error) {
                  Alert.alert('Error', error.message);
                }
              },
            },
          ]
        );
        break;

      case 'delete':
        Alert.alert(
          'Delete Purchase Order',
          'Permanently delete this cancelled purchase order? This cannot be undone.',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await purchaseOrderAPI.delete(po._id);
                  Alert.alert('Success', 'Purchase order deleted');
                  fetchPurchaseOrders(pagination.current, statusFilter);
                } catch (error) {
                  Alert.alert('Error', error.message);
                }
              },
            },
          ]
        );
        break;
    }
  };

  // Render PO item
  const renderPOItem = ({ item }) => (
    <View style={styles.poCard}>
      <View style={styles.poHeader}>
        <Text style={styles.poNumber}>{item.poNumber}</Text>
        <Text style={[styles.status, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
      </View>

      <Text style={styles.supplier}>
        {item.supplier?.companyName || 'N/A'}
      </Text>
      <Text style={styles.category}>
        {item.category?.categoryName || 'N/A'}
      </Text>
      <Text style={styles.date}>
        {new Date(item.orderDate).toLocaleDateString()}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handlePOAction('view', item)}
          style={styles.viewButton}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>

        {item.status === 'Draft' && (
          <TouchableOpacity
            onPress={() => handlePOAction('edit', item)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}

        {item.status !== 'Cancelled' &&
          item.status !== 'Fully_Received' &&
          item.status !== 'Closed' && (
            <TouchableOpacity
              onPress={() => handlePOAction('cancel', item)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

        {item.status === 'Cancelled' && (
          <TouchableOpacity
            onPress={() => handlePOAction('delete', item)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Load more (pagination)
  const loadMore = () => {
    if (pagination.current < pagination.pages && !loading) {
      fetchPurchaseOrders(pagination.current + 1, statusFilter);
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {/* Add your filter UI here */}
      </View>

      {/* PO List */}
      <FlatList
        data={purchaseOrders}
        renderItem={renderPOItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && <ActivityIndicator size="large" color="#0000ff" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text>No purchase orders found</Text>
            </View>
          )
        }
      />
    </View>
  );
};

// Helper function for status styling
const getStatusStyle = (status) => {
  const styles = {
    Draft: { backgroundColor: '#E5E7EB', color: '#1F2937' },
    Sent: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    Approved: { backgroundColor: '#D1FAE5', color: '#065F46' },
    Cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  };
  return styles[status] || styles.Draft;
};

export default PurchaseOrderListScreen;
```

---

## 🎨 UI Action Matrix

| Status | View | Edit | Cancel | Delete |
|--------|------|------|--------|--------|
| **Draft** | ✅ | ✅ | ✅ | ❌ |
| **Sent** | ✅ | ❌ | ✅ | ❌ |
| **Acknowledged** | ✅ | ❌ | ✅ | ❌ |
| **Approved** | ✅ | ❌ | ✅ | ❌ |
| **Partially Received** | ✅ | ❌ | ✅ | ❌ |
| **Fully Received** | ✅ | ❌ | ❌ | ❌ |
| **Cancelled** | ✅ | ❌ | ❌ | ✅ |
| **Closed** | ✅ | ❌ | ❌ | ❌ |

---

## ⚠️ Important Notes

1. **Delete Workflow:**
   - User must first Cancel the PO
   - Then Delete button appears
   - This prevents accidental deletions

2. **Pagination:**
   - Default: 10 items per page
   - Fully implemented on backend
   - Use `page` and `limit` query params

3. **PO Number Generation:**
   - Automatic and unique
   - Never reuses deleted numbers
   - Production-safe and scalable

4. **Error Handling:**
   - All endpoints return consistent error format
   - Check `success` field in response
   - Display `message` field to user

5. **Authentication:**
   - Add Bearer token to all requests
   - Handle 401 Unauthorized responses
   - Implement token refresh logic

---

## 🚀 Production Checklist

- ✅ Pagination implemented
- ✅ Search and filters working
- ✅ Proper error handling
- ✅ Data validation on backend
- ✅ Unique PO number generation
- ✅ Delete protection (GRN check)
- ✅ Status workflow enforcement
- ✅ Audit trail (lastModifiedBy, timestamps)
- ✅ Scalable architecture
- ✅ No breaking changes to existing data

---

**Last Updated:** November 19, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
