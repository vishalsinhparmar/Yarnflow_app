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
    TouchableOpacity,
    View,
} from "react-native";
import { getWarehouseName } from "../../constants/warehouseLocations";
import { grnAPI } from "../../services/grnAPI";

interface GRNItem {
  _id?: string;
  purchaseOrderItem?: string;
  product?: string;
  productName: string;
  subProductName?: string;
  productCode?: string;
  orderedQuantity: number;
  orderedWeight?: number;
  previouslyReceived?: number;
  previousWeight?: number;
  receivedQuantity: number;
  receivedWeight?: number;
  perUnitWeights?: number[];
  pendingQuantity?: number;
  pendingWeight?: number;
  unit: string;
  notes?: string;
  manuallyCompleted?: boolean;
  completionReason?: string;
}

interface GRNData {
  _id: string;
  grnNumber: string;
  purchaseOrder?: {
    _id: string;
    poNumber: string;
    supplier?: {
      companyName: string;
    };
    supplierDetails?: {
      companyName: string;
    };
  };
  poNumber?: string;
  supplier?: string;
  supplierDetails?: {
    companyName: string;
  };
  receiptDate: string;
  items: GRNItem[];
  status: string;
  receiptStatus: string;
  warehouseLocation: string;
  storageInstructions?: string;
  generalNotes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function GRNDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [grn, setGrn] = useState<GRNData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (id) {
      loadGRN();
    }
  }, [id]);

  const loadGRN = async () => {
    try {
      setLoading(true);
      console.log("🔗 Loading GRN:", id);

      const response = await grnAPI.getById(id);
      console.log("📋 GRN response:", response);

      if (response?.success && response?.data) {
        setGrn(response.data);
      } else {
        toast.showToast('error', 'Load Failed', 'Failed to load GRN details');
        router.back();
      }
    } catch (err: any) {
      console.error("❌ Error loading GRN:", err);
      toast.showToast('error', 'Load Failed', err.message || 'Failed to load GRN details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/grn/form?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete GRN",
      "Are you sure you want to delete this GRN? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await grnAPI.delete(id);
              toast.showToast('success', 'GRN Deleted', 'GRN has been permanently deleted.');
              router.back();
            } catch (err: any) {
              console.error("❌ Error deleting GRN:", err);
              toast.showToast('error', 'Delete Failed', err.message || 'Failed to delete GRN');
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Complete: "#10B981",
      Completed: "#10B981",
      Pending: "#F59E0B",
      Draft: "#6B7280",
      Approved: "#3B82F6",
      Received: "#3B82F6",
    };
    return statusColors[status] || "#6B7280";
  };

  const getReceiptStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Complete: "#10B981",
      Partial: "#F59E0B",
      Pending: "#6B7280",
    };
    return statusColors[status] || "#6B7280";
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading GRN details...</Text>
      </View>
    );
  }

  if (!grn) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>GRN not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GRN Details</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.headerEditButton}>
          <Ionicons name="create-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* GRN Header */}
        <View style={styles.section}>
          <View style={styles.grnHeader}>
            <View>
              <Text style={styles.grnNumber}>{grn.grnNumber || "N/A"}</Text>
              <Text style={styles.grnDate}>
                Created on{" "}
                {new Date(grn.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(grn.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(grn.status) },
                ]}
              >
                {grn.status || "Draft"}
              </Text>
            </View>
          </View>
        </View>

        {/* GRN Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GRN Information</Text>

          <View style={styles.infoGridNew}>
            {/* Row 1 */}
            <View style={styles.infoRowNew}>
              <View style={styles.infoCardNew}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="document-text" size={16} color="#10B981" />
                  <Text style={styles.infoLabelNew}>GRN Number</Text>
                </View>
                <Text style={styles.infoValueNew}>
                  {grn.grnNumber || "N/A"}
                </Text>
              </View>
              <View style={styles.infoCardNew}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="link" size={16} color="#3B82F6" />
                  <Text style={styles.infoLabelNew}>PO Reference</Text>
                </View>
                <Text style={styles.infoValueNew}>
                  {grn.purchaseOrder?.poNumber || "N/A"}
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.infoRowNew}>
              <View style={styles.infoCardNew}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="calendar" size={16} color="#F59E0B" />
                  <Text style={styles.infoLabelNew}>Receipt Date</Text>
                </View>
                <Text style={styles.infoValueNew}>
                  {grn.receiptDate
                    ? new Date(grn.receiptDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.infoCardNew}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="cube" size={16} color="#8B5CF6" />
                  <Text style={styles.infoLabelNew}>Items Count</Text>
                </View>
                <Text style={styles.infoValueNew}>
                  {grn.items?.length || 0} items
                </Text>
              </View>
            </View>

            {/* Status Row */}
            <View style={styles.statusRowNew}>
              <View style={styles.statusCardNew}>
                <Text style={styles.statusLabelNew}>Status</Text>
                <View
                  style={[
                    styles.statusBadgeNew,
                    { backgroundColor: getStatusColor(grn.status) },
                  ]}
                >
                  <Text style={styles.statusTextNew}>
                    {grn.status || "Draft"}
                  </Text>
                </View>
              </View>
              <View style={styles.statusCardNew}>
                <Text style={styles.statusLabelNew}>Receipt Status</Text>
                <View
                  style={[
                    styles.statusBadgeNew,
                    {
                      backgroundColor: getReceiptStatusColor(grn.receiptStatus),
                    },
                  ]}
                >
                  <Text style={styles.statusTextNew}>
                    {grn.receiptStatus || "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Supplier Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Information</Text>

          <View style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <Ionicons name="business" size={24} color="#10B981" />
              <Text style={styles.supplierName}>
                {grn.purchaseOrder?.supplierDetails?.companyName ||
                  grn.purchaseOrder?.supplier?.companyName ||
                  "Unknown Supplier"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Received */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Received</Text>

          {grn.items && grn.items.length > 0 ? (
            grn.items.map((item, index) => {
              const orderedQty = item.orderedQuantity || 0;
              const orderedWeight = item.orderedWeight || 0;
              const previousQty = item.previouslyReceived || 0;
              const previousWeight = item.previousWeight || 0;
              const receivedQty = item.receivedQuantity || 0;
              const receivedWeight = item.receivedWeight || 0;
              const pendingQty = orderedQty - previousQty - receivedQty;
              const pendingWeight =
                orderedWeight - previousWeight - receivedWeight;
              const completionPercentage =
                orderedQty > 0
                  ? Math.round(((previousQty + receivedQty) / orderedQty) * 100)
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
                    {item.productCode ? (
                      <Text style={styles.itemProductCode}>
                        {item.productCode}
                      </Text>
                    ) : null}
                  </View>

                  {/* Per-Unit Weights */}
                  {item.perUnitWeights && item.perUnitWeights.length > 0 && (
                    <View style={styles.perUnitWeightsContainer}>
                      <Text style={styles.perUnitWeightsLabel}>Per-unit weights:</Text>
                      <View style={styles.perUnitWeightsRow}>
                        {item.perUnitWeights.map((w, wi) => (
                          <View key={wi} style={styles.perUnitWeightChip}>
                            <Text style={styles.perUnitWeightChipText}>#{wi + 1}: {w.toFixed(2)} kg</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Quantities Grid */}
                  <View style={styles.quantitiesGrid}>
                    <View style={styles.quantityBox}>
                      <Text style={styles.quantityLabel}>Ordered</Text>
                      <Text style={styles.quantityValue}>
                        {orderedQty} {item.unit}
                      </Text>
                      {orderedWeight > 0 && (
                        <Text style={styles.quantitySubValue}>
                          {orderedWeight.toFixed(2)} kg
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.quantityBox,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Text style={styles.quantityLabel}>
                        Previously Received
                      </Text>
                      <Text
                        style={[styles.quantityValue, { color: "#1E40AF" }]}
                      >
                        {previousQty} {item.unit}
                      </Text>
                      {orderedWeight > 0 && (
                        <Text
                          style={[
                            styles.quantitySubValue,
                            { color: "#1E40AF" },
                          ]}
                        >
                          {previousWeight.toFixed(2)} kg
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.quantityBox,
                        { backgroundColor: "#D1FAE5" },
                      ]}
                    >
                      <Text style={styles.quantityLabel}>This GRN</Text>
                      <Text
                        style={[styles.quantityValue, { color: "#065F46" }]}
                      >
                        {receivedQty} {item.unit}
                      </Text>
                      {orderedWeight > 0 && (
                        <Text
                          style={[
                            styles.quantitySubValue,
                            { color: "#065F46" },
                          ]}
                        >
                          {receivedWeight.toFixed(2)} kg
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
                        {Math.max(0, pendingQty)} {item.unit}
                      </Text>
                      {orderedWeight > 0 && (
                        <Text
                          style={[
                            styles.quantitySubValue,
                            { color: "#92400E" },
                          ]}
                        >
                          {Math.max(0, pendingWeight).toFixed(2)} kg
                        </Text>
                      )}
                    </View>
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

                  {/* Manual Completion Badge */}
                  {item.manuallyCompleted && (
                    <View style={styles.manualCompletionBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                      <Text style={styles.manualCompletionText}>
                        Manually Completed
                      </Text>
                      {item.completionReason && (
                        <Text style={styles.completionReasonText}>
                          {item.completionReason}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Item Notes */}
                  {item.notes && (
                    <View style={styles.itemNotes}>
                      <Text style={styles.itemNotesLabel}>Notes:</Text>
                      <Text style={styles.itemNotesText}>{item.notes}</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.noItemsText}>No items found</Text>
          )}
        </View>

        {/* Warehouse Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse Information</Text>

          <View style={styles.warehouseCard}>
            <View style={styles.warehouseRow}>
              <Ionicons name="location" size={20} color="#10B981" />
              <View style={styles.warehouseInfo}>
                <Text style={styles.warehouseLabel}>Warehouse Location</Text>
                <Text style={styles.warehouseValue}>
                  {getWarehouseName(grn.warehouseLocation)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Storage Instructions */}
        {grn.storageInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Instructions</Text>

            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text" size={20} color="#10B981" />
                <Text style={styles.notesLabel}>Special Instructions</Text>
              </View>
              <Text style={styles.notesText}>{grn.storageInstructions}</Text>
            </View>
          </View>
        )}

        {/* Additional Information */}
        {grn.generalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.notesLabel}>General Notes</Text>
              </View>
              <Text style={styles.notesText}>{grn.generalNotes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {/* <View style={styles.section}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/grn/form?id=${grn._id}`)}
            >
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#10B981",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  headerBackButton: {
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
  headerEditButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
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
  grnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  grnNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  grnDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoGrid: {
    gap: 16,
  },
  infoGridNew: {
    gap: 12,
  },
  infoRowNew: {
    flexDirection: "row",
    gap: 12,
  },
  infoCardNew: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoLabelNew: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    fontWeight: "500",
  },
  infoValueNew: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  statusRowNew: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  statusCardNew: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusLabelNew: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  statusBadgeNew: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTextNew: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: "600",
  },
  supplierCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  supplierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
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
  quantitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  quantityBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
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
  itemNotes: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
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
  manualCompletionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    flexWrap: "wrap",
  },
  manualCompletionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
    marginLeft: 8,
  },
  completionReasonText: {
    fontSize: 12,
    color: "#047857",
    marginTop: 4,
    width: "100%",
    marginLeft: 24,
  },
  noItemsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },
  warehouseCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  warehouseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  warehouseValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  notesCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  notesText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#10B981",
    marginBottom: 12,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  perUnitWeightsContainer: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  perUnitWeightsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  perUnitWeightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  perUnitWeightChip: {
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  perUnitWeightChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
});
