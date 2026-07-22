import DatePickerInput from "@/components/DatePickerInput";
import SearchableModal from "@/components/SearchableModal";
import { useToast } from "@/components/ui/Toast";
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { apiRequest } from "../../services/common";
import { inventoryAPI } from "../../services/inventoryAPI";
import { salesOrderAPI } from "../../services/salesOrderAPI";

export default function SalesOrderForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerHasMore, setCustomerHasMore] = useState(false);
  const [customerLoadingMore, setCustomerLoadingMore] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryHasMore, setCategoryHasMore] = useState(false);
  const [categoryLoadingMore, setCategoryLoadingMore] = useState(false);
  const [categoriesWithInventory, setCategoriesWithInventory] = useState<Set<string>>(new Set());

  const [products, setProducts] = useState<any[]>([]);
  const [showSubProductModal, setShowSubProductModal] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    expectedDeliveryDate: "",
    category: "",
    categoryName: "",
    items: [
      {
        product: "",
        productName: "",
        productCode: "",
        subProduct: "",
        subProductName: "",
        quantity: "",
        unit: "",
        weight: "",
        subProductWeights: [] as number[],
        availableWeights: [] as number[],
        selectedWeightIndices: [] as number[],
        notes: "",
        availableStock: 0,
        totalProductWeight: 0,
        productStock: 0,
      },
    ],
  });

  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);  
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const prevCategoryRef = useRef<string>("");
  const toast = useToast();

  useEffect(() => {
    const initializeForm = async () => {
      await loadCustomers();
      await loadCategories();
      if (isEditMode) {
        await loadSalesOrder();
      } else {
        setInitialLoadComplete(true);
      }
    };
    initializeForm();
  }, []);

  useEffect(() => {
    if (formData.category) {
      loadProducts(formData.category);
      // Only clear product selections when the user actually changes the category
      const prevCategory = prevCategoryRef.current;
      if (prevCategory && prevCategory !== formData.category && initialLoadComplete) {
        const updatedItems = formData.items.map((item) => ({
          ...item,
          product: "",
          productName: "",
          unit: "",
          availableStock: 0,
        }));
        setFormData((prev: any) => ({ ...prev, items: updatedItems }));
      }
      prevCategoryRef.current = formData.category;
    } else {
      setProducts([]);
      setInventoryProducts([]);
      setSubProductOptionsMap({});
    }
  }, [formData.category]);

  const PAGE_LIMIT = 50;

  const loadCustomers = async (search = '', page = 1, append = false) => {
    try {
      if (append) setCustomerLoadingMore(true);
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await apiRequest(`/master-data/customers?limit=${PAGE_LIMIT}&page=${page}${q}`);
      if (response?.success) {
        const data = response.data || [];
        if (append) {
          setCustomers(prev => [...prev, ...data]);
        } else {
          setCustomers(data);
        }
        const pagination = response.pagination;
        const hasMore = pagination ? page < pagination.pages : data.length === PAGE_LIMIT;
        setCustomerHasMore(hasMore);
        setCustomerPage(page);
        setCustomerSearch(search);
      }
    } catch (err: any) {
      console.error("Error loading customers:", err);
      if (!append) {
        toast.showToast('error', 'Load Failed', 'Failed to load customers. Please refresh.');
        setCustomers([]);
      }
    } finally {
      setCustomerLoadingMore(false);
    }
  };

  const handleCustomerSearch = (search: string) => {
    loadCustomers(search, 1, false);
  };

  const handleCustomerLoadMore = () => {
    if (!customerLoadingMore && customerHasMore) {
      loadCustomers(customerSearch, customerPage + 1, true);
    }
  };

  const loadCategories = async (search = '', page = 1, append = false) => {
    try {
      if (append) setCategoryLoadingMore(true);
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const [response, invResponse] = await Promise.all([
        apiRequest(`/master-data/categories?limit=${PAGE_LIMIT}&page=${page}${q}`),
        inventoryAPI.getAll({ limit: 500 }).catch(() => null),
      ]);
      if (response?.success) {
        const data = response.data || [];
        const inStockCategoryIds = new Set<string>();
        if (invResponse?.success) {
          const invData = invResponse.data || [];
          invData.forEach((cat: any) => {
            const hasStock = (cat.products || []).some((prod: any) =>
              (prod.currentStock || prod.totalStock || 0) > 0
            );
            if (hasStock && (cat._id || cat.categoryId)) {
              inStockCategoryIds.add(String(cat._id || cat.categoryId));
            }
          });
        }
        setCategoriesWithInventory(inStockCategoryIds);
        const filtered = data.filter((c: any) => inStockCategoryIds.has(String(c._id)));
        if (append) {
          setCategories(prev => [...prev, ...filtered]);
        } else {
          setCategories(filtered);
        }
        const pagination = response.pagination;
        const hasMore = pagination ? page < pagination.pages : data.length === PAGE_LIMIT;
        setCategoryHasMore(hasMore);
        setCategoryPage(page);
      }
    } catch (err: any) {
      console.error("Error loading categories:", err);
      if (!append) {
        toast.showToast('error', 'Load Failed', 'Failed to load categories. Please refresh.');
        setCategories([]);
      }
    } finally {
      setCategoryLoadingMore(false);
    }
  };

  const handleCategorySearch = (search: string) => {
    loadCategories(search, 1, false);
  };

  const handleCategoryLoadMore = () => {
    if (!categoryLoadingMore && categoryHasMore) {
      loadCategories('', categoryPage + 1, true);
    }
  };

  // inventoryProducts: product-level rows (one per product)
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  // subProductOptionsMap: productId -> [{subProductId, subProductName, totalStock, totalWeight, unit}]
  const [subProductOptionsMap, setSubProductOptionsMap] = useState<Record<string, any[]>>({});

  const loadProducts = async (categoryId: string) => {
    try {
      // Use flat=true so server returns a flat product array instead of grouped-by-category
      const response = await inventoryAPI.getAll({ category: categoryId, limit: 500, flat: 'true' });
      if (response?.success) {
        const inventoryData: any[] = response.data || [];
        const productRows: any[] = [];
        const uniqueProducts = new Map<string, any>();

        inventoryData.forEach((prod: any) => {
          const stock = prod.currentStock || prod.totalStock || 0;
          if (stock <= 0) return;
          const productId = String(prod.productId || prod._id);
          if (!uniqueProducts.has(productId)) {
            uniqueProducts.set(productId, {
              _id: productId,
              productName: prod.productName || 'Unknown',
              productCode: prod.productCode || '',
              unit: prod.unit || 'Bags',
              totalStock: stock,
              totalWeight: prod.currentWeight || prod.totalWeight || 0,
              hasSubProducts: prod.hasSubProducts || false,
            });
          }
          productRows.push({
            productId,
            productName: prod.productName || 'Unknown',
            productCode: prod.productCode || '',
            unit: prod.unit || 'Bags',
            totalStock: stock,
            totalWeight: prod.currentWeight || prod.totalWeight || 0,
            hasSubProducts: prod.hasSubProducts || false,
          });
        });

        setInventoryProducts(productRows);
        setProducts(Array.from(uniqueProducts.values()));

        // For products with sub-products, load FIFO breakdown from detail API
        const spMap: Record<string, any[]> = {};
        await Promise.all(
          Array.from(uniqueProducts.values())
            .filter((p: any) => p.hasSubProducts)
            .map(async (p: any) => {
              try {
                const detail = await inventoryAPI.getProductDetail(p._id);
                if (detail?.success && detail?.data?.subProductBreakdown) {
                  spMap[p._id] = detail.data.subProductBreakdown
                    .filter((sp: any) => sp.subProductId && (sp.currentStock || 0) > 0)
                    .map((sp: any) => {
                      // Build availableWeights from all lots FIFO (subProductWeights arrays)
                      const availableWeights: number[] = [];
                      (sp.lots || []).forEach((lot: any) => {
                        (lot.subProductWeights || []).forEach((w: number) => {
                          if (Number(w) > 0) availableWeights.push(Number(w));
                        });
                      });
                      return {
                        subProductId: String(sp.subProductId),
                        subProductName: sp.subProductName,
                        totalStock: sp.currentStock || 0,
                        totalWeight: sp.currentWeight || 0,
                        unit: p.unit,
                        availableWeights,
                      };
                    });
                }
              } catch (e) {
                console.error('Failed to load sub-products for', p._id, e);
              }
            })
        );
        setSubProductOptionsMap(spMap);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      toast.showToast('error', 'Load Failed', 'Failed to load products. Please try again.');
      setProducts([]);
      setInventoryProducts([]);
      setSubProductOptionsMap({});
    }
  };

  const loadSalesOrder = async () => {
    try {
      setLoading(true);
      const response = await salesOrderAPI.getById(id);
      if (response?.success) {
        const so = response.data;
        setFormData({
          customer: so.customer?._id || so.customer || "",
          customerName: so.customer?.companyName || "",
          category: so.category?._id || so.category || "",
          categoryName: so.category?.categoryName || "",
          expectedDeliveryDate: so.expectedDeliveryDate
            ? new Date(so.expectedDeliveryDate).toISOString().split("T")[0]
            : "",
          items: so.items.map((item: any) => ({
            product: item.product?._id || item.product || "",
            productName: item.productName || item.product?.productName || "",
            productCode: item.productCode || item.product?.productCode || "",
            subProduct: item.subProduct?._id || item.subProduct || "",
            subProductName: item.subProductName || "",
            quantity: String(item.quantity || ""),
            unit: item.unit || "",
            weight: String(item.weight || ""),
            subProductWeights: item.subProductWeights || [],
            availableWeights: item.subProductWeights || [],
            selectedWeightIndices: (item.subProductWeights || []).map((_: any, i: number) => i),
            notes: item.notes || "",
            availableStock: 0,
            totalProductWeight: 0,
            productStock: 0,
          })),
        });
        setTimeout(() => setInitialLoadComplete(true), 500);
      }
    } catch (err: any) {
      toast.showToast('error', 'Load Failed', err.message || 'Failed to load sales order');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product: "",
          productName: "",
          productCode: "",
          subProduct: "",
          subProductName: "",
          quantity: "",
          unit: "",
          weight: "",
          subProductWeights: [] as number[],
          notes: "",
          availableStock: 0,
          totalProductWeight: 0,
          productStock: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length === 1) {
      toast.showToast('error', 'Cannot Remove', 'At least one item is required');
      return;
    }
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Group flat items by product so each product card can contain multiple sub-product rows
  const getProductGroups = () => {
    const groups: any[] = [];
    const seen = new Map<string, any>();
    formData.items.forEach((item, index) => {
      const key = item.product || `__empty__${index}`;
      if (!seen.has(key)) {
        const selectedProduct = products.find((p: any) => p._id === item.product);
        seen.set(key, {
          product: item.product,
          productName: item.productName || selectedProduct?.productName || '',
          productCode: item.productCode || selectedProduct?.productCode || '',
          unit: item.unit || selectedProduct?.unit || 'Bags',
          indices: [],
          items: [],
        });
        groups.push(seen.get(key));
      }
      seen.get(key).indices.push(index);
      seen.get(key).items.push(item);
    });
    return groups;
  };

  const emptyItem = {
    product: "",
    productName: "",
    productCode: "",
    subProduct: "",
    subProductName: "",
    quantity: "",
    unit: "",
    weight: "",
    subProductWeights: [] as number[],
    availableWeights: [] as number[],
    selectedWeightIndices: [] as number[],
    notes: "",
    availableStock: 0,
    totalProductWeight: 0,
    productStock: 0,
  };

  const addProductGroup = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem }],
    });
  };

  const removeProductGroup = (group: any) => {
    let remaining = formData.items.filter((_: any, i: number) => !group.indices.includes(i));
    if (remaining.length === 0) {
      remaining = [{ ...emptyItem }];
    }
    setFormData({ ...formData, items: remaining });
  };

  const addSubProductRow = (group: any) => {
    const newItem = {
      ...emptyItem,
      product: group.product,
      productName: group.productName,
      productCode: group.productCode,
      unit: group.unit,
    };
    const insertAt = group.indices[group.indices.length - 1] + 1;
    const updated = [...formData.items];
    updated.splice(insertAt, 0, newItem);
    setFormData({ ...formData, items: updated });
  };

  const removeSubProductRow = (index: number) => {
    if (formData.items.length === 1) {
      toast.showToast('error', 'Cannot Remove', 'At least one item is required');
      return;
    }
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleGroupProductChange = (group: any, productId: string, productName?: string) => {
    const selectedProduct = products.find((p: any) => p._id === productId);
    const spOptions = getSubProductOptions(productId);
    const hasSubProducts = spOptions.length > 0;
    const invRow = !hasSubProducts ? getInventoryRow(productId) : null;
    const updatedItems = [...formData.items];
    group.indices.forEach((i: number) => {
      const existing = updatedItems[i];
      updatedItems[i] = {
        ...existing,
        product: productId || '',
        productName: productName || selectedProduct?.productName || existing.productName || '',
        productCode: selectedProduct?.productCode || existing.productCode || '',
        subProduct: '',
        subProductName: '',
        subProductWeights: [],
        quantity: existing.quantity || '',
        unit: selectedProduct?.unit || existing.unit || 'Bags',
        weight: (existing.subProduct || hasSubProducts) ? '' : existing.weight || '',
        availableStock: invRow?.totalStock || selectedProduct?.totalStock || 0,
        totalProductWeight: invRow?.totalWeight || selectedProduct?.totalWeight || 0,
        productStock: invRow?.totalStock || selectedProduct?.totalStock || 0,
        notes: existing.notes || '',
      };
    });
    setFormData({ ...formData, items: updatedItems });
  };

  // Get sub-product options for a product from inventory detail API results
  const getSubProductOptions = (productId: string) => {
    return subProductOptionsMap[productId] || [];
  };

  // Get inventory row for a specific product (or sub-product combo)
  const getInventoryRow = (productId: string, subProductId?: string) => {
    if (subProductId) {
      const spOptions = subProductOptionsMap[productId] || [];
      return spOptions.find((sp: any) => sp.subProductId === subProductId) || null;
    }
    return inventoryProducts.find(r => r.productId === productId) || null;
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: any,
    productName?: string,
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "product") {
      const selectedProduct = products.find((p: any) => p._id === value);
      if (selectedProduct) {
        newItems[index].productName = productName || selectedProduct.productName;
        newItems[index].productCode = selectedProduct.productCode || '';
        newItems[index].unit = selectedProduct.unit;
        newItems[index].subProduct = "";
        newItems[index].subProductName = "";
        // Check if this product has sub-product rows in inventory
        const spOptions = getSubProductOptions(value);
        if (spOptions.length === 0) {
          // No sub-products — use product-level inventory row
          const invRow = getInventoryRow(value);
          newItems[index].availableStock = invRow?.totalStock || selectedProduct.totalStock;
          newItems[index].totalProductWeight = invRow?.totalWeight || selectedProduct.totalWeight;
          newItems[index].productStock = invRow?.totalStock || selectedProduct.totalStock;
        } else {
          // Has sub-products — stock will be set when sub-product is chosen
          newItems[index].availableStock = 0;
          newItems[index].totalProductWeight = 0;
          newItems[index].productStock = 0;
        }
      }
    }

    if (field === "subProduct") {
      const invRow = getInventoryRow(newItems[index].product, value) as any;
      if (invRow) {
        newItems[index].availableStock = invRow.totalStock;
        newItems[index].totalProductWeight = invRow.totalWeight;
        newItems[index].productStock = invRow.totalStock;
        newItems[index].unit = invRow.unit || newItems[index].unit;
        newItems[index].subProductName = invRow.subProductName || '';
        // Build FIFO available weights from inventory lots
        const availableWeights: number[] = invRow.availableWeights || [];
        newItems[index].availableWeights = availableWeights;
        // Pre-select all bags (mirrors web default)
        const allIndices = availableWeights.map((_: number, i: number) => i);
        newItems[index].selectedWeightIndices = allIndices;
        newItems[index].subProductWeights = availableWeights.slice();
        newItems[index].quantity = String(availableWeights.length);
        newItems[index].weight = String(
          parseFloat(availableWeights.reduce((s: number, w: number) => s + (Number(w) || 0), 0).toFixed(2))
        );
        if (availableWeights.length === 0) {
          newItems[index].quantity = '';
          newItems[index].weight = '';
        }
      } else if (!value) {
        // Clearing sub-product
        newItems[index].availableWeights = [];
        newItems[index].selectedWeightIndices = [];
        newItems[index].subProductWeights = [];
        newItems[index].quantity = '';
        newItems[index].weight = '';
        newItems[index].availableStock = 0;
        newItems[index].totalProductWeight = 0;
        newItems[index].productStock = 0;
      }
    }

    if (field === "quantity") {
      // Quantity is auto-managed by chip selection when a sub-product is active — block manual edit
      if (newItems[index].subProduct) {
        setFormData({ ...formData, items: newItems });
        return;
      }
      const qty = Number(value) || 0;
      const stock = newItems[index].productStock || 0;
      const weight = newItems[index].totalProductWeight || 0;
      if (stock > 0 && qty > 0) {
        const wpu = weight / stock;
        newItems[index].weight = String((qty * wpu).toFixed(2));
      } else {
        newItems[index].weight = '';
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const validateForm = () => {
    if (!formData.customer) {
      toast.showToast('error', 'Validation Error', 'Please select a customer');
      return false;
    }
    if (!formData.category) {
      toast.showToast('error', 'Validation Error', 'Please select a category');
      return false;
    }
    if (formData.expectedDeliveryDate) {
      const deliveryDate = new Date(formData.expectedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        toast.showToast('error', 'Invalid Date', 'Expected delivery date cannot be in the past');
        return false;
      }
    }
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product) {
        toast.showToast('error', 'Missing Product', `Please select a product for item ${i + 1}`);
        return false;
      }
      const spOptions = getSubProductOptions(item.product);
      if (spOptions.length > 0 && !item.subProduct) {
        toast.showToast('error', 'Missing Sub-Product', `Item ${i + 1}: Please select a sub-product (this product has variants with stock)`);
        return false;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.showToast('error', 'Invalid Quantity', `Please enter a valid quantity for item ${i + 1}`);
        return false;
      }
      if (item.availableStock > 0 && Number(item.quantity) > item.availableStock) {
        toast.showToast('error', 'Insufficient Stock', `Item ${i + 1}: Requested ${item.quantity} but only ${item.availableStock} ${item.unit} available`);
        return false;
      }
      if (item.totalProductWeight > 0 && Number(item.weight) > item.totalProductWeight) {
        toast.showToast('error', 'Insufficient Weight', `Item ${i + 1}: Requested ${item.weight} kg but only ${item.totalProductWeight.toFixed(2)} kg available`);
        return false;
      }
    }

    // Group items by product+sub-product to validate total quantity and weight like the backend
    const grouped = new Map<string, any>();
    formData.items.forEach((item, i) => {
      const key = `${item.product}-${item.subProduct || '__none__'}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          productName: item.productName || item.product,
          subProductName: item.subProductName,
          unit: item.unit,
          availableStock: item.availableStock || 0,
          availableWeight: item.totalProductWeight || 0,
          totalQty: 0,
          totalWeight: 0,
          indices: [],
        });
      }
      const g = grouped.get(key);
      g.totalQty += Number(item.quantity) || 0;
      g.totalWeight += Number(item.weight) || 0;
      g.indices.push(i + 1);
    });

    for (const g of grouped.values()) {
      if (g.availableStock > 0 && g.totalQty > g.availableStock) {
        toast.showToast('error', 'Insufficient Stock', `Items ${g.indices.join(', ')}: total ${g.totalQty} ${g.unit} exceeds available ${g.availableStock} ${g.unit}`);
        return false;
      }
      if (g.availableWeight > 0 && g.totalWeight > g.availableWeight) {
        toast.showToast('error', 'Insufficient Weight', `Items ${g.indices.join(', ')}: total weight ${g.totalWeight.toFixed(2)} kg exceeds available ${g.availableWeight.toFixed(2)} kg`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload: any = {
        customer: formData.customer,
        category: formData.category,
        items: formData.items.map((item) => ({
          product: item.product,
          ...(item.subProduct ? {
            subProduct: item.subProduct,
            subProductName: item.subProductName,
            subProductWeights: (item.subProductWeights || []).filter((w: number) => Number(w) > 0),
          } : {}),
          quantity: Number(item.quantity),
          unit: item.unit || "Bags",
          weight: Number(item.weight) || 0,
          notes: item.notes || "",
        })),
      };

      if (formData.expectedDeliveryDate) {
        payload.expectedDeliveryDate = formData.expectedDeliveryDate;
      }

      console.log("📦 Submitting payload:", JSON.stringify(payload, null, 2));

      if (isEditMode) {
        const response = await salesOrderAPI.update(id, payload);
        console.log("✅ Update response:", response);
        toast.showToast('success', 'Order Updated', 'Sales order has been updated successfully.');
        router.push("/sales-orders");
      } else {
        const response = await salesOrderAPI.create(payload);
        console.log("✅ Create response:", response);
        toast.showToast('success', 'Order Created', 'Sales order has been created successfully.');
        router.push("/sales-orders");
      }
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.showToast('error', 'Save Failed', err.message || 'Failed to save sales order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
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
          {isEditMode ? "Edit Sales Order" : "New Sales Order"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Customer Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.customer && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {formData.customerName || "Select Customer"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          {/* Expected Delivery Date */}
          <View style={styles.inputGroup}>
            <DatePickerInput
              label="Expected Delivery Date"
              value={formData.expectedDeliveryDate}
              onChange={(date: string) =>
                setFormData({ ...formData, expectedDeliveryDate: date })
              }
              placeholder="Select delivery date"
              minimumDate={new Date()}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.category && styles.placeholderText,
                ]}
              >
                {formData.categoryName || "Select Category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {!formData.category && (
              <Text style={styles.infoText}>
                Select a category first to see available products from inventory
              </Text>
            )}
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                !formData.category && styles.addButtonDisabled,
              ]}
              onPress={addProductGroup}
              disabled={!formData.category}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {getProductGroups().map((group, groupIndex) => {
            const selectedProduct = products.find(
              (p: any) => p._id === group.product,
            );
            const hasSubProductOptions = group.product
              ? getSubProductOptions(group.product).length > 0
              : false;
            const canRemoveGroup = formData.items.length > group.items.length;

            return (
              <View key={groupIndex} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Product {groupIndex + 1}</Text>
                  {canRemoveGroup && (
                    <TouchableOpacity
                      onPress={() => removeProductGroup(group)}
                      style={styles.removeButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Product Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      !formData.category && styles.disabledPicker,
                    ]}
                    onPress={() => {
                      if (!formData.category) {
                        toast.showToast('info', 'Category Required', 'Please select a category first');
                        return;
                      }
                      if (products.length === 0) {
                        toast.showToast('info', 'No Products', 'No products with stock available for this category');
                        return;
                      }
                      setSelectedItemIndex(group.indices[0]);
                      setShowProductModal(true);
                    }}
                    disabled={!formData.category}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        !group.product && styles.placeholderText,
                        !formData.category && styles.disabledText,
                      ]}
                      numberOfLines={1}
                    >
                      {!formData.category
                        ? "Select category first"
                        : group.productName || "Select Product"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={
                        !formData.category ? COLORS.gray400 : COLORS.gray500
                      }
                    />
                  </TouchableOpacity>
                  {selectedProduct && (
                    <Text style={styles.stockText}>
                      📦 Available: {selectedProduct.totalStock}{" "}
                      {selectedProduct.unit}
                    </Text>
                  )}
                </View>

                {/* Sub-product rows */}
                {group.items.map((item: any, rowIndex: number, arr: any[]) => {
                  const globalIndex = group.indices[rowIndex];
                  return (
                    <View key={globalIndex} style={rowIndex > 0 ? styles.subProductRow : undefined}>
                      {/* Sub-Product Selection (shown when product has sub-products in inventory) */}
                      {hasSubProductOptions && (
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>
                            Sub-Product <Text style={{ color: COLORS.danger }}>*</Text>
                          </Text>
                          <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => {
                              setSelectedItemIndex(globalIndex);
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
                              {item.subProductName || "Select Sub-Product"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
                          </TouchableOpacity>
                          {item.subProduct && (
                            <Text style={styles.stockText}>
                              📦 Stock: {item.availableStock} {item.unit}
                            </Text>
                          )}
                          {item.subProduct ? (
                            <TouchableOpacity
                              onPress={() => handleItemChange(globalIndex, 'subProduct', '')}
                            >
                              <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>✕ Clear sub-product</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      )}

                      {/* Quantity, Unit, Weight Row */}
                      <View style={styles.row}>
                        <View
                          style={[
                            styles.inputGroup,
                            { flex: 1, marginRight: SPACING.sm },
                          ]}
                        >
                          <Text style={styles.label}>Quantity *</Text>
                          <TextInput
                            style={[styles.input, item.subProduct ? styles.inputDisabled : null]}
                            keyboardType="numeric"
                            value={item.quantity}
                            onChangeText={(value) =>
                              handleItemChange(globalIndex, "quantity", value)
                            }
                            editable={!item.subProduct}
                            placeholder="0"
                          />
                          {item.subProduct ? (
                            <Text style={styles.autoText}>Auto from bags</Text>
                          ) : null}
                        </View>

                        <View
                          style={[
                            styles.inputGroup,
                            { flex: 1, marginRight: SPACING.sm },
                          ]}
                        >
                          <Text style={styles.label}>Unit</Text>
                          <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={item.unit}
                            editable={false}
                            placeholder="Auto"
                          />
                        </View>

                        <View style={[styles.fieldContainer, { flex: 1 }]}>
                          <Text style={styles.label}>
                            Weight (Kg) <Text style={{ color: COLORS.danger }}>*</Text>
                          </Text>
                          <TextInput
                            style={[styles.input, item.subProduct ? styles.inputDisabled : null]}
                            keyboardType="numeric"
                            value={item.weight}
                            onChangeText={(value) =>
                              handleItemChange(globalIndex, "weight", value)
                            }
                            editable={!item.subProduct}
                            placeholder="0"
                          />
                        </View>
                      </View>

                      {item.subProduct && Array.isArray(item.availableWeights) && item.availableWeights.length > 0 && (
                        <View style={styles.fieldContainer}>
                          <Text style={styles.label}>
                            Select bags ({(item.selectedWeightIndices || []).length}/{item.availableWeights.length} selected)
                          </Text>
                          <View style={styles.bagChipsGrid}>
                            {item.availableWeights.map((w: number, wi: number) => {
                              const isSelected = (item.selectedWeightIndices || []).includes(wi);
                              return (
                                <TouchableOpacity
                                  key={wi}
                                  onPress={() => {
                                    const newItems = [...formData.items];
                                    const it = { ...newItems[globalIndex] };
                                    const current: number[] = it.selectedWeightIndices || [];
                                    const next = isSelected
                                      ? current.filter((i: number) => i !== wi)
                                      : [...current, wi].sort((a: number, b: number) => a - b);
                                    it.selectedWeightIndices = next;
                                    it.subProductWeights = next.map((i: number) => it.availableWeights[i]);
                                    it.quantity = String(next.length);
                                    it.weight = String(
                                      parseFloat(it.subProductWeights.reduce((s: number, v: number) => s + (Number(v) || 0), 0).toFixed(2))
                                    );
                                    newItems[globalIndex] = it;
                                    setFormData(prev => ({ ...prev, items: newItems }));
                                  }}
                                  style={[styles.bagChip, isSelected ? styles.bagChipSelected : styles.bagChipUnselected]}
                                >
                                  <Text style={[styles.bagChipText, isSelected ? styles.bagChipTextSelected : styles.bagChipTextUnselected]}>
                                    #{wi + 1}: {Number(w) % 1 === 0 ? String(Number(w)) : Number(w).toFixed(2)} kg
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <Text style={styles.bagChipHint}>Tap a bag to include/exclude it from the order.</Text>
                        </View>
                      )}

                      {arr.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeSubProductRow(globalIndex)}
                          style={styles.removeSubProductRowButton}
                        >
                          <Text style={styles.removeSubProductRowText}>Remove Sub-Product Row</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {hasSubProductOptions && group.product && (
                  <TouchableOpacity
                    style={styles.addSubProductRowButton}
                    onPress={() => addSubProductRow(group)}
                  >
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                    <Text style={styles.addSubProductRowText}>Add Sub Product</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Item Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    value={group.items[0]?.notes || ""}
                    onChangeText={(value) =>
                      handleItemChange(group.indices[0], "notes", value)
                    }
                    placeholder="Special instructions for this item (optional)"
                  />
                  <Text style={styles.noteInfo}>
                    📄 These notes will appear on the challan and PDF
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? "Update Order" : "Create Order"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Customer Modal */}
      <SearchableModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer"
        options={customers}
        selectedValue={formData.customer}
        onSelect={(value: string, item: any) =>
          setFormData({ ...formData, customer: value, customerName: item.companyName })
        }
        getLabel={(c: any) => c.companyName}
        getValue={(c: any) => c._id}
        searchPlaceholder="Search customers by name..."
        emptyMessage="No customers found"
        onSearch={handleCustomerSearch}
        onLoadMore={handleCustomerLoadMore}
        loadingMore={customerLoadingMore}
        hasMore={customerHasMore}
      />

      {/* Category Modal */}
      <SearchableModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
        options={categories}
        selectedValue={formData.category}
        onSelect={(value: string, item: any) =>
          setFormData({ ...formData, category: value, categoryName: item.categoryName })
        }
        getLabel={(c: any) => c.categoryName}
        getValue={(c: any) => c._id}
        searchPlaceholder="Search categories..."
        emptyMessage="No categories found"
        onSearch={handleCategorySearch}
        onLoadMore={handleCategoryLoadMore}
        loadingMore={categoryLoadingMore}
        hasMore={categoryHasMore}
      />

      {/* Product Modal */}
      <SearchableModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Select Product"
        options={products}
        selectedValue={formData.items[selectedItemIndex]?.product || ""}
        onSelect={(value: string, item: any) => {
          const group = getProductGroups().find(g => g.indices.includes(selectedItemIndex));
          if (group) {
            handleGroupProductChange(group, value, item?.productName);
          }
          setShowProductModal(false);
        }}
        getLabel={(p: any) => p.productName}
        getValue={(p: any) => p._id}
        getSubtitle={(p: any) => `Stock: ${p.totalStock} ${p.unit}`}
        searchPlaceholder="Search products..."
        emptyMessage={!formData.category ? "Select a category first" : "No products with stock available"}
      />

      {/* Sub-Product Modal — from inventory rows */}
      <SearchableModal
        visible={showSubProductModal}
        onClose={() => setShowSubProductModal(false)}
        title="Select Sub-Product"
        options={getSubProductOptions(formData.items[selectedItemIndex]?.product || '')}
        selectedValue={formData.items[selectedItemIndex]?.subProduct || ""}
        onSelect={(value: string, sp: any) => {
          const newItems = [...formData.items];
          const invRow = getInventoryRow(newItems[selectedItemIndex].product, value) as any;
          const it = { ...newItems[selectedItemIndex] };
          it.subProduct = value;
          it.subProductName = sp?.subProductName || '';
          if (invRow) {
            it.availableStock = invRow.totalStock || 0;
            it.totalProductWeight = invRow.totalWeight || 0;
            it.productStock = invRow.totalStock || 0;
            it.unit = invRow.unit || it.unit;
            const availableWeights: number[] = invRow.availableWeights || [];
            it.availableWeights = availableWeights;
            const allIndices = availableWeights.map((_: number, i: number) => i);
            it.selectedWeightIndices = allIndices;
            it.subProductWeights = availableWeights.slice();
            it.quantity = String(availableWeights.length);
            it.weight = String(
              parseFloat(availableWeights.reduce((s: number, w: number) => s + (Number(w) || 0), 0).toFixed(2))
            );
            if (availableWeights.length === 0) {
              it.quantity = '';
              it.weight = '';
            }
          }
          newItems[selectedItemIndex] = it;
          setFormData({ ...formData, items: newItems });
          setShowSubProductModal(false);
        }}
        getLabel={(sp: any) => `${sp.subProductName} (${sp.totalStock} ${sp.unit})`}
        getValue={(sp: any) => sp.subProductId}
        getSubtitle={(sp: any) => `Stock: ${sp.totalStock} ${sp.unit}`}
        searchPlaceholder="Search sub-products..."
        emptyMessage="No sub-products with stock found"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.gray600 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingTop: 50,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.gray900 },
  scrollView: { flex: 1 },
  formSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 16,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
  inputGroup: { marginBottom: SPACING.md },
  fieldContainer: { marginBottom: SPACING.md },
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
    fontSize: 14,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
    minHeight: 50,
  },
  inputDisabled: { backgroundColor: COLORS.gray100, color: COLORS.gray500 },
  bagChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  bagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  bagChipSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  bagChipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  bagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bagChipTextSelected: {
    color: '#FFFFFF',
  },
  bagChipTextUnselected: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  bagChipHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  autoText: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  textArea: { height: 80, textAlignVertical: "top" },
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
    fontSize: 14,
    color: COLORS.gray900,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.gray500,
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
  stockText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
    fontWeight: "500",
  },
  suggestedText: { fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  noteInfo: { fontSize: 11, color: COLORS.gray400, marginTop: 4 },
  itemCard: {
    backgroundColor: COLORS.gray50,
    padding: SPACING.md,
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
  itemTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.gray900 },
  removeButton: {
    padding: SPACING.xs,
  },
  subProductRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  addSubProductRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  addSubProductRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  removeSubProductRowButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  removeSubProductRowText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: SPACING.lg,
    paddingBottom: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: COLORS.gray700 },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: COLORS.white },
  // Modal styles
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
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
});
