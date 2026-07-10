import DatePickerInput from "@/components/DatePickerInput";
import SearchableModal from "@/components/SearchableModal";
import { useToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useWarehouseLocations } from "../../hooks/useWarehouseLocations";
import { grnAPI } from "../../services/grnAPI";
// warehouse locations loaded dynamically
import { purchaseOrderAPI } from "../../services/purchaseOrderAPI";

interface GRNItem {
  _id?: string;
  purchaseOrderItem: string;
  product?: string;
  productName: string;
  subProductName?: string;
  productCode?: string;
  orderedQuantity: number;
  orderedWeight: number;
  previouslyReceived: number;
  previousWeight: number;
  receivedQuantity: number;
  receivedWeight: number;
  perUnitWeights?: number[];
  pendingQuantity: number;
  pendingWeight: number;
  unit: string;
  warehouseLocation?: string;
  notes?: string;
  isCompleted?: boolean;
  markAsComplete?: boolean;
  manuallyCompleted?: boolean;
  completionReason?: string;
  specifications?: any;
}

interface GRNFormData {
  purchaseOrder: string;
  receiptDate: string;
  warehouseLocation: string;
  storageInstructions: string;
  generalNotes: string;
  items: GRNItem[];
}

export default function GRNFormScreen() {
  const router = useRouter();
  const { id, poId } = useLocalSearchParams();
  const isEditMode = !!id;

  const { locations: warehouseLocations } = useWarehouseLocations();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poPage, setPoPage] = useState(1);
  const [poHasMore, setPoHasMore] = useState(false);
  const [poLoadingMore, setPoLoadingMore] = useState(false);
  const [poSearch, setPoSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [loadingGRN, setLoadingGRN] = useState(false);
  const [loadingPODetails, setLoadingPODetails] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState<GRNFormData>({
    purchaseOrder: (Array.isArray(poId) ? poId[0] : poId) || "",
    receiptDate: new Date().toISOString().split("T")[0],
    warehouseLocation: "",
    storageInstructions: "",
    generalNotes: "",
    items: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal states for searchable pickers
  const [showPOModal, setShowPOModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Load purchase orders
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Load GRN if editing
  useEffect(() => {
    if (isEditMode) {
      loadGRN();
    }
  }, [id]);

  // Handle pre-selected PO
  useEffect(() => {
    if (poId && !isEditMode) {
      const poIdStr = Array.isArray(poId) ? poId[0] : poId;
      handlePOSelection(poIdStr);
    }
  }, [poId]);

  const GRN_PAGE_LIMIT = 50;

  const loadPurchaseOrders = async (search = '', page = 1, append = false) => {
    try {
      if (!append) setLoadingPOs(true);
      else setPoLoadingMore(true);
      console.log("🔗 Loading purchase orders...");

      const params: any = { limit: GRN_PAGE_LIMIT, page };
      if (search) params.search = search;
      const response = await purchaseOrderAPI.getAll(params);
      console.log("📦 POs response:", response);

      if (response?.success && response?.data) {
        // Filter out fully received POs
        const incompletePOs = response.data.filter(
          (po: any) =>
            po.status !== "Fully_Received" && po.status !== "Complete",
        );
        if (append) {
          setPurchaseOrders(prev => [...prev, ...incompletePOs]);
        } else {
          setPurchaseOrders(incompletePOs);
        }
        const pagination = response.pagination;
        const hasMore = pagination ? page < pagination.pages : response.data.length === GRN_PAGE_LIMIT;
        setPoHasMore(hasMore);
        setPoPage(page);
        setPoSearch(search);
        console.log(`✅ Loaded ${incompletePOs.length} incomplete POs`);
      } else {
        if (!append) setPurchaseOrders([]);
      }
    } catch (err: any) {
      console.error("❌ Error loading POs:", err);
      if (!append) {
        toast.showToast('error', 'Load Failed', 'Failed to load purchase orders. Please refresh.');
        setPurchaseOrders([]);
      }
    } finally {
      setLoadingPOs(false);
      setPoLoadingMore(false);
    }
  };

  const handlePOSearch = (query: string) => {
    loadPurchaseOrders(query, 1, false);
  };

  const handlePOLoadMore = () => {
    if (!poLoadingMore && poHasMore) {
      loadPurchaseOrders(poSearch, poPage + 1, true);
    }
  };

  const loadGRN = async () => {
    try {
      setLoading(true);
      const response = await grnAPI.getById(id);

      if (response?.success && response?.data) {
        const grn = response.data;
        setFormData({
          purchaseOrder: grn.purchaseOrder?._id || "",
          receiptDate: grn.receiptDate
            ? new Date(grn.receiptDate).toISOString().split("T")[0]
            : "",
          warehouseLocation: grn.warehouseLocation || "",
          storageInstructions: grn.storageInstructions || "",
          generalNotes: grn.generalNotes || "",
          items:
            grn.items?.map((item: any) => {
              const perUnitWeights = Array.isArray(item.receivedSubProductWeights)
                ? item.receivedSubProductWeights
                : Array.isArray(item.perUnitWeights)
                  ? item.perUnitWeights
                  : [];
              const receivedWeight = Number(item.receivedWeight) || 0;
              const receivedQuantity = Number(item.receivedQuantity) || 0;
              const weightPerUnit = receivedQuantity > 0
                ? parseFloat((receivedWeight / receivedQuantity).toFixed(2))
                : 0;
              return {
                purchaseOrderItem: item.purchaseOrderItem || item._id,
                productName: item.productName,
                subProductName: item.subProductName || "",
                productCode: item.productCode,
                orderedQuantity: item.orderedQuantity || 0,
                orderedWeight: item.orderedWeight || 0,
                previouslyReceived: item.previouslyReceived || 0,
                previousWeight: item.previousWeight || 0,
                receivedQuantity: receivedQuantity,
                receivedWeight: receivedWeight,
                perUnitWeights: perUnitWeights.length > 0
                  ? perUnitWeights.map((w: number) => parseFloat(w.toFixed(2)))
                  : receivedQuantity > 0
                    ? Array.from({ length: receivedQuantity }, () => weightPerUnit)
                    : [],
                pendingQuantity: item.pendingQuantity || 0,
                pendingWeight: item.pendingWeight || 0,
                unit: item.unit || "Bags",
                warehouseLocation: item.warehouseLocation || "",
                notes: item.notes || "",
                isCompleted: item.pendingQuantity <= 0 || item.manuallyCompleted,
                manuallyCompleted: item.manuallyCompleted || false,
                markAsComplete: item.manuallyCompleted || false,
              };
            }) || [],
        });

        if (grn.purchaseOrder) {
          setSelectedPO(grn.purchaseOrder);
        }
      }
    } catch (err: any) {
      console.error("❌ Error loading GRN:", err);
      toast.showToast('error', 'Load Failed', err.message || 'Failed to load GRN details');
    } finally {
      setLoading(false);
    }
  };

  const handlePOSelection = async (poId: string) => {
    if (!poId) {
      setSelectedPO(null);
      setFormData((prev) => ({
        ...prev,
        purchaseOrder: "",
        items: [],
      }));
      return;
    }

    try {
      console.log("🔗 Loading PO details:", poId);
      const response = await purchaseOrderAPI.getById(poId);

      if (response?.success && response?.data) {
        const po = response.data;
        setSelectedPO(po);
        console.log("📦 PO loaded:", po.poNumber);

        // Populate items from PO with weight tracking
        const items = po.items
          .map((item: any) => {
            const orderedQty = item.quantity || 0;
            const orderedWeight =
              item.weight || item.specifications?.weight || 0;
            const receivedQty = item.receivedQuantity || 0;

            // Calculate received weight
            let receivedWt = item.receivedWeight || 0;
            if (
              receivedWt === 0 &&
              receivedQty > 0 &&
              orderedQty > 0 &&
              orderedWeight > 0
            ) {
              const weightPerUnit = orderedWeight / orderedQty;
              receivedWt = receivedQty * weightPerUnit;
            }

            const pendingQty = orderedQty - receivedQty;
            const pendingWt = orderedWeight - receivedWt;

            const initialQty = pendingQty > 0 ? pendingQty : 0;
            const initialWeight = pendingWt > 0 ? pendingWt : 0;
            const perUnitWeight = initialQty > 0
              ? parseFloat((initialWeight / initialQty).toFixed(2))
              : 0;
            return {
              purchaseOrderItem: item._id,
              productName: item.productName,
              subProductName: item.subProductName || item.subProduct?.name || "",
              productCode: item.productCode,
              orderedQuantity: orderedQty,
              orderedWeight: orderedWeight,
              previouslyReceived: receivedQty,
              previousWeight: receivedWt,
              receivedQuantity: initialQty,
              receivedWeight: initialWeight,
              perUnitWeights: (item.subProductName || item.subProduct?.name) && initialQty > 0
                ? Array.from({ length: initialQty }, () => perUnitWeight)
                : [],
              pendingQuantity: pendingQty,
              pendingWeight: pendingWt,
              unit: item.unit,
              specifications: item.specifications || {},
              warehouseLocation: formData.warehouseLocation,
              notes: "",
              isCompleted: pendingQty <= 0 || item.manuallyCompleted,
              manuallyCompleted: item.manuallyCompleted || false,
              markAsComplete: false,
            };
          })
          .filter((item: GRNItem) => !item.isCompleted);

        setFormData((prev) => ({
          ...prev,
          purchaseOrder: poId,
          items,
        }));

        console.log(`✅ Loaded ${items.length} pending items`);
      }
    } catch (err: any) {
      console.error("❌ Error loading PO:", err);
      toast.showToast('error', 'Load Failed', err.message || 'Failed to load PO details');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const weightPerUnitForItem = (item: GRNItem) => {
    const receivedQty = Number(item.receivedQuantity) || 0;
    const receivedWt = Number(item.receivedWeight) || 0;
    if (receivedQty > 0 && receivedWt > 0) return receivedWt / receivedQty;
    if (item.orderedQuantity > 0 && item.orderedWeight > 0) {
      return item.orderedWeight / item.orderedQuantity;
    }
    return 0;
  };

  const distributeWeights = (item: GRNItem, totalWeight: number, quantity: number): number[] => {
    const qty = Math.floor(quantity || 0);
    if (qty <= 0) return [];
    const perUnit = qty > 0 ? totalWeight / qty : 0;
    // Preserve existing per-unit weights when possible, only pad/truncate
    const current = Array.isArray(item.perUnitWeights) ? item.perUnitWeights : [];
    const next = Array.from({ length: qty }, (_, i) => {
      if (i < current.length) return current[i];
      return perUnit;
    });
    // Rebalance to match total if current sum differs significantly from total
    const sum = next.reduce((s, w) => s + (Number(w) || 0), 0);
    if (Math.abs(sum - totalWeight) > 0.001 && totalWeight > 0) {
      return next.map(() => perUnit);
    }
    return next;
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    const numValue = Number(value) || 0;

    const hasSubProduct = !!item.subProductName;

    if (field === "receivedQuantity") {
      const maxAllowed = item.orderedQuantity - (item.previouslyReceived || 0);
      const qty = Math.floor(Math.max(0, Math.min(maxAllowed, numValue)));
      const wpu = weightPerUnitForItem(item);
      const currentWeight = Number(item.receivedWeight) || 0;
      // If no weight was set yet (and ordered weight exists), default to qty * ordered ratio
      const defaultWeight = (item.orderedQuantity > 0 && item.orderedWeight > 0 && currentWeight === 0)
        ? qty * (item.orderedWeight / item.orderedQuantity)
        : currentWeight;
      // Only track per-unit weights for sub-product items
      const perUnit = currentWeight > 0 && qty > 0 ? currentWeight / qty : wpu;
      const currentWeights = hasSubProduct && Array.isArray(item.perUnitWeights) ? item.perUnitWeights : [];
      const nextWeights = hasSubProduct
        ? Array.from({ length: qty }, (_, i) => i < currentWeights.length ? currentWeights[i] : perUnit)
        : [];
      const finalWeight = hasSubProduct && nextWeights.length > 0
        ? nextWeights.reduce((s, w) => s + (Number(w) || 0), 0) || defaultWeight
        : defaultWeight;

      updatedItems[index] = {
        ...item,
        receivedQuantity: qty,
        pendingQuantity: maxAllowed - qty,
        receivedWeight: finalWeight,
        pendingWeight: item.orderedWeight - item.previousWeight - finalWeight,
        perUnitWeights: nextWeights,
      };
    } else if (field === "receivedWeight") {
      const maxWeight = item.orderedWeight - (item.previousWeight || 0);
      const weight = maxWeight > 0
        ? Math.max(0, Math.min(maxWeight, numValue))
        : Math.max(0, numValue);
      const qty = Number(item.receivedQuantity) || 0;
      const nextWeights = hasSubProduct ? distributeWeights(item, weight, qty) : [];
      updatedItems[index] = {
        ...item,
        receivedWeight: weight,
        pendingWeight: item.orderedWeight - item.previousWeight - weight,
        perUnitWeights: nextWeights,
      };
    } else {
      updatedItems[index] = { ...item, [field]: value };
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const incrementQuantity = (index: number) => {
    const item = formData.items[index];
    const maxAllowed = item.orderedQuantity - (item.previouslyReceived || 0);
    const newQty = Math.min(maxAllowed, Number(item.receivedQuantity || 0) + 1);
    handleItemChange(index, "receivedQuantity", newQty);
  };

  const decrementQuantity = (index: number) => {
    const item = formData.items[index];
    const newQty = Math.max(0, Number(item.receivedQuantity || 0) - 1);
    handleItemChange(index, "receivedQuantity", newQty);
  };

  const weightStepForItem = (item: GRNItem) => {
    const wpu = weightPerUnitForItem(item);
    if (wpu > 0) return wpu;
    return 1;
  };

  const incrementWeight = (index: number) => {
    const item = formData.items[index];
    const maxWeight = item.orderedWeight - (item.previousWeight || 0);
    const step = weightStepForItem(item);
    const current = Number(item.receivedWeight || 0);
    const newWeight = maxWeight > 0
      ? Math.min(maxWeight, parseFloat((current + step).toFixed(3)))
      : parseFloat((current + step).toFixed(3));
    handleItemChange(index, "receivedWeight", newWeight);
  };

  const decrementWeight = (index: number) => {
    const item = formData.items[index];
    const step = weightStepForItem(item);
    const current = Number(item.receivedWeight || 0);
    const newWeight = Math.max(0, parseFloat((current - step).toFixed(3)));
    handleItemChange(index, "receivedWeight", newWeight);
  };

  const handlePerUnitWeightsChange = (index: number, weights: number[]) => {
    const item = formData.items[index];
    const total = weights.reduce((s, w) => s + (Number(w) || 0), 0);
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...item,
      perUnitWeights: weights,
      receivedWeight: total,
      pendingWeight: item.orderedWeight - item.previousWeight - total,
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.purchaseOrder) {
      newErrors.purchaseOrder = "Purchase Order is required";
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = "Receipt date is required";
    }

    if (!formData.warehouseLocation) {
      newErrors.warehouseLocation = "Warehouse Location is required";
    }

    // Check if at least one item has received quantity
    let hasAtLeastOneItem = false;
    formData.items.forEach((item, index) => {
      if (item.receivedQuantity > 0) {
        hasAtLeastOneItem = true;

        // Check if receiving more than pending quantity
        const maxAllowed =
          item.orderedQuantity - (item.previouslyReceived || 0);
        if (item.receivedQuantity > maxAllowed) {
          newErrors[`items.${index}.receivedQuantity`] =
            `Cannot receive more than pending (${maxAllowed} ${item.unit})`;
        }

        // Check if receiving more than pending weight
        const maxWeight = item.orderedWeight - (item.previousWeight || 0);
        if (maxWeight > 0 && item.receivedWeight > maxWeight) {
          newErrors[`items.${index}.receivedWeight`] =
            `Cannot receive more than pending weight (${maxWeight.toFixed(2)} kg)`;
        }
      }
    });

    if (!hasAtLeastOneItem) {
      newErrors.items = "Please enter received quantity for at least one item";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.showToast('warning', 'Validation Error', 'Please fill all required fields correctly');
      return;
    }

    try {
      setSubmitting(true);
      console.log("📦 Submitting GRN:", formData);

      const submitData = {
        ...formData,
        items: formData.items
          .filter((item) => item.receivedQuantity > 0 || item.markAsComplete)
          .map((item) => ({
            purchaseOrderItem: item.purchaseOrderItem,
            receivedQuantity: Number(item.receivedQuantity),
            receivedWeight: Number(item.receivedWeight || 0),
            receivedSubProductWeights: (item.perUnitWeights || []).filter((w) => w > 0),
            warehouseLocation:
              item.warehouseLocation || formData.warehouseLocation,
            notes: item.notes || "",
            markAsComplete: item.markAsComplete || false,
          })),
      };

      let response;
      if (isEditMode) {
        response = await grnAPI.update(id, submitData);
      } else {
        response = await grnAPI.create(submitData);
      }

      console.log("✅ GRN response:", response);

      if (response?.success) {
        toast.showToast('success', isEditMode ? 'GRN Updated' : 'GRN Created', `GRN ${isEditMode ? 'updated' : 'created'} successfully!`);
        setTimeout(() => router.back(), 800);
      } else {
        throw new Error(response?.message || "Failed to save GRN");
      }
    } catch (err: any) {
      console.error("❌ Error submitting GRN:", err);
      toast.showToast('error', 'Save Failed', err?.message || 'Failed to save GRN');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
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
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit GRN" : "Create New GRN"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Purchase Order */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Purchase Order *</Text>
            <TouchableOpacity
              style={[
                styles.searchPickerButton,
                isEditMode && styles.searchPickerDisabled,
                errors.purchaseOrder && styles.searchPickerError,
              ]}
              onPress={() => !isEditMode && !loadingPOs && setShowPOModal(true)}
              disabled={isEditMode || loadingPOs}
            >
              <Text
                style={[
                  styles.searchPickerText,
                  !formData.purchaseOrder && styles.searchPickerPlaceholder,
                ]}
                numberOfLines={1}
              >
                {loadingPOs
                  ? "Loading..."
                  : selectedPO
                    ? `${selectedPO.poNumber} - ${selectedPO.supplierDetails?.companyName || selectedPO.supplier?.companyName || "Unknown"}`
                    : "Select Purchase Order"}
              </Text>
              {loadingPOs ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            {errors.purchaseOrder && (
              <Text style={styles.errorText}>{errors.purchaseOrder}</Text>
            )}
          </View>

          {/* Receipt Date */}
          <DatePickerInput
            label="Receipt Date"
            value={formData.receiptDate}
            onChange={(date) => handleChange("receiptDate", date)}
            error={errors.receiptDate}
            required
            placeholder="Select receipt date"
          />
        </View>

        {/* Supplier Information */}
        {selectedPO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supplier Information</Text>
            <View style={styles.supplierCard}>
              <View style={styles.supplierRow}>
                <Ionicons name="business" size={20} color="#10B981" />
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierLabel}>Supplier</Text>
                  <Text style={styles.supplierValue}>
                    {selectedPO.supplierDetails?.companyName ||
                      selectedPO.supplier?.companyName ||
                      "Unknown Supplier"}
                  </Text>
                </View>
              </View>
              {selectedPO.category?.categoryName && (
                <View style={styles.supplierRow}>
                  <Ionicons name="pricetag" size={20} color="#10B981" />
                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierLabel}>Category</Text>
                    <Text style={styles.supplierValue}>
                      {selectedPO.category.categoryName}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Warehouse & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse & Storage</Text>

          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.label}>Warehouse Location *</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.searchPickerButton,
                errors.warehouseLocation && styles.searchPickerError,
              ]}
              onPress={() => setShowWarehouseModal(true)}
            >
              <Text
                style={[
                  styles.searchPickerText,
                  !formData.warehouseLocation && styles.searchPickerPlaceholder,
                ]}
              >
                {formData.warehouseLocation
                  ? warehouseLocations.find(
                      (w) => w._id === formData.warehouseLocation,
                    )?.name || "Select Warehouse"
                  : "Select Warehouse Location"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.warehouseLocation && (
              <Text style={styles.errorText}>{errors.warehouseLocation}</Text>
            )}
            {!errors.warehouseLocation && (
              <Text style={styles.helperText}>
                Select where the received goods will be stored
              </Text>
            )}
          </View>

          {/* Storage Instructions */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="document-text" size={16} color="#6B7280" />
              <Text style={styles.label}>Storage Instructions</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.storageInstructions}
              onChangeText={(value) =>
                handleChange("storageInstructions", value)
              }
              placeholder="Special storage requirements (optional)"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helperText}>
              e.g., Keep in cool area, Handle with care, etc.
            </Text>
          </View>
        </View>

        {/* Items */}
        {selectedPO && formData.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items Received</Text>
            {errors.items && (
              <Text style={styles.errorText}>{errors.items}</Text>
            )}

            {formData.items.map((item, index) => {
              const completionPercentage =
                item.orderedQuantity > 0
                  ? Math.round(
                      ((item.previouslyReceived +
                        Number(item.receivedQuantity || 0)) /
                        item.orderedQuantity) *
                        100,
                    )
                  : 0;

              return (
                <View key={index} style={styles.itemCard}>
                  {/* Product Info */}
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemProductName}>
                      {item.subProductName
                        ? `${item.productName} X ${item.subProductName}`
                        : item.productName}
                    </Text>
                    <Text style={styles.itemProductCode}>
                      {item.productCode}
                    </Text>
                  </View>

                  {/* Quantities Grid */}
                  <View style={styles.itemQuantities}>
                    <View style={styles.quantityBox}>
                      <Text style={styles.quantityLabel}>Ordered</Text>
                      <Text style={styles.quantityValue}>
                        {item.orderedQuantity} {item.unit}
                      </Text>
                      {item.orderedWeight > 0 && (
                        <Text style={styles.quantitySubValue}>
                          {(item.orderedWeight || 0).toFixed(2)} kg
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.quantityBox,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Text style={styles.quantityLabel}>Prev. Received</Text>
                      <Text
                        style={[styles.quantityValue, { color: "#1E40AF" }]}
                      >
                        {item.previouslyReceived || 0} {item.unit}
                      </Text>
                      {(item.previousWeight || 0) > 0 && (
                        <Text
                          style={[
                            styles.quantitySubValue,
                            { color: "#1E40AF" },
                          ]}
                        >
                          {(item.previousWeight || 0).toFixed(2)} kg
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.quantityBox,
                        { backgroundColor: "#FEF3C7" },
                      ]}
                    >
                      <Text style={styles.quantityLabel}>Pending</Text>
                      <Text
                        style={[styles.quantityValue, { color: "#92400E" }]}
                      >
                        {Math.max(0, item.pendingQuantity || 0)} {item.unit}
                      </Text>
                      {item.orderedWeight > 0 && (
                        <Text
                          style={[
                            styles.quantitySubValue,
                            { color: "#92400E" },
                          ]}
                        >
                          {Math.max(0, item.pendingWeight || 0).toFixed(2)} kg
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Receiving Now - Quantity */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Receiving Now (Quantity) *</Text>
                    <View style={styles.inputWithControls}>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          item.receivedQuantity <= 0 &&
                            styles.controlButtonDisabled,
                        ]}
                        onPress={() => decrementQuantity(index)}
                        disabled={item.receivedQuantity <= 0}
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={
                            item.receivedQuantity <= 0 ? "#D1D5DB" : "#374151"
                          }
                        />
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.input, styles.inputCenter]}
                        value={String(item.receivedQuantity)}
                        onChangeText={(value) =>
                          handleItemChange(index, "receivedQuantity", value)
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                      />

                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          item.receivedQuantity >=
                            item.orderedQuantity - item.previouslyReceived &&
                            styles.controlButtonDisabled,
                        ]}
                        onPress={() => incrementQuantity(index)}
                        disabled={
                          item.receivedQuantity >=
                          item.orderedQuantity - item.previouslyReceived
                        }
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={
                            item.receivedQuantity >=
                            item.orderedQuantity - item.previouslyReceived
                              ? "#D1D5DB"
                              : "#374151"
                          }
                        />
                      </TouchableOpacity>

                      <Text style={styles.unitText}>{item.unit}</Text>
                    </View>
                    <Text style={styles.helperText}>
                      Max: {item.orderedQuantity - item.previouslyReceived}{" "}
                      {item.unit}
                    </Text>
                    {errors[`items.${index}.receivedQuantity`] && (
                      <Text style={styles.errorText}>
                        {errors[`items.${index}.receivedQuantity`]}
                      </Text>
                    )}
                  </View>

                  {/* Receiving Now - Weight */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Receiving Now (Weight)</Text>
                    <View style={styles.inputWithControls}>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          (item.receivedWeight || 0) <= 0 &&
                            styles.controlButtonDisabled,
                        ]}
                        onPress={() => decrementWeight(index)}
                        disabled={(item.receivedWeight || 0) <= 0}
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={
                            (item.receivedWeight || 0) <= 0
                              ? "#D1D5DB"
                              : "#374151"
                          }
                        />
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.input, styles.inputCenter]}
                        value={
                          typeof item.receivedWeight === "number"
                            ? item.receivedWeight.toFixed(2)
                            : "0.00"
                        }
                        onChangeText={(value) =>
                          handleItemChange(index, "receivedWeight", value)
                        }
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                      />

                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          item.orderedWeight > 0 &&
                            (item.receivedWeight || 0) >=
                              item.orderedWeight - (item.previousWeight || 0) &&
                            styles.controlButtonDisabled,
                        ]}
                        onPress={() => incrementWeight(index)}
                        disabled={
                          item.orderedWeight > 0 &&
                          (item.receivedWeight || 0) >=
                            item.orderedWeight - (item.previousWeight || 0)
                        }
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={
                            item.orderedWeight > 0 &&
                            (item.receivedWeight || 0) >=
                              item.orderedWeight - (item.previousWeight || 0)
                              ? "#D1D5DB"
                              : "#374151"
                          }
                        />
                      </TouchableOpacity>

                      <Text style={styles.unitText}>kg</Text>
                    </View>
                    {item.orderedWeight > 0 && (
                      <Text style={styles.helperText}>
                        Max:{" "}
                        {(
                          item.orderedWeight - (item.previousWeight || 0)
                        ).toFixed(2)}{" "}
                        kg
                      </Text>
                    )}
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${completionPercentage}%`,
                            backgroundColor:
                              completionPercentage === 100
                                ? "#10B981"
                                : "#3B82F6",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {completionPercentage}%
                    </Text>
                  </View>

                  {/* Mark as Complete Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      const updatedItems = [...formData.items];
                      updatedItems[index].markAsComplete = !item.markAsComplete;
                      setFormData((prev) => ({ ...prev, items: updatedItems }));
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.markAsComplete && styles.checkboxChecked,
                      ]}
                    >
                      {item.markAsComplete && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={styles.checkboxLabelContainer}>
                      <Text style={styles.checkboxLabel}>Mark as Complete</Text>
                      <Text style={styles.checkboxHelper}>
                        Check this if item is final (e.g., losses/damages
                        accepted)
                      </Text>
                      {item.markAsComplete && (
                        <Text style={styles.checkboxFinalBadge}>FINAL</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Per-Unit Weights — only for items with sub-products */}
                  {item.subProductName && Number(item.receivedQuantity) > 0 && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>
                        Per-Unit Weights (optional) — {Number(item.receivedQuantity)} units
                      </Text>
                      {Array.from({ length: Number(item.receivedQuantity) }).map((_, wi) => (
                        <View key={wi} style={styles.perUnitWeightRow}>
                          <Text style={styles.perUnitWeightLabel}>#{wi + 1}</Text>
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            value={String((item.perUnitWeights || [])[wi] || "")}
                            onChangeText={(val) => {
                              const weights = [...(item.perUnitWeights || [])];
                              weights[wi] = parseFloat(val) || 0;
                              handlePerUnitWeightsChange(index, weights);
                            }}
                          />
                          <Text style={styles.perUnitWeightUnit}>kg</Text>
                        </View>
                      ))}
                      {(item.perUnitWeights || []).some((w) => w > 0) && (
                        <Text style={styles.perUnitWeightSum}>
                          Total: {(item.perUnitWeights || []).reduce((s, w) => s + (w || 0), 0).toFixed(2)} kg
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Item Notes */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                      style={styles.input}
                      value={item.notes}
                      onChangeText={(value) =>
                        handleItemChange(index, "notes", value)
                      }
                      placeholder="Any notes for this item..."
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>General Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.generalNotes}
              onChangeText={(value) => handleChange("generalNotes", value)}
              placeholder="Any additional notes about this goods receipt..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !selectedPO}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? "Update GRN" : "Create GRN"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Searchable PO Modal */}
      <SearchableModal
        visible={showPOModal}
        onClose={() => setShowPOModal(false)}
        title="Select Purchase Order"
        options={purchaseOrders}
        selectedValue={formData.purchaseOrder}
        onSelect={(value: string) => {
          handleChange("purchaseOrder", value);
          handlePOSelection(value);
        }}
        getLabel={(po) => `${po.poNumber} - ${po.supplierDetails?.companyName || "Unknown"}`}
        getValue={(po) => po._id}
        getSubtitle={(po) => `Status: ${po.status || "N/A"} • Items: ${po.items?.length || 0}`}
        searchPlaceholder="Search by PO number or supplier..."
        emptyMessage="No purchase orders available"
        loading={loadingPOs}
        onSearch={handlePOSearch}
        onLoadMore={handlePOLoadMore}
        loadingMore={poLoadingMore}
        hasMore={poHasMore}
      />

      {/* Searchable Warehouse Modal */}
      <SearchableModal
        visible={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        title="Select Warehouse Location"
        options={warehouseLocations}
        selectedValue={formData.warehouseLocation}
        onSelect={(value: string) => handleChange("warehouseLocation", value)}
        getLabel={(w) => w.name}
        getValue={(w) => w._id}
        searchPlaceholder="Search warehouses..."
        emptyMessage="No warehouses found"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  formContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  pickerError: {
    borderColor: "#EF4444",
  },
  picker: {
    height: 50,
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  unitText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemProductName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  itemProductCode: {
    fontSize: 13,
    color: "#6B7280",
  },
  itemQuantities: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  quantityBox: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  quantitySubValue: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  inputWithControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  inputCenter: {
    textAlign: "center",
  },
  helperText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 40,
    textAlign: "right",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkboxLabelContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 2,
  },
  checkboxHelper: {
    fontSize: 11,
    color: "#047857",
    lineHeight: 16,
  },
  checkboxFinalBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  supplierCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  supplierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  supplierValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  searchPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    minHeight: 50,
  },
  searchPickerDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  searchPickerError: {
    borderColor: "#EF4444",
  },
  searchPickerText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  searchPickerPlaceholder: {
    color: "#9CA3AF",
  },
  perUnitWeightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  perUnitWeightLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    width: 28,
  },
  perUnitWeightUnit: {
    fontSize: 13,
    color: "#6B7280",
    width: 24,
  },
  perUnitWeightSum: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
    marginTop: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
});
