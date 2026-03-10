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
import { salesChallanAPI } from "../../services/salesChallanAPI";

export default function SalesChallanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (id) {
      loadChallan();
    }
  }, [id]);

  const loadChallan = async () => {
    try {
      setLoading(true);
      // Use getAll with ID filter instead of getById to avoid backend auto-populate bug
      const response = await salesChallanAPI.getAll({
        _id: id,
        populate: "salesOrder,salesOrder.customer",
      });
      if (response?.success && response?.data && response.data.length > 0) {
        setChallan(response.data[0]);
      } else {
        toast.showToast('error', 'Not Found', 'Challan not found');
        router.back();
      }
    } catch (err: any) {
      console.error("Error loading challan:", err);
      toast.showToast('error', 'Load Failed', err.message || 'Failed to load challan');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const result = await salesChallanAPI.downloadPDF(
        id,
        challan?.challanNumber,
      );
      if (result.success) {
        // PDF will be shared/opened automatically by the API
      } else {
        Alert.alert("Info", result.message || "PDF downloaded");
      }
    } catch (error: any) {
      console.error("❌ Error downloading PDF:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to download PDF. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      Delivered: "#10B981",
      Partial: "#F59E0B",
      Pending: "#6B7280",
      Complete: "#10B981",
    };
    return statusColors[status] || "#6B7280";
  };

  const getChallanStatus = () => {
    if (!challan || !challan.items || challan.items.length === 0)
      return "Pending";

    let allItemsComplete = true;
    let anyItemPartial = false;

    challan.items.forEach((item: any) => {
      const dispatched = item.dispatchQuantity || 0;
      const ordered = item.orderedQuantity || 0;
      const manuallyCompleted = item.manuallyCompleted || false;

      if (manuallyCompleted || dispatched >= ordered) {
        // Complete
      } else if (dispatched > 0 && dispatched < ordered) {
        allItemsComplete = false;
        anyItemPartial = true;
      } else {
        allItemsComplete = false;
      }
    });

    if (allItemsComplete) return "Delivered";
    if (anyItemPartial) return "Partial";
    return "Pending";
  };

  const getItemStatus = (item: any) => {
    const dispatched = item.dispatchQuantity || 0;
    const ordered = item.orderedQuantity || 0;
    const manuallyCompleted = item.manuallyCompleted || false;

    if (manuallyCompleted || dispatched >= ordered) {
      return "Complete";
    } else if (dispatched > 0 && dispatched < ordered) {
      return "Partial";
    }
    return "Pending";
  };

  const getItemCompletion = (item: any) => {
    const dispatched = item.dispatchQuantity || 0;
    const ordered = item.orderedQuantity || 0;

    if (ordered === 0) return 0;
    return Math.round((dispatched / ordered) * 100);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading challan details...</Text>
      </View>
    );
  }

  if (!challan) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Challan not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const challanStatus = getChallanStatus();

  // Calculate totals
  const totalDispatchedQty =
    challan?.items?.reduce(
      (sum: number, item: any) => sum + (item.dispatchQuantity || 0),
      0,
    ) || 0;
  const totalOrderedQty =
    challan?.items?.reduce(
      (sum: number, item: any) => sum + (item.orderedQuantity || 0),
      0,
    ) || 0;
  const totalWeight =
    challan?.items?.reduce(
      (sum: number, item: any) => sum + (item.weight || 0),
      0,
    ) || 0;
  const completionPercentage =
    totalOrderedQty > 0
      ? Math.round((totalDispatchedQty / totalOrderedQty) * 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* Header - Matching PO Detail Style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sales Challan</Text>
          <Text style={styles.headerSubtitle}>{challan.challanNumber}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(challanStatus) },
          ]}
        >
          <Text style={styles.statusText}>{challanStatus}</Text>
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
                <Text style={styles.progressLabel}>Dispatch Completion</Text>
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
                        completionPercentage === 100 ? "#10B981" : "#8B5CF6",
                    },
                  ]}
                />
              </View>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatLabel}>Dispatched</Text>
                  <Text style={styles.progressStatValue}>
                    {totalDispatchedQty} / {totalOrderedQty}
                  </Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatLabel}>Weight</Text>
                  <Text style={styles.progressStatValue}>
                    {totalWeight.toFixed(2)} kg
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Challan Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challan Information</Text>

          <View style={styles.infoGrid}>
            {/* Row 1 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="document-text" size={16} color="#8B5CF6" />
                  <Text style={styles.infoLabel}>Challan Number</Text>
                </View>
                <Text style={styles.infoValue}>
                  {challan.challanNumber || "N/A"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="receipt" size={16} color="#3B82F6" />
                  <Text style={styles.infoLabel}>SO Reference</Text>
                </View>
                <Text style={styles.infoValue}>
                  {challan.soReference || "N/A"}
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="calendar" size={16} color="#F59E0B" />
                  <Text style={styles.infoLabel}>Dispatch Date</Text>
                </View>
                <Text style={styles.infoValue}>
                  {challan.challanDate
                    ? new Date(challan.challanDate).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="time" size={16} color="#EF4444" />
                  <Text style={styles.infoLabel}>Expected Delivery</Text>
                </View>
                <Text style={styles.infoValue}>
                  {challan.expectedDeliveryDate
                    ? new Date(
                        challan.expectedDeliveryDate,
                      ).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>
            </View>

            {/* Row 3 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="business" size={16} color="#10B981" />
                  <Text style={styles.infoLabel}>Customer</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {challan.customerDetails?.companyName ||
                    challan.salesOrder?.customer?.companyName ||
                    "Unknown"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Warehouse</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {getWarehouseName(challan.warehouseLocation)}
                </Text>
              </View>
            </View>

            {/* Row 4 */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="scale" size={16} color="#8B5CF6" />
                  <Text style={styles.infoLabel}>Total Weight</Text>
                </View>
                <Text style={styles.infoValue}>
                  {totalWeight.toFixed(2)} Kg
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconRow}>
                  <Ionicons name="cube" size={16} color="#3B82F6" />
                  <Text style={styles.infoLabel}>Items</Text>
                </View>
                <Text style={styles.infoValue}>
                  {challan.items?.length || 0} items
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dispatched Items - Table Style like PO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dispatched Items ({challan.items?.length || 0})
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

            {challan.items?.map((item: any, index: number) => {
              const itemStatus = getItemStatus(item);
              const dispatchedQty = item.dispatchQuantity || 0;

              return (
                <View key={item._id || index} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.productName}>
                      {item.productName || "Unknown"}
                    </Text>
                    {item.productCode && (
                      <Text style={styles.productCode}>{item.productCode}</Text>
                    )}
                    {item.notes && (
                      <Text style={styles.itemNotesText}>📝 {item.notes}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tableText}>
                      {dispatchedQty} {item.unit}
                    </Text>
                    {item.orderedQuantity && (
                      <Text style={styles.orderedText}>
                        of {item.orderedQuantity}
                      </Text>
                    )}
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
                                : "#8B5CF6",
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
        {challan.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dispatch Notes</Text>
            <Text style={styles.notesText}>{challan.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.pdfButton, downloading && styles.pdfButtonDisabled]}
            onPress={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#FFF" />
            )}
            <Text style={styles.pdfButtonText}>
              {downloading ? "Downloading..." : "Download PDF"}
            </Text>
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 24,
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
    backgroundColor: "#8B5CF6",
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
    color: "#E9D5FF",
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
  // Progress Section
  progressSection: {},
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStat: {
    alignItems: "center",
  },
  progressStatLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  // Info Grid
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
    fontWeight: "500",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  // Table Styles
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  productCode: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  tableText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  orderedText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  itemNotesText: {
    fontSize: 11,
    color: "#F59E0B",
    marginTop: 4,
  },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  itemStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  // Actions
  actions: { padding: 16, paddingBottom: 32 },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    marginBottom: 12,
  },
  pdfButtonDisabled: {
    backgroundColor: "#A78BFA",
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  closeButtonBottom: {
    backgroundColor: "#6B7280",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonBottomText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
