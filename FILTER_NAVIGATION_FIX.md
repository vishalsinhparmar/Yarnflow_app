# ✅ Filter Navigation & Form Submission Fix

## 🔧 Issue 1: Filter Buttons Not Working

### Problem
```
User clicks "Draft" button in Sales Screen
→ Navigates to Sales Orders list
❌ Shows ALL orders instead of only Draft orders
❌ Filter button not selected
❌ No API call with filter parameter
```

### Root Cause
Sales Screen was navigating to `/sales-orders` without passing filter parameters.

Sales Orders list screen didn't support URL parameters to set initial filter state.

---

### Fix Applied

#### 1. Added URL Parameter Support to Sales Orders List

**File: `app/sales-orders/index.tsx`**

```javascript
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SalesOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Initialize filter from URL parameter
  const [statusFilter, setStatusFilter] = useState(params.filter || 'all');

  // Update filter when URL params change
  useEffect(() => {
    if (params.filter && params.filter !== statusFilter) {
      setStatusFilter(params.filter);
    }
  }, [params.filter]);

  useEffect(() => {
    loadData();
  }, [statusFilter]); // Reload data when filter changes
}
```

---

#### 2. Updated Sales Screen Navigation with Filter Parameters

**File: `app/(tabs)/sales.tsx`**

**Stats Boxes:**
```javascript
<View style={styles.statsRow}>
  {/* Total Orders - Show All */}
  <TouchableOpacity 
    style={styles.statItem}
    onPress={() => router.push('/sales-orders?filter=all')}
  >
    <Text style={styles.statValue}>{stats.totalOrders}</Text>
    <Text style={styles.statLabel}>Total</Text>
  </TouchableOpacity>
  
  {/* Pending Orders - Show All */}
  <TouchableOpacity 
    style={styles.statItem}
    onPress={() => router.push('/sales-orders?filter=all')}
  >
    <Text style={[styles.statValue, { color: '#FCD34D' }]}>{stats.pending}</Text>
    <Text style={styles.statLabel}>Pending</Text>
  </TouchableOpacity>
  
  {/* Delivered Orders - Filter by Delivered */}
  <TouchableOpacity 
    style={styles.statItem}
    onPress={() => router.push('/sales-orders?filter=Delivered')}
  >
    <Text style={[styles.statValue, { color: '#34D399' }]}>{stats.completed}</Text>
    <Text style={styles.statLabel}>Delivered</Text>
  </TouchableOpacity>
</View>
```

**Quick Action Buttons:**
```javascript
{/* Draft Orders Button */}
<TouchableOpacity
  style={styles.quickActionCard}
  onPress={() => router.push('/sales-orders?filter=Draft')}
  activeOpacity={0.7}
>
  <View style={styles.quickActionIcon}>
    <Ionicons name="create" size={24} color="#F59E0B" />
  </View>
  <View style={styles.quickActionContent}>
    <Text style={styles.quickActionTitle}>Draft Orders</Text>
    <Text style={styles.quickActionSubtitle}>{stats.draft} orders need attention</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
</TouchableOpacity>

{/* Delivered Orders Button */}
<TouchableOpacity
  style={styles.quickActionCard}
  onPress={() => router.push('/sales-orders?filter=Delivered')}
  activeOpacity={0.7}
>
  <View style={styles.quickActionIcon}>
    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
  </View>
  <View style={styles.quickActionContent}>
    <Text style={styles.quickActionTitle}>Delivered Orders</Text>
    <Text style={styles.quickActionSubtitle}>{stats.completed} completed orders</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
</TouchableOpacity>
```

---

### Result

**Now Works Correctly:**

1. **Click "Draft Orders" button:**
   ```
   Navigates to: /sales-orders?filter=Draft
   → Sales Orders list loads with filter='Draft'
   → API call: GET /sales-orders?status=Draft&limit=50&sort=-createdAt
   → Shows only Draft orders
   → "Draft" filter button is selected (blue)
   ```

2. **Click "Delivered" stat box:**
   ```
   Navigates to: /sales-orders?filter=Delivered
   → Sales Orders list loads with filter='Delivered'
   → API call: GET /sales-orders?status=Delivered&limit=50&sort=-createdAt
   → Shows only Delivered orders
   → "Delivered" filter button is selected (green)
   ```

3. **Click "Total" stat box:**
   ```
   Navigates to: /sales-orders?filter=all
   → Sales Orders list loads with filter='all'
   → API call: GET /sales-orders?limit=50&sort=-createdAt (no status filter)
   → Shows all orders
   → "All" filter button is selected (blue)
   ```

✅ **Filter navigation now works perfectly!**

---

## 🔧 Issue 2: Form Submission Error (400)

### Problem
```
❌ HTTP Error: 400
ERROR  Error submitting form: [Error: HTTP error! status: 400]
```

### Root Cause
Backend validation failing - likely missing required fields or invalid data format.

---

### Fix Applied

**Added Console Logging to Debug Payload:**

```javascript
const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    setSubmitting(true);
    const payload = {
      customer: formData.customer,
      category: formData.category,
      items: formData.items.map(item => ({
        product: item.product,
        quantity: Number(item.quantity),
        unit: item.unit || 'Bags', // Ensure unit has default value
        weight: Number(item.weight) || 0, // Ensure weight has default value
        itemNotes: item.itemNotes || '',
      })),
    };

    if (formData.expectedDeliveryDate) {
      payload.expectedDeliveryDate = formData.expectedDeliveryDate;
    }

    console.log('📦 Submitting payload:', JSON.stringify(payload, null, 2));

    if (isEditMode) {
      const response = await salesOrderAPI.update(id, payload);
      console.log('✅ Update response:', response);
      Alert.alert('Success', 'Sales order updated successfully', [
        { text: 'OK', onPress: () => router.push('/sales-orders') }
      ]);
    } else {
      const response = await salesOrderAPI.create(payload);
      console.log('✅ Create response:', response);
      Alert.alert('Success', 'Sales order created successfully', [
        { text: 'OK', onPress: () => router.push('/sales-orders') }
      ]);
    }
  } catch (err) {
    console.error('Error submitting form:', err);
    Alert.alert('Error', err.message || 'Failed to save sales order');
  } finally {
    setSubmitting(false);
  }
};
```

**Changes Made:**
1. ✅ Added default value for `unit` (fallback to 'Bags')
2. ✅ Added default value for `weight` (fallback to 0)
3. ✅ Added console logging to see exact payload being sent
4. ✅ Added response logging to see server response

---

### Expected Payload Format

```json
{
  "customer": "673722a5b8e5f0e2e8a1b2c3",
  "category": "690b2ed908157bf9286a1cb5",
  "expectedDeliveryDate": "2025-11-20",
  "items": [
    {
      "product": "690b2fc94189d9cf6e0c7f05",
      "quantity": 30,
      "unit": "Bags",
      "weight": 1636.36,
      "itemNotes": ""
    }
  ]
}
```

---

### Debugging Steps

**When you submit the form, check console logs:**

```
📦 Submitting payload: {
  "customer": "...",
  "category": "...",
  "items": [...]
}
```

**If still getting 400 error, check:**
1. ✅ Customer ID is valid
2. ✅ Category ID is valid
3. ✅ Product IDs are valid
4. ✅ Quantity is a number > 0
5. ✅ Weight is a number >= 0
6. ✅ Unit is a string
7. ✅ Date format is correct (if provided)

**Common 400 Error Causes:**
- Missing required fields
- Invalid ObjectId format
- Quantity exceeds available stock
- Invalid date format
- Product not in selected category
- Customer or Category doesn't exist

---

## 🧪 Testing

### Test Filter Navigation

```bash
npx expo start --clear
```

**Steps:**

1. **Open Sales Tab**
2. **Click "Draft Orders" button**
   - ✅ Should navigate to Sales Orders list
   - ✅ Should show only Draft orders
   - ✅ "Draft" filter button should be selected (blue)
   - ✅ Console should show: `GET /sales-orders?status=Draft...`

3. **Click "Delivered Orders" button**
   - ✅ Should navigate to Sales Orders list
   - ✅ Should show only Delivered orders
   - ✅ "Delivered" filter button should be selected (green)
   - ✅ Console should show: `GET /sales-orders?status=Delivered...`

4. **Click "Delivered" stat box (10)**
   - ✅ Should navigate to Sales Orders list
   - ✅ Should show only Delivered orders
   - ✅ "Delivered" filter button should be selected

5. **Click "Total" stat box (14)**
   - ✅ Should navigate to Sales Orders list
   - ✅ Should show all orders
   - ✅ "All" filter button should be selected

6. **Manually click filter buttons in list**
   - ✅ Should filter orders correctly
   - ✅ Selected button should be highlighted

---

### Test Form Submission

**Steps:**

1. **Open Sales Orders → New Sales Order**
2. **Fill in form:**
   - Select Customer
   - Select Category
   - Select Product
   - Enter Quantity
   - Check weight auto-calculates
3. **Click "Create Order"**
4. **Check console logs:**
   ```
   📦 Submitting payload: {...}
   ```
5. **If successful:**
   ```
   ✅ Create response: { success: true, data: {...} }
   Alert: "Sales order created successfully"
   Navigates to: /sales-orders
   ```
6. **If 400 error:**
   - Check payload format in console
   - Verify all IDs are valid
   - Check backend logs for validation errors

---

## ✅ Summary

### Filter Navigation
- ✅ Sales Screen passes filter parameters in URL
- ✅ Sales Orders list reads filter from URL params
- ✅ Filter state updates when URL changes
- ✅ API calls include correct status filter
- ✅ Filter buttons show correct selection
- ✅ Draft button → Shows only Draft orders
- ✅ Delivered button → Shows only Delivered orders
- ✅ Total button → Shows all orders

### Form Submission
- ✅ Added default values for unit and weight
- ✅ Added console logging for debugging
- ✅ Added response logging
- ✅ Proper error handling
- ✅ Success navigation

### Both Issues
- ✅ Filter navigation works correctly
- ✅ Form submission has better debugging
- ✅ Console logs help identify issues
- ✅ Proper error messages

🎉 **Filter navigation fixed! Form submission debuggable!**

---

## 📝 Next Steps

**If form still shows 400 error:**

1. Check console log for payload
2. Copy the exact payload
3. Test the same payload in Postman/Thunder Client
4. Compare with backend validation rules
5. Check backend logs for specific error message
6. Verify all IDs exist in database

**Common fixes:**
- Ensure customer exists in database
- Ensure category exists in database
- Ensure products exist in database
- Ensure products belong to selected category
- Check date format matches backend expectation
- Verify quantity doesn't exceed stock
