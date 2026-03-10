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
import { salesOrderAPI } from "../../services/salesOrderAPI";

export default function SalesOrderForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

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
        quantity: "",
        unit: "",
        weight: "",
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
    }
  }, [formData.category]);

  const loadCustomers = async () => {
    try {
      const response = await apiRequest("/master-data/customers");
      if (response?.success) setCustomers(response.data || []);
    } catch (err: any) {
      console.error("Error loading customers:", err);
      toast.showToast('error', 'Load Failed', 'Failed to load customers. Please refresh.');
      setCustomers([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiRequest("/master-data/categories");
      if (response?.success) setCategories(response.data || []);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      toast.showToast('error', 'Load Failed', 'Failed to load categories. Please refresh.');
      setCategories([]);
    }
  };

  const loadProducts = async (categoryId: string) => {
    try {
      const response = await apiRequest(
        `/inventory?category=${categoryId}&populate=product&limit=200`,
      );
      console.log("Inventory API response:", response);

      if (response?.success) {
        let inventoryData = response.data || [];

        // Check if data is nested in a category structure
        if (inventoryData.length > 0 && inventoryData[0].products) {
          // Flatten products from category structure - ONLY SHOW PRODUCTS WITH STOCK
          const allProducts: any[] = [];
          inventoryData.forEach((cat: any) => {
            if (cat.products && Array.isArray(cat.products)) {
              cat.products.forEach((prod: any) => {
                // Only add products with available stock > 0
                if ((prod.totalStock || 0) > 0) {
                  allProducts.push({
                    _id: prod.productId || prod._id,
                    productName: prod.productName || "Unknown Product",
                    productCode: prod.productCode || "",
                    unit: prod.unit || "Bags",
                    totalStock: prod.totalStock || 0,
                    totalWeight: prod.totalWeight || 0,
                  });
                }
              });
            }
          });
          console.log("Loaded products (nested):", allProducts);
          setProducts(allProducts.filter((p) => p._id && p.totalStock > 0));
        } else {
          // Direct product list
          const allProducts = inventoryData
            .map((inv: any) => {
              const product = inv.product;
              return {
                _id: product?._id || inv.product,
                productName:
                  product?.productName || product?.name || "Unknown Product",
                productCode: product?.productCode || product?.code || "",
                unit: product?.unit || "Bags",
                totalStock: inv.totalStock || 0,
                totalWeight: inv.totalWeight || 0,
              };
            })
            .filter((p: any) => p._id && p.totalStock > 0);

          console.log("Loaded products (direct):", allProducts);
          setProducts(allProducts);
        }
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      toast.showToast('error', 'Load Failed', 'Failed to load products. Please try again.');
      setProducts([]);
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
            quantity: String(item.quantity || ""),
            unit: item.unit || "",
            weight: String(item.weight || ""),
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

  // SearchableModal is used for all picker modals (customer, category, product)

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product: "",
          productName: "",
          quantity: "",
          unit: "",
          weight: "",
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

  const handleItemChange = (
    index: number,
    field: string,
    value: any,
    productName?: string,
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-populate unit and stock info when product is selected
    if (field === "product") {
      const selectedProduct = products.find((p: any) => p._id === value);
      if (selectedProduct) {
        newItems[index].productName =
          productName || selectedProduct.productName;
        newItems[index].unit = selectedProduct.unit;
        newItems[index].availableStock = selectedProduct.totalStock;
        newItems[index].totalProductWeight = selectedProduct.totalWeight;
        newItems[index].productStock = selectedProduct.totalStock;

        // Auto-calculate weight if quantity already exists
        const qty = Number(newItems[index].quantity) || 0;
        if (qty > 0 && selectedProduct.totalStock > 0) {
          const weightPerUnit =
            selectedProduct.totalWeight / selectedProduct.totalStock;
          newItems[index].weight = String((qty * weightPerUnit).toFixed(2));
        }
      }
    }

    // Auto-calculate weight when quantity changes
    if (field === "quantity") {
      const product = products.find(
        (p: any) => p._id === newItems[index].product,
      );
      if (product && product.totalStock > 0) {
        const weightPerUnit = product.totalWeight / product.totalStock;
        const qty = Number(value) || 0;
        if (qty > 0) {
          newItems[index].weight = String((qty * weightPerUnit).toFixed(2));
        }
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
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.showToast('error', 'Invalid Quantity', `Please enter a valid quantity for item ${i + 1}`);
        return false;
      }
      const product = products.find((p) => p._id === item.product);
      if (product && Number(item.quantity) > product.totalStock) {
        toast.showToast('error', 'Insufficient Stock', `Item ${i + 1}: Requested quantity (${item.quantity}) exceeds available stock (${product.totalStock})`);
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
              onPress={handleAddItem}
              disabled={!formData.category}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => {
            const selectedProduct = products.find(
              (p: any) => p._id === item.product,
            );
            const weightPerUnit =
              selectedProduct && selectedProduct.totalStock > 0
                ? selectedProduct.totalWeight / selectedProduct.totalStock
                : 0;

            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  {formData.items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
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
                        : item.productName || "Select Product"}
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
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(value) =>
                        handleItemChange(index, "quantity", value)
                      }
                      placeholder="0"
                    />
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
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.weight}
                      onChangeText={(value) =>
                        handleItemChange(index, "weight", value)
                      }
                      placeholder="0"
                    />
                  </View>
                </View>

                {selectedProduct && weightPerUnit > 0 && (
                  <Text style={styles.suggestedText}>
                    Suggested:{" "}
                    {((Number(item.quantity) || 0) * weightPerUnit).toFixed(2)}{" "}
                    Kg ({weightPerUnit.toFixed(2)} Kg per {selectedProduct.unit}
                    )
                  </Text>
                )}

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Item Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    value={item.notes}
                    onChangeText={(value) =>
                      handleItemChange(index, "notes", value)
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
      />

      {/* Product Modal */}
      <SearchableModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Select Product"
        options={products}
        selectedValue={formData.items[selectedItemIndex]?.product || ""}
        onSelect={(value: string, item: any) =>
          handleItemChange(selectedItemIndex, "product", value, item?.productName)
        }
        getLabel={(p: any) => p.productName}
        getValue={(p: any) => p._id}
        getSubtitle={(p: any) => `Stock: ${p.totalStock} ${p.unit}`}
        searchPlaceholder="Search products..."
        emptyMessage={!formData.category ? "Select a category first" : "No products with stock available"}
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
