# Master Data Cleanup - Old Files to Remove

## 🧹 Files to Delete (Old Flat Structure)

The following files are from the old flat structure and should be removed as they have been replaced by the new modular structure:

### ❌ **Old Files to Remove:**

```
app/master-data/
├── categories.tsx          ❌ REMOVE (replaced by categories/index.tsx)
├── category-form.tsx       ❌ REMOVE (replaced by categories/form.tsx)
├── customers.tsx           ❌ REMOVE (replaced by customers/index.tsx)
├── customer-form.tsx       ❌ REMOVE (replaced by customers/form.tsx)
├── products.tsx            ❌ REMOVE (replaced by products/index.tsx)
├── product-form.tsx        ❌ REMOVE (replaced by products/form.tsx)
├── suppliers.tsx           ❌ REMOVE (replaced by suppliers/index.tsx)
└── supplier-form.tsx       ❌ REMOVE (replaced by suppliers/form.tsx)
```

### ✅ **Files to Keep (New Modular Structure):**

```
app/master-data/
├── _layout.tsx             ✅ KEEP (updated navigation)
├── customers/
│   ├── index.tsx           ✅ KEEP (new customer list)
│   └── form.tsx            ✅ KEEP (new customer form)
├── suppliers/
│   ├── index.tsx           ✅ KEEP (new supplier list)
│   └── form.tsx            ✅ KEEP (new supplier form)
├── products/
│   ├── index.tsx           ✅ KEEP (new product list)
│   └── form.tsx            ✅ KEEP (new product form)
└── categories/
    ├── index.tsx           ✅ KEEP (new category list)
    └── form.tsx            ✅ KEEP (new category form)
```

## 🔧 Manual Cleanup Steps

1. **Delete Old Files:**
   - `app/master-data/categories.tsx`
   - `app/master-data/category-form.tsx`
   - `app/master-data/customers.tsx`
   - `app/master-data/customer-form.tsx`
   - `app/master-data/products.tsx`
   - `app/master-data/product-form.tsx`
   - `app/master-data/suppliers.tsx`
   - `app/master-data/supplier-form.tsx`

2. **Verify New Structure Works:**
   - Test navigation from dashboard
   - Test all CRUD operations
   - Verify forms work correctly

## 🚨 **Important Notes:**

- **DO NOT** delete the new modular files in subfolders
- **DO NOT** delete `_layout.tsx` (it's been updated)
- **DO NOT** delete any files in `components/masterdata/`
- The old files are completely replaced by the new structure

## ✅ **After Cleanup:**

Your structure will be clean and production-ready:

```
app/master-data/
├── _layout.tsx
├── customers/
│   ├── index.tsx
│   └── form.tsx
├── suppliers/
│   ├── index.tsx
│   └── form.tsx
├── products/
│   ├── index.tsx
│   └── form.tsx
└── categories/
    ├── index.tsx
    └── form.tsx
```

## 🎯 **Benefits After Cleanup:**

- ✅ Clean, organized codebase
- ✅ No duplicate files
- ✅ Production-ready structure
- ✅ Easy to maintain and extend
- ✅ Follows React Native best practices
