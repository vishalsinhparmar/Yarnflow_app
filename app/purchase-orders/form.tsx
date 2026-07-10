import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
// Alert kept only for destructive confirm dialogs (delete/discard)
// Using TouchableOpacity with Modal for better production compatibility
import SearchableModal from "@/components/SearchableModal";
import { useToast } from "@/components/ui/Toast";
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from "@/constants/colors";
import DatePickerInput from "../../components/DatePickerInput";
import {
    categoryAPI,
    productAPI,
    subProductAPI,
    supplierAPI,
    unitAPI,
} from "../../services/masterDataAPI.js";
import { purchaseOrderAPI } from "../../services/purchaseOrderAPI.js";

interface FormData {
  supplier: string;
  category: string;
  expectedDeliveryDate: string;
  items: POItem[];
  notes: string;
}

interface POItem {
  product: string;
  productName: string;
  subProduct?: string;
  subProductName?: string;
  subProductWeights?: number[];
  quantity: number;
  unit: string;
  weight: number;
  notes: string;
}

interface Supplier {
  _id: string;
  companyName: string;
}

interface Category {
  _id: string;
  categoryName: string;
  hasSubProducts?: boolean;
}

interface Product {
  _id: string;
  productName: string;
  productCode?: string;
  category: string;
  subProducts?: any[];
}

export default function PurchaseOrderForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;
  const toast = useToast();

  const [formData, setFormData] = useState<FormData>({
    supplier: "",
    category: "",
    expectedDeliveryDate: "",
    items: [
      {
        product: "",
        productName: "",
        quantity: 1,
        unit: "Bags",
        weight: 0,
        notes: "",
      },
    ],
    notes: "",
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierHasMore, setSupplierHasMore] = useState(false);
  const [supplierLoadingMore, setSupplierLoadingMore] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const supplierSearchRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSearchRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal states for custom pickers
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSubProductModal, setShowSubProductModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUnitManagementModal, setShowUnitManagementModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [subProductsMap, setSubProductsMap] = useState<Record<string, any[]>>({});
  const [loadingSubProducts, setLoadingSubProducts] = useState<Record<string, boolean>>({});
  const [newSubProductNames, setNewSubProductNames] = useState<Record<string, string>>({});
  const [loadingAddSubProduct, setLoadingAddSubProduct] = useState<Record<string, boolean>>({});

  // Dynamic units from backend with defaults as fallback
  const defaultUnits = [
    { label: "Bags", value: "Bags" },
    { label: "Kg", value: "Kg" },
    { label: "Tons", value: "Tons" },
    { label: "Pieces", value: "Pieces" },
    { label: "Rolls", value: "Rolls" },
    { label: "Meters", value: "Meters" },
  ];
  const [units, setUnits] = useState(defaultUnits);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Unit management CRUD states
  const [newUnitName, setNewUnitName] = useState('');
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [unitActionLoading, setUnitActionLoading] = useState(false);
  const [backendUnits, setBackendUnits] = useState<any[]>([]);
  const prevCategoryRef = React.useRef<string>("");

  // SearchableModal is used for all picker modals (supplier, category, product, unit)

  useEffect(() => {
    const initializeForm = async () => {
      // First load all dropdown data
      await loadDropdownData();
      await loadUnits();

      // Then load PO data if in edit mode (after products are loaded)
      if (isEditMode) {
        await loadPurchaseOrder();
      } else {
        // For new PO, mark initial load as complete immediately
        setInitialLoadComplete(true);
      }
    };

    initializeForm();
  }, []);

  useEffect(() => {
    if (formData.category && products.length > 0) {
      // Filter products by selected category
      const categoryProducts = products.filter(
        (p) =>
          p.category === formData.category ||
          (typeof p.category === "object" &&
            (p.category as any)._id === formData.category),
      );

      console.log("Category selected:", formData.category);
      console.log("Total products:", products.length);
      console.log("Filtered products:", categoryProducts.length);

      setFilteredProducts(categoryProducts);

      // Only clear product selections when the user actually changes the category
      // (not on initial load or when initialLoadComplete transitions)
      const prevCategory = prevCategoryRef.current;
      if (prevCategory && prevCategory !== formData.category && initialLoadComplete) {
        const updatedItems = formData.items.map((item) => ({
          ...item,
          product: "",
          productName: "",
        }));

        if (JSON.stringify(updatedItems) !== JSON.stringify(formData.items)) {
          setFormData((prev) => ({
            ...prev,
            items: updatedItems,
          }));
        }
      }
      prevCategoryRef.current = formData.category;
    } else {
      setFilteredProducts([]);
    }
  }, [formData.category, products, initialLoadComplete]);

  const PO_PAGE_LIMIT = 50;

  const loadDropdownData = async () => {
    try {
      const [suppliersRes, categoriesRes, productsRes] = await Promise.all([
        supplierAPI.getAll({ limit: PO_PAGE_LIMIT, page: 1 }),
        categoryAPI.getAll(),
        productAPI.getAll({ limit: 500 }),
      ]);

      if (suppliersRes?.success) {
        setSuppliers(suppliersRes.data || []);
        const pagination = suppliersRes.pagination;
        const hasMore = pagination ? 1 < pagination.pages : (suppliersRes.data || []).length === PO_PAGE_LIMIT;
        setSupplierHasMore(hasMore);
        setSupplierPage(1);
      }
      if (categoriesRes?.success) setCategories(categoriesRes.data || []);
      if (productsRes?.success) setProducts(productsRes.data || []);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
      toast.showToast('error', 'Load Failed', 'Failed to load form data');
    }
  };

  const handleSupplierSearch = (query: string) => {
    if (supplierSearchRef.current) clearTimeout(supplierSearchRef.current);
    supplierSearchRef.current = setTimeout(async () => {
      setLoadingSuppliers(true);
      setSupplierSearchQuery(query);
      try {
        const res = await supplierAPI.getAll({ limit: PO_PAGE_LIMIT, page: 1, search: query });
        if (res?.success) {
          setSuppliers(res.data || []);
          const pagination = res.pagination;
          const hasMore = pagination ? 1 < pagination.pages : (res.data || []).length === PO_PAGE_LIMIT;
          setSupplierHasMore(hasMore);
          setSupplierPage(1);
        }
      } catch (e) {
        console.error('Supplier search error:', e);
      } finally {
        setLoadingSuppliers(false);
      }
    }, 300);
  };

  const handleSupplierLoadMore = async () => {
    if (supplierLoadingMore || !supplierHasMore) return;
    setSupplierLoadingMore(true);
    try {
      const nextPage = supplierPage + 1;
      const res = await supplierAPI.getAll({ limit: PO_PAGE_LIMIT, page: nextPage, search: supplierSearchQuery });
      if (res?.success) {
        setSuppliers(prev => [...prev, ...(res.data || [])]);
        const pagination = res.pagination;
        const hasMore = pagination ? nextPage < pagination.pages : (res.data || []).length === PO_PAGE_LIMIT;
        setSupplierHasMore(hasMore);
        setSupplierPage(nextPage);
      }
    } catch (e) {
      console.error('Supplier load more error:', e);
    } finally {
      setSupplierLoadingMore(false);
    }
  };

  const handleProductSearch = (query: string) => {
    if (productSearchRef.current) clearTimeout(productSearchRef.current);
    productSearchRef.current = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const params: any = { limit: 100, search: query };
        if (formData.category) params.category = formData.category;
        const res = await productAPI.getAll(params);
        if (res?.success) setFilteredProducts(res.data || []);
      } catch (e) {
        console.error('Product search error:', e);
      } finally {
        setLoadingProducts(false);
      }
    }, 300);
  };

  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      const response = await unitAPI.getAll();
      if (response?.success && response?.data && response.data.length > 0) {
        setBackendUnits(response.data);
        const mappedUnits = response.data.map((unit: any) => ({
          label: unit.name || unit.unitName,
          value: unit.name || unit.unitName,
        }));
        setUnits(mappedUnits);
      }
    } catch (err) {
      console.error("Error loading units:", err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleAddUnit = async () => {
    const trimmed = newUnitName.trim();
    if (!trimmed) {
      toast.showToast('warning', 'Validation', 'Please enter a unit name');
      return;
    }
    if (units.some((u) => u.label.toLowerCase() === trimmed.toLowerCase())) {
      toast.showToast('warning', 'Duplicate', 'This unit already exists');
      return;
    }
    try {
      setUnitActionLoading(true);
      const response = await unitAPI.create({ name: trimmed });
      if (response?.success) {
        setNewUnitName('');
        await loadUnits();
        toast.showToast('success', 'Unit Added', `"${trimmed}" added successfully`);
      } else {
        toast.showToast('error', 'Error', response?.message || 'Failed to create unit');
      }
    } catch (err: any) {
      toast.showToast('error', 'Error', err.message || 'Failed to create unit');
    } finally {
      setUnitActionLoading(false);
    }
  };

  const handleUpdateUnit = async () => {
    const trimmed = editUnitName.trim();
    if (!trimmed) {
      toast.showToast('warning', 'Validation', 'Please enter a unit name');
      return;
    }
    if (!editingUnit) return;
    try {
      setUnitActionLoading(true);
      const response = await unitAPI.update(editingUnit._id, { name: trimmed });
      if (response?.success) {
        setEditingUnit(null);
        setEditUnitName('');
        await loadUnits();
        toast.showToast('success', 'Unit Updated', 'Unit updated successfully');
      } else {
        toast.showToast('error', 'Error', response?.message || 'Failed to update unit');
      }
    } catch (err: any) {
      toast.showToast('error', 'Error', err.message || 'Failed to update unit');
    } finally {
      setUnitActionLoading(false);
    }
  };

  const handleDeleteUnit = (unit: any) => {
    Alert.alert(
      'Delete Unit',
      `Are you sure you want to delete "${unit.name || unit.unitName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnitActionLoading(true);
              const response = await unitAPI.delete(unit._id);
              if (response?.success) {
                await loadUnits();
                toast.showToast('success', 'Unit Deleted', 'Unit removed successfully');
              } else {
                toast.showToast('error', 'Error', response?.message || 'Failed to delete unit');
              }
            } catch (err: any) {
              toast.showToast('error', 'Error', err.message || 'Failed to delete unit');
            } finally {
              setUnitActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const loadPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderAPI.getById(id as string);
      if (response?.success) {
        const po = response.data;
        setFormData({
          supplier: po.supplier?._id || po.supplier || "",
          category: po.category?._id || po.category || "",
          expectedDeliveryDate: po.expectedDeliveryDate
            ? new Date(po.expectedDeliveryDate).toISOString().split("T")[0]
            : "",
          items: po.items?.map((item: any) => {
            const productId = item.product?._id || item.product || "";
            const productName = item.productName || item.product?.productName || item.product?.name || "";
            console.log("📦 PO Item loaded:", { productId, productName, rawProduct: item.product });
            const savedWeights = Array.isArray(item.subProductWeights)
              ? item.subProductWeights.map((w: any) => Number(w) || 0)
              : [];
            return {
              product: productId,
              productName: productName,
              subProduct: item.subProduct?._id || item.subProduct || "",
              subProductName: item.subProductName || item.subProduct?.name || "",
              subProductWeights: savedWeights,
              quantity: item.quantity || 1,
              unit: item.unit || "Bags",
              weight: item.weight || 0,
              notes: item.notes || "",
            };
          }) || [
            {
              product: "",
              productName: "",
              subProduct: "",
              subProductName: "",
              quantity: 1,
              unit: "Bags",
              weight: 0,
              notes: "",
            },
          ],
          notes: po.notes || "",
        });
        // Pre-load sub-products for all items that have a product
        const productIds = (po.items || [])
          .map((item: any) => item.product?._id || item.product)
          .filter(Boolean);
        const uniqueIds = [...new Set(productIds)] as string[];
        uniqueIds.forEach(pid => loadSubProductsForProduct(pid, true));
        // Mark initial load as complete after a short delay to allow state to settle
        setTimeout(() => setInitialLoadComplete(true), 500);
      }
    } catch (err) {
      console.error("Error loading PO:", err);
      toast.showToast('error', 'Load Failed', 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.supplier) {
      newErrors.supplier = "Supplier is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.expectedDeliveryDate) {
      const deliveryDate = new Date(formData.expectedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        newErrors.expectedDeliveryDate = "Delivery date cannot be in the past";
      }
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    formData.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`item_${index}_product`] = "Product is required";
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = "Valid quantity is required";
      }
      if (!item.weight || item.weight <= 0) {
        newErrors[`item_${index}_weight`] = "Valid weight is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.showToast('warning', 'Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        supplier: formData.supplier,
        category: formData.category,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        items: formData.items.map((item) => ({
          product: item.product,
          productName: item.productName || undefined,
          ...(item.subProduct ? {
            subProduct: item.subProduct,
            subProductName: item.subProductName,
            subProductWeights: (item.subProductWeights || []).filter(w => w > 0),
          } : {}),
          quantity: Number(item.quantity),
          unit: item.unit,
          weight: Number(item.weight),
          notes: item.notes || undefined,
        })),
        notes: formData.notes || undefined,
      };

      if (isEditMode) {
        await purchaseOrderAPI.update(id as string, submitData);
        toast.showToast('success', 'PO Updated', 'Purchase order updated successfully');
        setTimeout(() => router.back(), 800);
      } else {
        await purchaseOrderAPI.create(submitData);
        toast.showToast('success', 'PO Created', 'Purchase order created successfully');
        setTimeout(() => router.back(), 800);
      }
    } catch (err: any) {
      console.error("Error saving PO:", err);
      toast.showToast('error', 'Save Failed', err.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const categoryHasSubProducts = !!categories.find(c => c._id === formData.category)?.hasSubProducts;

  const loadSubProductsForProduct = async (productId: string, force = false) => {
    if (!productId) return;
    if (!force && subProductsMap[productId] !== undefined) return;
    setLoadingSubProducts(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await subProductAPI.getByProduct(productId);
      if (response?.success && Array.isArray(response.data)) {
        setSubProductsMap(prev => ({ ...prev, [productId]: response.data }));
      } else {
        setSubProductsMap(prev => ({ ...prev, [productId]: [] }));
      }
    } catch (err) {
      console.error('Error loading sub-products:', err);
      setSubProductsMap(prev => ({ ...prev, [productId]: [] }));
    } finally {
      setLoadingSubProducts(prev => ({ ...prev, [productId]: false }));
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: "",
          productName: "",
          subProduct: "",
          subProductName: "",
          subProductWeights: [],
          quantity: 1,
          unit: "Bags",
          weight: 0,
          notes: "",
        },
      ],
    }));
  };

  const addSubProductRow = (baseIndex: number) => {
    const baseItem = formData.items[baseIndex];
    const newRow: POItem = {
      product: baseItem.product,
      productName: baseItem.productName,
      subProduct: '',
      subProductName: '',
      subProductWeights: [],
      quantity: 1,
      unit: baseItem.unit,
      weight: 0,
      notes: '',
    };
    const updated = [...formData.items];
    updated.splice(baseIndex + 1, 0, newRow);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleSubProductWeightsChange = (index: number, weights: number[]) => {
    const total = weights.reduce((sum, w) => sum + (Number(w) || 0), 0);
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, subProductWeights: weights, weight: total } : item
      ),
    }));
  };

  const handleAddSubProductForProduct = async (productId: string) => {
    const name = (newSubProductNames[productId] || '').trim();
    if (!name || !productId) return;
    setLoadingAddSubProduct(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await subProductAPI.bulkAdd(productId, [name]);
      if (response?.success) {
        const created = Array.isArray(response.data) ? response.data : [];
        setSubProductsMap(prev => ({
          ...prev,
          [productId]: [...(prev[productId] || []), ...created],
        }));
        setProducts(prev => prev.map(p => {
          if (p._id !== productId) return p;
          const existing = Array.isArray(p.subProducts) ? p.subProducts : [];
          return { ...p, subProducts: [...existing, ...created] };
        }));
        setNewSubProductNames(prev => ({ ...prev, [productId]: '' }));
        toast.showToast('success', 'Sub-Product Added', `"${name}" added to product.`);
      } else {
        throw new Error(response?.message || 'Failed to add sub-product');
      }
    } catch (error: any) {
      console.error('Error adding sub-product:', error);
      toast.showToast('error', 'Add Failed', error.message || 'Failed to add sub-product');
    } finally {
      setLoadingAddSubProduct(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const item = formData.items[index];
    if (categoryHasSubProducts && item.subProduct) {
      const count = qty === 0 ? 0 : Math.max(1, qty || 1);
      const current = Array.isArray(item.subProductWeights) ? item.subProductWeights : [];
      const next = Array.from({ length: count }, (_, i) => i < current.length ? current[i] : 0);
      const total = next.reduce((s, w) => s + (Number(w) || 0), 0);
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((it, i) =>
          i === index ? { ...it, quantity: count, subProductWeights: next, weight: total } : it
        ),
      }));
    } else {
      updateItem(index, 'quantity', qty);
    }
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItemWithSubProduct = (index: number, productId: string, productName: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, product: productId, productName, subProduct: '', subProductName: '', subProductWeights: [] } : item
      ),
    }));
    loadSubProductsForProduct(productId, true);
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));

    // Clear error when user starts typing
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const renderItem = (item: POItem, index: number) => (
    <View key={index} style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Item {index + 1}</Text>
        {formData.items.length > 1 && (
          <TouchableOpacity
            onPress={() => removeItem(index)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Product Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Product *</Text>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            errors[`item_${index}_product`] && styles.inputError,
            !formData.category && styles.disabledPicker,
          ]}
          onPress={() => {
            if (!formData.category) {
              toast.showToast('warning', 'Category Required', 'Please select a category first to see available products.');
              return;
            }
            if (filteredProducts.length === 0) {
              toast.showToast('info', 'No Products', 'No products available for the selected category.');
              return;
            }
            setSelectedItemIndex(index);
            setShowProductModal(true);
          }}

          disabled={!formData.category}
        >
          <Text
            style={[
              styles.pickerButtonText,
              !item.product && styles.placeholderText,
              !formData.category && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {!formData.category
              ? "Select category first"
              : item.product && item.productName
                ? item.productName
                : item.product
                  ? filteredProducts.find((p) => p._id === item.product)
                      ?.productName ||
                    products.find((p) => p._id === item.product)?.productName ||
                    "Loading..."
                  : filteredProducts.length === 0
                    ? "No products available"
                    : "Select Product"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={!formData.category ? COLORS.gray400 : COLORS.gray500}
          />
        </TouchableOpacity>
        {errors[`item_${index}_product`] && (
          <Text style={styles.errorText}>
            {errors[`item_${index}_product`]}
          </Text>
        )}
        {formData.category && filteredProducts.length === 0 && (
          <Text style={styles.infoText}>
            No products found for selected category. Please add products to this
            category first.
          </Text>
        )}
      </View>

      {/* Sub-Product Selection — only for categories with hasSubProducts */}
      {categoryHasSubProducts && item.product && (
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.label}>Sub-Product</Text>
            {loadingSubProducts[item.product] && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </View>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setSelectedItemIndex(index);
              setShowSubProductModal(true);
            }}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !item.subProduct && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {item.subProductName || 'Select Sub-Product (optional)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
          {item.subProduct ? (
            <TouchableOpacity
              onPress={() => setFormData(prev => ({
                ...prev,
                items: prev.items.map((it, i) =>
                  i === index ? { ...it, subProduct: '', subProductName: '', subProductWeights: [] } : it
                ),
              }))}
            >
              <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>✕ Clear sub-product</Text>
            </TouchableOpacity>
          ) : null}

          {/* Inline new sub-product creation for this product */}
          <View style={styles.newSubProductRow}>
            <TextInput
              style={styles.newSubProductInput}
              value={newSubProductNames[item.product] || ''}
              onChangeText={(text) => setNewSubProductNames(prev => ({ ...prev, [item.product]: text }))}
              placeholder="New sub-product name"
              placeholderTextColor={COLORS.gray400}
            />
            <TouchableOpacity
              style={[
                styles.newSubProductButton,
                (!newSubProductNames[item.product]?.trim() || loadingAddSubProduct[item.product]) && styles.newSubProductButtonDisabled
              ]}
              onPress={() => handleAddSubProductForProduct(item.product)}
              disabled={!newSubProductNames[item.product]?.trim() || loadingAddSubProduct[item.product]}
            >
              {loadingAddSubProduct[item.product] ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.newSubProductButtonText}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quantity and Unit */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={[
              styles.input,
              errors[`item_${index}_quantity`] && styles.inputError,
            ]}
            value={item.quantity === 0 ? '' : item.quantity.toString()}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned === '') {
                updateItem(index, 'quantity', 0);
              } else {
                handleQuantityChange(index, parseInt(cleaned, 10));
              }
            }}
            onBlur={() => {
              if (!item.quantity || item.quantity <= 0) {
                handleQuantityChange(index, 1);
              }
            }}
            keyboardType="number-pad"
            placeholder="1"
          />
          {errors[`item_${index}_quantity`] && (
            <Text style={styles.errorText}>
              {errors[`item_${index}_quantity`]}
            </Text>
          )}
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <View style={styles.unitLabelRow}>
            <Text style={styles.label}>Unit *</Text>
            <TouchableOpacity
              onPress={() => setShowUnitManagementModal(true)}
              style={styles.manageUnitButton}
            >
              <Ionicons name="settings-outline" size={12} color="#FFF" />
              <Text style={styles.manageUnitText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.pickerButton, styles.unitPickerButton]}
            onPress={() => {
              setSelectedItemIndex(index);
              setShowUnitModal(true);
            }}
          >
            <View style={styles.unitValueContainer}>
              <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
              <Text style={styles.unitPickerText}>
                {item.unit || "Select Unit"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight — per-unit when sub-product selected, single when not */}
      {categoryHasSubProducts && item.subProduct ? (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Per-Unit Weights (Kg) *</Text>
          <Text style={{ fontSize: 11, color: COLORS.gray500, marginBottom: 6 }}>
            Enter weight for each of the {item.quantity || '?'} unit{(item.quantity || 0) > 1 ? 's' : ''}
          </Text>
          {Array.from({ length: Math.max(0, item.quantity || 0) }).map((_, unitIdx) => (
            <View key={unitIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, color: COLORS.gray600, width: 64 }}>Unit {unitIdx + 1}</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={((item.subProductWeights || [])[unitIdx] ?? 0).toString()}
                onChangeText={(text) => {
                  const weights = [...(item.subProductWeights || Array(item.quantity).fill(0))];
                  weights[unitIdx] = parseFloat(text) || 0;
                  handleSubProductWeightsChange(index, weights);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
            <Text style={{ fontSize: 12, color: COLORS.gray600 }}>
              Total: <Text style={{ fontWeight: '600', color: COLORS.gray900 }}>{item.weight.toFixed(2)} Kg</Text>
            </Text>
          </View>
          {errors[`item_${index}_weight`] && (
            <Text style={styles.errorText}>{errors[`item_${index}_weight`]}</Text>
          )}
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight (Kg) *</Text>
          <TextInput
            style={[
              styles.input,
              errors[`item_${index}_weight`] && styles.inputError,
              categoryHasSubProducts && item.subProduct ? { backgroundColor: '#F3F4F6' } : {},
            ]}
            value={item.weight.toString()}
            onChangeText={(text) => updateItem(index, "weight", parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0"
            editable={!(categoryHasSubProducts && item.subProduct)}
          />
          {errors[`item_${index}_weight`] && (
            <Text style={styles.errorText}>{errors[`item_${index}_weight`]}</Text>
          )}
        </View>
      )}

      {/* Item Notes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Item Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={item.notes}
          onChangeText={(text) => updateItem(index, "notes", text)}
          placeholder="Special instructions for this item..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Add Sub-Product Row — only for categories with sub-products */}
      {categoryHasSubProducts && item.product && (
        <TouchableOpacity
          style={styles.addSubProductRowButton}
          onPress={() => addSubProductRow(index)}
        >
          <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.addSubProductRowText}>Add Sub-Product Row</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && isEditMode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading purchase order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Supplier */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                errors.supplier && styles.inputError,
              ]}
              onPress={() => setShowSupplierModal(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.supplier && styles.placeholderText,
                ]}
              >
                {formData.supplier
                  ? suppliers.find((s) => s._id === formData.supplier)
                      ?.companyName || "Select Supplier"
                  : "Select Supplier"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {errors.supplier && (
              <Text style={styles.errorText}>{errors.supplier}</Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                errors.category && styles.inputError,
              ]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.category && styles.placeholderText,
                ]}
              >
                {formData.category
                  ? categories.find((c) => c._id === formData.category)
                      ?.categoryName || "Select Category"
                  : "Select Category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
            {formData.category && (
              <Text style={styles.infoText}>
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} available in this
                category
              </Text>
            )}
          </View>

          {/* Expected Delivery Date */}
          <DatePickerInput
            label="Expected Delivery Date"
            value={formData.expectedDeliveryDate}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, expectedDeliveryDate: date }))
            }
            placeholder="Select delivery date"
            minimumDate={new Date()}
          />
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => renderItem(item, index))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, notes: text }))
            }
            placeholder="Additional notes or instructions..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? "Update Purchase Order" : "Create Purchase Order"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Searchable Picker Modals */}
      <SearchableModal
        visible={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Select Supplier"
        options={suppliers}
        selectedValue={formData.supplier}
        onSelect={(value: string) => {
          setFormData((prev) => ({ ...prev, supplier: value }));
          if (errors.supplier) setErrors((prev: any) => ({ ...prev, supplier: "" }));
        }}
        getLabel={(s) => s.companyName}
        getValue={(s) => s._id}
        getSubtitle={(s) => s.city || undefined}
        searchPlaceholder="Search suppliers by name..."
        emptyMessage="No suppliers found"
        onSearch={handleSupplierSearch}
        loading={loadingSuppliers}
        onLoadMore={handleSupplierLoadMore}
        loadingMore={supplierLoadingMore}
        hasMore={supplierHasMore}
      />

      <SearchableModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
        options={categories}
        selectedValue={formData.category}
        onSelect={(value: string) => {
          setFormData((prev) => ({ ...prev, category: value }));
          if (errors.category) setErrors((prev: any) => ({ ...prev, category: "" }));
        }}
        getLabel={(c) => c.categoryName}
        getValue={(c) => c._id}
        searchPlaceholder="Search categories..."
        emptyMessage="No categories found"
      />

      <SearchableModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Select Product"
        options={filteredProducts}
        selectedValue={formData.items[selectedItemIndex]?.product || ""}
        onSelect={(value: string, item: any) => {
          if (value) {
            updateItemWithSubProduct(selectedItemIndex, value, item?.productName || '');
          }
        }}
        getLabel={(p) => p.productName}
        getValue={(p) => p._id}
        searchPlaceholder="Search products..."
        emptyMessage={!formData.category ? "Select a category first" : "No products found for this category"}
        onSearch={handleProductSearch}
        loading={loadingProducts}
      />

      <SearchableModal
        visible={showSubProductModal}
        onClose={() => setShowSubProductModal(false)}
        title="Select Sub-Product"
        options={subProductsMap[formData.items[selectedItemIndex]?.product] || []}
        selectedValue={formData.items[selectedItemIndex]?.subProduct || ""}
        onSelect={(value: string, sp: any) => {
          const qty = formData.items[selectedItemIndex]?.quantity || 1;
          const weights = Array.from({ length: qty }, () => 0);
          setFormData(prev => ({
            ...prev,
            items: prev.items.map((it, i) =>
              i === selectedItemIndex
                ? { ...it, subProduct: value, subProductName: sp?.name || '', subProductWeights: weights, weight: 0 }
                : it
            ),
          }));
          setShowSubProductModal(false);
        }}
        getLabel={(sp) => sp.name}
        getValue={(sp) => sp._id}
        searchPlaceholder="Search sub-products..."
        emptyMessage={loadingSubProducts[formData.items[selectedItemIndex]?.product] ? 'Loading...' : 'No sub-products found'}
      />

      <SearchableModal
        visible={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        title="Select Unit"
        options={units}
        selectedValue={formData.items[selectedItemIndex]?.unit || "Bags"}
        onSelect={(value: string) => updateItem(selectedItemIndex, "unit", value)}
        getLabel={(u) => u.label}
        getValue={(u) => u.value}
        searchPlaceholder="Search units..."
        emptyMessage="No units found"
      />

      {/* Unit Management Modal */}
      <Modal
        visible={showUnitManagementModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowUnitManagementModal(false);
          setEditingUnit(null);
          setEditUnitName('');
          setNewUnitName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg, maxHeight: '85%', minHeight: '50%', flexDirection: 'column' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Units</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowUnitManagementModal(false);
                  setEditingUnit(null);
                  setEditUnitName('');
                  setNewUnitName('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.unitModalBody} showsVerticalScrollIndicator={false}>
              {/* Add New Unit */}
              <View style={styles.unitAddSection}>
                <Text style={styles.unitSectionLabel}>Add New Unit</Text>
                <View style={styles.unitAddRow}>
                  <TextInput
                    style={styles.unitAddInput}
                    value={newUnitName}
                    onChangeText={setNewUnitName}
                    placeholder="Enter unit name (e.g. Meters)"
                    placeholderTextColor={COLORS.gray400}
                    editable={!unitActionLoading}
                  />
                  <TouchableOpacity
                    style={[
                      styles.unitAddButton,
                      (!newUnitName.trim() || unitActionLoading) && { opacity: 0.5 },
                    ]}
                    onPress={handleAddUnit}
                    disabled={!newUnitName.trim() || unitActionLoading}
                  >
                    {unitActionLoading && !editingUnit ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="add" size={22} color="#FFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Units List */}
              <View style={styles.unitListSection}>
                <View style={styles.unitListHeader}>
                  <Text style={styles.unitSectionLabel}>
                    Available Units ({backendUnits.length})
                  </Text>
                  <TouchableOpacity
                    onPress={loadUnits}
                    disabled={loadingUnits}
                    style={styles.unitRefreshButton}
                  >
                    {loadingUnits ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons name="refresh" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>

                {backendUnits.length === 0 && !loadingUnits && (
                  <View style={styles.unitEmptyState}>
                    <Ionicons name="cube-outline" size={40} color={COLORS.gray300} />
                    <Text style={styles.unitEmptyText}>No units found</Text>
                  </View>
                )}

                {backendUnits.map((unit: any) => {
                  const unitName = unit.name || unit.unitName;
                  const isEditing = editingUnit?._id === unit._id;

                  return (
                    <View key={unit._id} style={styles.unitListItem}>
                      {isEditing ? (
                        <View style={styles.unitEditRow}>
                          <TextInput
                            style={styles.unitEditInput}
                            value={editUnitName}
                            onChangeText={setEditUnitName}
                            autoFocus
                            editable={!unitActionLoading}
                          />
                          <TouchableOpacity
                            style={styles.unitSaveButton}
                            onPress={handleUpdateUnit}
                            disabled={unitActionLoading || !editUnitName.trim()}
                          >
                            {unitActionLoading ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <Ionicons name="checkmark" size={18} color="#FFF" />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.unitCancelButton}
                            onPress={() => {
                              setEditingUnit(null);
                              setEditUnitName('');
                            }}
                          >
                            <Ionicons name="close" size={18} color={COLORS.gray600} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.unitItemRow}>
                          <View style={styles.unitItemLeft}>
                            <View style={styles.unitItemIcon}>
                              <Ionicons name="cube-outline" size={16} color={COLORS.primary} />
                            </View>
                            <Text style={styles.unitItemText}>{unitName}</Text>
                          </View>
                          <View style={styles.unitItemActions}>
                            <TouchableOpacity
                              style={styles.unitEditButton}
                              onPress={() => {
                                setEditingUnit(unit);
                                setEditUnitName(unitName);
                              }}
                            >
                              <Ionicons name="pencil" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.unitDeleteButton}
                              onPress={() => handleDeleteUnit(unit)}
                            >
                              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Close Button */}
            <View style={styles.unitModalFooter}>
              <TouchableOpacity
                style={styles.unitCloseModalButton}
                onPress={() => {
                  setShowUnitManagementModal(false);
                  setEditingUnit(null);
                  setEditUnitName('');
                  setNewUnitName('');
                }}
              >
                <Text style={styles.unitCloseModalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gray900,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gray900,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemContainer: {
    backgroundColor: COLORS.gray50,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gray900,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  addItemText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  submitContainer: {
    padding: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.small,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.gray600,
  },
  // Custom Picker Styles
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.gray900,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.gray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gray900,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.gray900,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  disabledPicker: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  disabledText: {
    color: COLORS.gray400,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.info,
    marginTop: SPACING.xs,
    fontStyle: "italic",
  },
  unitLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  manageUnitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  manageUnitText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "600",
  },
  unitPickerButton: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: "#F0F9FF",
  },
  unitValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  unitPickerText: {
    fontSize: 15,
    color: COLORS.gray900,
    fontWeight: "600",
  },
  // Unit Management Modal Styles
  unitModalBody: {
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: SPACING.lg,
  },
  unitAddSection: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  unitSectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  unitAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  unitAddInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  unitAddButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  unitListSection: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  unitListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  unitRefreshButton: {
    padding: SPACING.xs,
  },
  unitEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  unitEmptyText: {
    fontSize: 14,
    color: COLORS.gray400,
    marginTop: SPACING.sm,
  },
  unitListItem: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    overflow: "hidden",
  },
  unitItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  unitItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  unitItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight || "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  unitItemText: {
    fontSize: 15,
    color: COLORS.gray900,
    fontWeight: "500",
  },
  unitItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  unitEditButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight || "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  unitDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  unitEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  unitEditInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  unitSaveButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  unitCancelButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  unitModalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  unitCloseModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  unitCloseModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  addSubProductRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: SPACING.xs,
    gap: 6,
  },
  addSubProductRowText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  newSubProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  newSubProductInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  newSubProductButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#10B981',
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  newSubProductButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  newSubProductButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
});
