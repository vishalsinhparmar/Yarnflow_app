# Comprehensive Fixes Required for Production Parity

## Overview
Based on web app screenshots and reference code, the following critical fixes are needed across SO, PO, GRN, and Sales Challan modules.

---

## 1. SALES ORDER FIXES

### ✅ COMPLETED:
- **Inventory-Only Products**: Modified `loadProducts()` to show only products with `totalStock > 0`
- **Item Notes Field**: Changed `itemNotes` to `notes` to match backend schema

### 🔧 REMAINING FIXES:

#### A. Item Notes Display in Detail Modal (Image 3)
- **Issue**: Item notes not visible in SO detail view
- **Web App Shows**: "item have been given to bee" and "rolls are give me fully completed"
- **Fix Required**: Add notes display in `app/sales-orders/[id].tsx` detail screen

#### B. Status Management (Image 2)
- **Current**: Basic status display
- **Required**: Proper Draft/Delivered/Cancelled status with actions
- **Actions Needed**: 
  - Edit button (for Draft status only)
  - Cancel button (for Draft/Pending)
  - Delete button (for Draft only)
  - Status badges with proper colors

#### C. Category-Based Inventory Filter
- **Issue**: Categories without inventory should not show
- **Fix**: Filter categories in `loadCategories()` to only show those with available inventory

---

## 2. PURCHASE ORDER FIXES

### 🔧 REQUIRED FIXES:

#### A. Unit Management (Image 4)
- **Web App Shows**: "Manage" button next to Unit field
- **Purpose**: Add/edit custom units for products
- **Fix Required**: Add unit management modal/functionality

#### B. Item Notes Field (Image 4)
- **Web App Shows**: "this is notes for a product item 061"
- **Current**: Notes field exists but may not be properly saved/displayed
- **Fix Required**: Ensure notes are saved and displayed in PO detail

#### C. Edit Functionality Issues
- **Issue**: Edit mode doesn't fetch complete product details
- **Symptoms**: Missing product info when editing PO
- **Fix Required**: Enhance `loadPurchaseOrder()` in `app/purchase-orders/form.tsx` to populate all fields

#### D. PO Detail Screen (app/purchase-orders/[id].tsx)
- **Missing**: Item notes display
- **Missing**: Proper status badges (Pending/Partially_Received/Fully_Received)
- **Missing**: Receipt status per item
- **Fix Required**: Add all missing fields matching web app

---

## 3. GRN FIXES

### ✅ COMPLETED:
- Manual completion checkbox with FINAL badge
- Receipt status display (Partial/Complete/Pending)
- Manual completion badges in detail view

### 🔧 REQUIRED FIXES:

#### A. "Add GRN" Button for Partial POs (Image 5)
- **Web App Shows**: Green "+ Add GRN" button next to partial POs
- **Purpose**: Create additional GRN for same PO when partially received
- **Current**: Missing this functionality
- **Fix Required**: 
  1. Add "Add GRN" button in GRN list for POs with status "Partial"
  2. Button should navigate to GRN form with PO pre-selected
  3. Form should fetch existing PO details and show pending quantities

#### B. GRN Grouping by PO (Image 5)
- **Web App Shows**: GRNs grouped under their Purchase Orders
- **Shows**: PO number, category badge, completion status
- **Shows**: Expandable/collapsible PO groups
- **Current**: Flat list of GRNs
- **Fix Required**: Implement PO grouping in `app/grn/index.tsx`

#### C. Edit GRN for Partial Receipts
- **Issue**: Can't add more GRNs to partially received POs
- **Fix**: When clicking "Add GRN" on partial PO, pre-populate form with pending items only

---

## 4. SALES CHALLAN FIXES

### 🔧 REQUIRED FIXES:

#### A. "Add Challan" Button for Partial SOs
- **Similar to GRN**: Need "+ Add Challan" button for partially dispatched SOs
- **Purpose**: Create additional challan for same SO
- **Fix Required**:
  1. Add "Add Challan" button in Sales Challan list for partial SOs
  2. Button navigates to challan form with SO pre-selected
  3. Form shows pending dispatch quantities

#### B. Manual Completion Feature
- **Missing**: Checkbox to mark items as complete (like GRN)
- **Use Case**: When 98 out of 100 dispatched due to shortages
- **Fix Required**: Add `manuallyCompleted` checkbox to `app/sales-challan/form.tsx`

#### C. Completion Status Display
- **Missing**: Proper Partial/Complete status in list and detail
- **Fix Required**: Add completion status calculation and display

---

## 5. COMMON FIXES ACROSS ALL MODULES

### A. TypeScript Errors in GRN Form
```
Property '_id' does not exist on type 'never'
Property 'poNumber' does not exist on type 'never'
Property 'supplierDetails' does not exist on type 'never'
```
- **Fix**: Add proper TypeScript interfaces for PO data in form

### B. Status Color Consistency
- **Draft**: Gray (#6B7280)
- **Pending**: Gray (#6B7280)
- **Partial**: Amber (#F59E0B)
- **Complete**: Green (#10B981)
- **Delivered**: Green (#10B981)
- **Cancelled**: Red (#EF4444)

### C. Item Notes Visibility
- All modules should show item-level notes in detail views
- Notes should be editable in forms
- Notes should appear in PDFs/exports

---

## PRIORITY ORDER

### HIGH PRIORITY (Blocking Production):
1. ✅ SO: Show only products with inventory
2. 🔧 GRN: Add "Add GRN" button for partial POs
3. 🔧 Sales Challan: Add "Add Challan" button for partial SOs
4. 🔧 PO: Fix edit functionality to fetch all details

### MEDIUM PRIORITY (User Experience):
5. 🔧 GRN: Implement PO grouping in list view
6. 🔧 SO/PO: Display item notes in detail views
7. 🔧 Sales Challan: Add manual completion feature
8. 🔧 All: Fix TypeScript errors

### LOW PRIORITY (Nice to Have):
9. 🔧 PO: Unit management modal
10. 🔧 All: Enhanced status management with proper actions

---

## NEXT STEPS

1. Fix "Add GRN" functionality for partial POs
2. Fix "Add Challan" functionality for partial SOs
3. Add item notes display to all detail screens
4. Fix PO edit to fetch complete details
5. Implement GRN grouping by PO
6. Add manual completion to Sales Challan
7. Fix all TypeScript errors
8. Test end-to-end workflows

---

## FILES TO MODIFY

### Sales Orders:
- ✅ `app/sales-orders/form.tsx` - Inventory filter
- 🔧 `app/sales-orders/[id].tsx` - Add notes display

### Purchase Orders:
- 🔧 `app/purchase-orders/form.tsx` - Fix edit fetch
- 🔧 `app/purchase-orders/[id].tsx` - Add notes display

### GRN:
- 🔧 `app/grn/index.tsx` - Add "Add GRN" button, PO grouping
- 🔧 `app/grn/form.tsx` - Fix TypeScript errors

### Sales Challan:
- 🔧 `app/sales-challan/index.tsx` - Add "Add Challan" button
- 🔧 `app/sales-challan/form.tsx` - Add manual completion
- 🔧 `app/sales-challan/[id].tsx` - Add notes display

---

**Status**: In Progress
**Last Updated**: Dec 25, 2025
