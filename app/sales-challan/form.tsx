import DatePickerInput from "@/components/DatePickerInput";
import SearchableModal from "@/components/SearchableModal";
import { BORDER_RADIUS, COLORS, SPACING } from "@/constants/colors";
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
import { useToast } from "@/components/ui/Toast";
import { useWarehouseLocations } from "../../hooks/useWarehouseLocations";
import { salesChallanAPI } from "../../services/salesChallanAPI";
import { salesOrderAPI } from "../../services/salesOrderAPI";

interface ChallanItem {
  salesOrderItem: string;
  product?: string;
  productName: string;
  subProduct?: string;
  subProductName?: string;
  productCode?: string;
  orderedQuantity: number;
  dispatchQuantity: number;
  previouslyDispatched: number;
  pendingQuantity: number;
  unit: string;
  weight: number;
  weightPerUnit?: number;
  subProductWeights?: number[];
  markAsComplete?: boolean;
  notes?: string;
}

interface ChallanFormData {
  salesOrder: string | string[];
  challanDate: string;
  expectedDeliveryDate: string;
  warehouseLocation: string;
  notes: string;
  items: ChallanItem[];
}

interface SalesOrder {
  _id: string;
  soNumber: string;
  customer: any;
  items: any[];
  status: string;
}

export default function SalesChallanFormScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id, soId } = useLocalSearchParams();
  const isEditMode = !!id;

  const { locations: warehouseLocations } = useWarehouseLocations();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [soPage, setSoPage] = useState(1);
  const [soHasMore, setSoHasMore] = useState(false);
  const [soLoadingMore, setSoLoadingMore] = useState(false);
  const [soSearch, setSoSearch] = useState('');
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [loadingSOs, setLoadingSOs] = useState(true);
  const [dispatchedQuantities, setDispatchedQuantities] = useState<{
    [key: string]: number;
  }>({});

  const [formData, setFormData] = useState<ChallanFormData>({
    salesOrder: soId || "",
    challanDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    warehouseLocation: "",
    notes: "",
    items: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal states for custom pickers
  const [showSOModal, setShowSOModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Load sales orders
  useEffect(() => {
    loadSalesOrders();
  }, []);

  // Load challan if editing
  useEffect(() => {
    if (isEditMode) {
      loadChallan();
    }
  }, [id]);

  // Handle pre-selected SO
  useEffect(() => {
    if (soId && !isEditMode) {
      handleSOSelection(Array.isArray(soId) ? soId[0] : soId as string);
    }
  }, [soId]);

  const SC_PAGE_LIMIT = 50;

  const loadSalesOrders = async (search = '', page = 1, append = false) => {
    try {
      if (!append) setLoadingSOs(true);
      else setSoLoadingMore(true);
      console.log("🔗 Loading sales orders...");

      const params: any = { limit: SC_PAGE_LIMIT, page };
      if (search) params.search = search;
      const response = await salesOrderAPI.getAll(params);
      console.log("📦 SOs response:", response);

      if (response?.success && response?.data) {
        // Filter out fully delivered/cancelled SOs
        const incompleteSOs = response.data.filter(
          (so: SalesOrder) => so.status !== "Delivered" && so.status !== "Cancelled",
        );
        if (append) {
          setSalesOrders(prev => [...prev, ...incompleteSOs]);
        } else {
          setSalesOrders(incompleteSOs);
        }
        const pagination = response.pagination;
        const hasMore = pagination ? page < pagination.pages : response.data.length === SC_PAGE_LIMIT;
        setSoHasMore(hasMore);
        setSoPage(page);
        setSoSearch(search);
        console.log(`✅ Loaded ${incompleteSOs.length} incomplete SOs`);
      } else {
        if (!append) setSalesOrders([]);
      }
    } catch (error) {
      console.error("❌ Error loading SOs:", error);
      if (!append) setSalesOrders([]);
    } finally {
      setLoadingSOs(false);
      setSoLoadingMore(false);
    }
  };

  const handleSOSearch = (query: string) => {
    loadSalesOrders(query, 1, false);
  };

  const handleSOLoadMore = () => {
    if (!soLoadingMore && soHasMore) {
      loadSalesOrders(soSearch, soPage + 1, true);
    }
  };

  const loadChallan = async () => {
    try {
      setLoading(true);
      const response = await salesChallanAPI.getById(id);

      if (response?.success && response?.data) {
        const challan = response.data;
        setFormData({
          salesOrder: challan.salesOrder?._id || "",
          challanDate: challan.challanDate
            ? new Date(challan.challanDate).toISOString().split("T")[0]
            : "",
          expectedDeliveryDate: challan.expectedDeliveryDate
            ? new Date(challan.expectedDeliveryDate).toISOString().split("T")[0]
            : "",
          warehouseLocation: challan.warehouseLocation || "",
          notes: challan.notes || "",
          items:
            challan.items?.map((item: any) => ({
              salesOrderItem: item.salesOrderItem || item._id,
              product: item.product?._id,
              productName: item.productName,
              productCode: item.productCode,
              orderedQuantity: item.orderedQuantity,
              dispatchQuantity: item.dispatchQuantity || 0,
              previouslyDispatched: 0,
              pendingQuantity: 0,
              unit: item.unit,
              weight: item.weight || 0,
              markAsComplete: item.markAsComplete || false,
              notes: item.notes || "",
            })) || [],
        });

        if (challan.salesOrder) {
          setSelectedSO(challan.salesOrder);
        }
      }
    } catch (error) {
      console.error("❌ Error loading challan:", error);
      toast.showToast('error', 'Load Failed', 'Failed to load challan details');
    } finally {
      setLoading(false);
    }
  };

  const handleSOSelection = async (soId: string) => {
    if (!soId) {
      setSelectedSO(null);
      setFormData((prev) => ({
        ...prev,
        salesOrder: "",
        items: [],
      }));
      return;
    }

    try {
      console.log("🔗 Loading SO details:", soId);

      // Load SO and dispatched quantities in parallel
      const [soResponse, dispatchedResponse] = await Promise.all([
        salesOrderAPI.getById(soId),
        salesChallanAPI.getAll({ salesOrder: soId }),
      ]);

      if (soResponse?.success && soResponse?.data) {
        const so = soResponse.data;
        setSelectedSO(so);
        console.log("📦 SO loaded:", so.soNumber);

        // Build dispatched map
        const dispatchedMap: { [key: string]: number } = {};
        if (dispatchedResponse?.success && dispatchedResponse?.data) {
          dispatchedResponse.data.forEach((challan: any) => {
            if (challan.items) {
              challan.items.forEach((item: any) => {
                const itemId =
                  item.salesOrderItem?.toString() || item._id?.toString();
                if (itemId) {
                  dispatchedMap[itemId] =
                    (dispatchedMap[itemId] || 0) + (item.dispatchQuantity || 0);
                }
              });
            }
          });
        }
        setDispatchedQuantities(dispatchedMap);

        // Populate items
        const items = so.items
          .map((item: any) => {
            const dispatched = dispatchedMap[item._id] || 0;
            const remaining = Math.max(0, item.quantity - dispatched);
            const weightPerUnit = item.weight / item.quantity;
            const remainingWeight = remaining * weightPerUnit;

            return {
              salesOrderItem: item._id,
              product: item.product?._id,
              productName: item.product?.productName || item.productName,
              subProduct: item.subProduct?._id || item.subProduct || '',
              subProductName: item.subProductName || item.subProduct?.name || '',
              productCode: item.product?.productCode || item.productCode,
              orderedQuantity: item.quantity,
              dispatchQuantity: remaining,
              previouslyDispatched: dispatched,
              pendingQuantity: 0,
              unit: item.unit,
              weight: remainingWeight,
              weightPerUnit: weightPerUnit,
              subProductWeights: Array.from({ length: remaining }, () => parseFloat((weightPerUnit).toFixed(3))),
              markAsComplete: false,
              notes: item.notes || "",
            };
          })
          .filter(
            (item: any) => item.orderedQuantity - item.previouslyDispatched > 0,
          );

        setFormData((prev) => ({
          ...prev,
          salesOrder: soId,
          items,
        }));

        console.log(`✅ Loaded ${items.length} pending items`);
      }
    } catch (error) {
      console.error("❌ Error loading SO:", error);
      toast.showToast('error', 'Load Failed', 'Failed to load SO details');
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

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate weight and pending
    if (field === "dispatchQuantity") {
      const item = updatedItems[index];
      const quantity = Number(value) || 0;
      updatedItems[index].pendingQuantity =
        item.orderedQuantity - item.previouslyDispatched - quantity;
      if (item.subProduct) {
        // Resize per-unit weights array and recalculate total
        const current = Array.isArray(item.subProductWeights) ? item.subProductWeights : [];
        const wpu = item.weightPerUnit || 0;
        const next = Array.from({ length: quantity }, (_, i) =>
          i < current.length ? current[i] : parseFloat(wpu.toFixed(3))
        );
        updatedItems[index].subProductWeights = next;
        updatedItems[index].weight = next.reduce((s, w) => s + (Number(w) || 0), 0);
      } else {
        updatedItems[index].weight = quantity * (item.weightPerUnit || 0);
      }
    }

    if (field === "subProductWeight") {
      // value = { unitIdx, weight }
      const { unitIdx, weight } = value as { unitIdx: number; weight: number };
      const item = updatedItems[index];
      const weights = [...(item.subProductWeights || [])];
      weights[unitIdx] = weight;
      updatedItems[index].subProductWeights = weights;
      updatedItems[index].weight = weights.reduce((s, w) => s + (Number(w) || 0), 0);
    }

    if (field === "weight") {
      updatedItems[index].weight = Number(value) || 0;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.salesOrder) {
      newErrors.salesOrder = "Sales Order is required";
    }

    if (!formData.challanDate) {
      newErrors.challanDate = "Challan date is required";
    }

    if (!formData.warehouseLocation) {
      newErrors.warehouseLocation = "Warehouse Location is required";
    }

    // Check if at least one item has dispatch quantity
    let hasAtLeastOneItem = false;
    formData.items.forEach((item: any, index: number) => {
      if (item.dispatchQuantity > 0) {
        hasAtLeastOneItem = true;

        // Check if dispatching more than pending
        const maxAllowed = item.orderedQuantity - item.previouslyDispatched;
        if (item.dispatchQuantity > maxAllowed) {
          newErrors[`items.${index}.dispatchQuantity`] =
            `Cannot dispatch more than pending (${maxAllowed} ${item.unit})`;
        }

        // Check if total weight exceeds the remaining weight for the SO item
        const maxWeight = maxAllowed * (item.weightPerUnit || 0);
        if (maxWeight > 0 && item.weight > maxWeight) {
          newErrors[`items.${index}.weight`] =
            `Weight exceeds pending ${maxWeight.toFixed(2)} kg`;
        }
      }
    });

    if (!hasAtLeastOneItem) {
      newErrors.items = "Please enter dispatch quantity for at least one item";
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
      console.log("📦 Submitting challan:", formData);

      const submitData = {
        salesOrder: formData.salesOrder,
        challanDate: formData.challanDate,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        warehouseLocation: formData.warehouseLocation,
        notes: formData.notes,
        items: formData.items
          .filter((item: any) => item.dispatchQuantity > 0)
          .map((item: any) => ({
            salesOrderItem: item.salesOrderItem,
            product: item.product,
            productName: item.productName,
            productCode: item.productCode,
            subProduct: item.subProduct || undefined,
            subProductName: item.subProductName || undefined,
            orderedQuantity: item.orderedQuantity,
            dispatchQuantity: Number(item.dispatchQuantity),
            unit: item.unit,
            weight: Number(item.weight),
            subProductWeights: item.subProduct
              ? (item.subProductWeights || []).filter((w: any) => Number(w) > 0)
              : undefined,
            markAsComplete: item.markAsComplete || false,
            notes: item.notes || "",
          })),
      };

      let response;
      if (isEditMode) {
        response = await salesChallanAPI.update(id, submitData);
      } else {
        response = await salesChallanAPI.create(submitData);
      }

      console.log("✅ Challan response:", response);

      if (response?.success) {
        toast.showToast('success', isEditMode ? 'Challan Updated' : 'Challan Created', `Challan ${isEditMode ? 'updated' : 'created'} successfully!`);
        setTimeout(() => router.back(), 800);
      } else {
        throw new Error(response?.message || "Failed to save challan");
      }
    } catch (error: any) {
      console.error("❌ Error submitting challan:", error);
      toast.showToast('error', 'Save Failed', error?.message || 'Failed to save challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
          {isEditMode ? "Edit Challan" : "Create Sales Challan"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Sales Order */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sales Order *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                isEditMode && styles.pickerButtonDisabled,
              ]}
              onPress={() => !isEditMode && !loadingSOs && setShowSOModal(true)}
              disabled={isEditMode || loadingSOs}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.salesOrder && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {loadingSOs
                  ? "Loading..."
                  : selectedSO
                    ? `${selectedSO.soNumber} - ${selectedSO.customer?.companyName || "Unknown"}`
                    : "Select Sales Order"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {errors.salesOrder && (
              <Text style={styles.errorText}>{errors.salesOrder}</Text>
            )}
          </View>

          {/* Challan Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Challan Date *</Text>
            <DatePickerInput
              label="Challan Date"
              value={formData.challanDate}
              onChange={(value) => handleChange("challanDate", value)}
              placeholder="Select challan date"
            />
            {errors.challanDate && (
              <Text style={styles.errorText}>{errors.challanDate}</Text>
            )}
          </View>

          {/* Expected Delivery Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Expected Delivery Date</Text>
            <DatePickerInput
              label="Expected Delivery Date"
              value={formData.expectedDeliveryDate}
              onChange={(value) => handleChange("expectedDeliveryDate", value)}
              placeholder="Select expected delivery date (Optional)"
            />
          </View>
        </View>

        {/* Dispatch Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispatch Information</Text>

          {/* Warehouse Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Warehouse Location *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowWarehouseModal(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !formData.warehouseLocation && styles.placeholderText,
                ]}
              >
                {formData.warehouseLocation
                  ? warehouseLocations.find(
                      (w: any) => w._id === formData.warehouseLocation,
                    )?.name || "Select Warehouse"
                  : "Select Warehouse Location"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {errors.warehouseLocation && (
              <Text style={styles.errorText}>{errors.warehouseLocation}</Text>
            )}
          </View>

          {/* Dispatch Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Dispatch Notes</Text>
            <TextInput
              style={styles.input}
              value={formData.notes}
              onChangeText={(value) => handleChange("notes", value)}
              placeholder="Special dispatch instructions (optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Items to Dispatch */}
        {selectedSO && formData.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items to Dispatch</Text>
            {errors.items && (
              <Text style={styles.errorText}>{errors.items}</Text>
            )}

            {formData.items.map((item: any, index: number) => {
              const baseProductName = item.productName || 'Unknown';
              const subName = item.subProductName || item.subProduct?.name;
              const displayProductName = subName ? `${baseProductName} X ${subName}` : baseProductName;
              return (
              <View key={index} style={styles.itemCard}>
                {/* Product Info */}
                <View style={styles.itemHeader}>
                  <Text style={styles.itemProductName}>{displayProductName}</Text>
                  <Text style={styles.itemProductCode}>{item.productCode}</Text>
                </View>

                {/* Quantities */}
                <View style={styles.itemQuantities}>
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>Ordered</Text>
                    <Text style={styles.quantityValue}>
                      {item.orderedQuantity} {item.unit}
                    </Text>
                  </View>

                  <View
                    style={[styles.quantityBox, { backgroundColor: "#DBEAFE" }]}
                  >
                    <Text style={styles.quantityLabel}>Prev. Dispatched</Text>
                    <Text style={[styles.quantityValue, { color: "#1E40AF" }]}>
                      {item.previouslyDispatched || 0} {item.unit}
                    </Text>
                  </View>

                  <View
                    style={[styles.quantityBox, { backgroundColor: "#FEF3C7" }]}
                  >
                    <Text style={styles.quantityLabel}>Pending</Text>
                    <Text style={[styles.quantityValue, { color: "#92400E" }]}>
                      {item.orderedQuantity - (item.previouslyDispatched || 0)}{" "}
                      {item.unit}
                    </Text>
                  </View>
                </View>

                {/* Dispatching Now */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Dispatching Now *</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={String(item.dispatchQuantity)}
                      onChangeText={(value) =>
                        handleItemChange(index, "dispatchQuantity", value)
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </View>
                  {errors[`items.${index}.dispatchQuantity`] && (
                    <Text style={styles.errorText}>
                      {errors[`items.${index}.dispatchQuantity`]}
                    </Text>
                  )}
                </View>

                {/* Weight / Per-unit weights */}
                {item.subProduct ? (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Sub-Product Weights (kg)</Text>
                    <View style={styles.perUnitWeightsGrid}>
                      {(item.subProductWeights || []).map((w, unitIdx) => (
                        <View key={unitIdx} style={styles.perUnitWeightBox}>
                          <Text style={styles.perUnitWeightLabel}>Unit {unitIdx + 1}</Text>
                          <TextInput
                            style={styles.perUnitWeightInput}
                            value={String(w)}
                            onChangeText={(value) =>
                              handleItemChange(index, "subProductWeight", {
                                unitIdx,
                                weight: parseFloat(value) || 0,
                              })
                            }
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        Total: <Text style={{ fontWeight: '600', color: '#111827' }}>{Number(item.weight || 0).toFixed(2)} kg</Text>
                      </Text>
                    </View>
                    {errors[`items.${index}.weight`] && (
                      <Text style={styles.errorText}>{errors[`items.${index}.weight`]}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(item.weight)}
                      onChangeText={(value) =>
                        handleItemChange(index, "weight", value)
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                    {errors[`items.${index}.weight`] && (
                      <Text style={styles.errorText}>{errors[`items.${index}.weight`]}</Text>
                    )}
                  </View>
                )}

                {/* Mark as Complete */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() =>
                    handleItemChange(
                      index,
                      "markAsComplete",
                      !item.markAsComplete,
                    )
                  }
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
                  <Text style={styles.checkboxLabel}>Mark as Complete</Text>
                </TouchableOpacity>

                {/* Item Notes */}
                {item.notes && (
                  <View style={styles.itemNotes}>
                    <Text style={styles.itemNotesLabel}>SO Notes:</Text>
                    <Text style={styles.itemNotesText}>{item.notes}</Text>
                  </View>
                )}
              </View>
              );
            })}
          </View>
        )}

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
          disabled={submitting || !selectedSO}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? "Update Challan" : "Create Challan"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sales Order Modal */}
      <SearchableModal
        visible={showSOModal}
        onClose={() => setShowSOModal(false)}
        title="Select Sales Order"
        options={salesOrders}
        selectedValue={Array.isArray(formData.salesOrder) ? formData.salesOrder[0] : formData.salesOrder as string}
        onSelect={(value: string) => {
          handleChange("salesOrder", value);
          handleSOSelection(value);
        }}
        getLabel={(so: any) => so.soNumber}
        getValue={(so: any) => so._id}
        getSubtitle={(so: any) => `${so.customer?.companyName || "Unknown"} • ${so.status}`}
        searchPlaceholder="Search by SO number or customer..."
        emptyMessage="No sales orders available"
        loading={loadingSOs}
        onSearch={handleSOSearch}
        onLoadMore={handleSOLoadMore}
        loadingMore={soLoadingMore}
        hasMore={soHasMore}
      />

      {/* Warehouse Modal */}
      <SearchableModal
        visible={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        title="Select Warehouse Location"
        options={warehouseLocations}
        selectedValue={formData.warehouseLocation}
        onSelect={(value: string) => handleChange("warehouseLocation", value)}
        getLabel={(w: any) => w.name}
        getValue={(w: any) => w._id}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  itemNotes: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  itemNotesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  itemNotesText: {
    fontSize: 13,
    color: "#78350F",
  },
  perUnitWeightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perUnitWeightBox: {
    width: '31%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  perUnitWeightLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  perUnitWeightInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    textAlign: 'center',
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
    backgroundColor: "#8B5CF6",
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
  // Modal Picker Styles
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: "#fff",
    minHeight: 48,
  },
  pickerButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedOption: {
    backgroundColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  optionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  emptyListText: {
    textAlign: "center",
    padding: SPACING.xl,
    color: "#6B7280",
    fontSize: 14,
  },
});
