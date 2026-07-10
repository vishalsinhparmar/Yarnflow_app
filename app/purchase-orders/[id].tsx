import { COLORS, SPACING } from "@/constants/colors";
import { useToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    poFormatters,
    purchaseOrderAPI,
} from "../../services/purchaseOrderAPI.js";

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: {
    _id: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
  category: {
    _id: string;
    categoryName: string;
  };
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: POItem[];
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface POItem {
  _id: string;
  product: {
    _id: string;
    productName: string;
  };
  subProduct?: { _id: string; name: string };
  subProductName?: string;
  quantity: number;
  unit: string;
  weight: number;
  perUnitWeights?: number[];
  receivedQuantity?: number;
  receivedWeight?: number;
  pendingQuantity?: number;
  notes?: string;
  manuallyCompleted?: boolean;
  completionReason?: string;
}

export default function PurchaseOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const toast = useToast();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPurchaseOrder();
    }
  }, [id]);

  const loadPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderAPI.getById(id as string);
      if (response?.success) {
        setPurchaseOrder(response.data);
      } else {
        toast.showToast('error', 'Not Found', 'Purchase order not found');
        router.back();
      }
    } catch (err: any) {
      console.error("Error loading PO:", err);
      toast.showToast('error', 'Load Failed', err.message || 'Failed to load purchase order');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: "/purchase-orders/form",
      params: { id: purchaseOrder?._id },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading purchase order...</Text>
      </View>
    );
  }

  if (!purchaseOrder) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={64} color={COLORS.gray400} />
        <Text style={styles.errorText}>Purchase order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = poFormatters.status(purchaseOrder.status);
  const isOverdue = poFormatters.isOverdue(
    purchaseOrder.expectedDeliveryDate,
    purchaseOrder.status,
  );
  const totalWeight =
    purchaseOrder.items?.reduce((sum, item) => sum + (item.weight || 0), 0) ||
    0;
  const totalReceivedWeight =
    purchaseOrder.items?.reduce(
      (sum, item) => sum + (item.receivedWeight || 0),
      0,
    ) || 0;

  // Calculate completion percentage
  const totalQuantity =
    purchaseOrder.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
    0;
  const totalReceived =
    purchaseOrder.items?.reduce(
      (sum, item) => sum + (item.receivedQuantity || 0),
      0,
    ) || 0;
  const completionPercentage =
    totalQuantity > 0 ? Math.round((totalReceived / totalQuantity) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Purchase Order</Text>
          <Text style={styles.headerSubtitle}>{purchaseOrder.poNumber}</Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
        >
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Completion Progress */}
        {completionPercentage > 0 && (
          <View style={styles.section}>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Order Completion</Text>
                <Text style={styles.progressPercentage}>
                  {completionPercentage}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${completionPercentage}%`,
                      backgroundColor:
                        completionPercentage === 100 ? "#10B981" : "#3B82F6",
                    },
                  ]}
                />
              </View>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatLabel}>Received</Text>
                  <Text style={styles.progressStatValue}>
                    {totalReceived} / {totalQuantity}
                  </Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatLabel}>Weight</Text>
                  <Text style={styles.progressStatValue}>
                    {totalReceivedWeight.toFixed(2)} / {totalWeight.toFixed(2)}{" "}
                    kg
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.infoGrid}>
            {/* Row 1 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="document-text" size={16} color="#6366F1" />
                  <Text style={styles.infoLabel}>PO Number</Text>
                </View>
                <Text style={styles.infoValue}>{purchaseOrder.poNumber}</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                  <Text style={styles.infoLabel}>Order Date</Text>
                </View>
                <Text style={styles.infoValue}>
                  {poFormatters.date(purchaseOrder.orderDate)}
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="time" size={16} color="#F59E0B" />
                  <Text style={styles.infoLabel}>Expected Delivery</Text>
                </View>
                <Text
                  style={[styles.infoValue, isOverdue && { color: "#EF4444" }]}
                >
                  {purchaseOrder.expectedDeliveryDate
                    ? poFormatters.date(purchaseOrder.expectedDeliveryDate)
                    : "Not Set"}
                  {isOverdue && " (Overdue)"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="business" size={16} color="#10B981" />
                  <Text style={styles.infoLabel}>Supplier</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {purchaseOrder.supplier?.companyName ||
                    (typeof purchaseOrder.supplier === 'string' ? purchaseOrder.supplier : null) ||
                    "N/A"}
                </Text>
              </View>
            </View>

            {/* Row 3 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="pricetag" size={16} color="#8B5CF6" />
                  <Text style={styles.infoLabel}>Category</Text>
                </View>
                <Text style={styles.infoValue}>
                  {purchaseOrder.category?.categoryName ||
                    (typeof purchaseOrder.category === 'string' ? purchaseOrder.category : null) ||
                    "N/A"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="scale" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Total Weight</Text>
                </View>
                <Text style={styles.infoValue}>
                  {(totalWeight || 0).toFixed(2)} Kg
                </Text>
              </View>
            </View>

            {/* Row 4 - Received Info */}
            {totalReceivedWeight > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.infoLabel}>Received Weight</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: "#10B981" }]}>
                    {(totalReceivedWeight || 0).toFixed(2)} Kg
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconRow}>
                    <Ionicons name="person" size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Created By</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {purchaseOrder.createdBy || "Admin"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Items ({purchaseOrder.items?.length || 0})
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>PRODUCT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
                QUANTITY
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
                WEIGHT (KG)
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
            </View>

            {purchaseOrder.items?.map((item, index) => {
              const baseProductName =
                item.product?.productName || (typeof item.product === 'string' ? item.product : 'Unknown');
              const subName = item.subProductName || item.subProduct?.name;
              const productName = subName ? `${baseProductName} X ${subName}` : baseProductName;
              const receivedQty = item.receivedQuantity || 0;
              const completion =
                item.quantity > 0
                  ? Math.round((receivedQty / item.quantity) * 100)
                  : 0;
              const itemStatus =
                completion === 100
                  ? "Complete"
                  : completion > 0
                    ? "Partial"
                    : "Draft";

              return (
                <View key={item._id || index} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.productName}>{productName}</Text>
                    {item.notes && (
                      <Text style={styles.itemNotesText}>📝 {item.notes}</Text>
                    )}
                    {receivedQty > 0 && (
                      <Text style={styles.receivedText}>
                        ✓ Received: {receivedQty}/{item.quantity} {item.unit}
                      </Text>
                    )}
                    {item.manuallyCompleted && (
                      <Text style={[styles.receivedText, { color: "#10B981" }]}>
                        ✓ Manually Completed
                      </Text>
                    )}
                    {item.perUnitWeights && item.perUnitWeights.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {item.perUnitWeights.map((w, wi) => (
                          <View key={wi} style={{ backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10, color: '#065F46', fontWeight: '600' }}>#{wi+1}: {w.toFixed(1)}kg</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tableText}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>

                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tableText}>
                      {(item.weight || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        {
                          backgroundColor:
                            itemStatus === "Complete"
                              ? "#10B981"
                              : itemStatus === "Partial"
                                ? "#F59E0B"
                                : "#6366F1",
                        },
                      ]}
                    >
                      <Text style={styles.itemStatusText}>{itemStatus}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        {purchaseOrder.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{purchaseOrder.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {purchaseOrder.status !== "Fully_Received" && (
            <TouchableOpacity
              style={styles.createGRNButton}
              onPress={() => router.push(`/grn/form?poId=${purchaseOrder._id}`)}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.createGRNButtonText}>Create GRN</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButtonBottom}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonBottomText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#6366F1",
    paddingTop: 48,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#E0E7FF",
    marginTop: 4,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  scrollView: { flex: 1 },
  section: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  infoGrid: { gap: 12 },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    fontWeight: "500",
  },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  productName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemNotesText: {
    fontSize: 11,
    color: "#3B82F6",
    marginTop: 4,
    fontStyle: "italic",
  },
  tableText: { fontSize: 13, color: "#111827" },
  receivedText: { fontSize: 11, color: "#10B981", marginTop: 2 },
  receivedWeightText: { fontSize: 10, color: "#10B981", marginTop: 1 },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  completionText: { fontSize: 11, color: "#6B7280", textAlign: "center" },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  itemStatusText: { fontSize: 11, fontWeight: "600", color: "#FFF" },
  notesText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
  actions: { padding: 16, paddingBottom: 32, gap: 12 },
  createGRNButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 8,
  },
  createGRNButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  closeButtonBottom: {
    backgroundColor: "#6B7280",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonBottomText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  progressSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10B981",
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  progressStat: {
    alignItems: "center",
  },
  progressStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
