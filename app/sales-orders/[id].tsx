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
import { salesOrderAPI, soFormatters } from "../../services/salesOrderAPI";

export default function SalesOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [salesOrder, setSalesOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSalesOrder();
    }
  }, [id]);

  const loadSalesOrder = async () => {
    try {
      setLoading(true);
      const response = await salesOrderAPI.getById(id);
      if (response?.success) {
        setSalesOrder(response.data);
      } else {
        Alert.alert("Error", "Sales order not found");
        router.back();
      }
    } catch (err) {
      console.error("Error loading SO:", err);
      Alert.alert("Error", err.message || "Failed to load sales order");
      router.back();
    } finally {
      setLoading(false);
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

  if (!salesOrder) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Sales order not found</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = soFormatters.status(salesOrder.status);
  const customerName =
    salesOrder.customer?.companyName || salesOrder.customer || "N/A";
  const categoryName =
    salesOrder.category?.categoryName || salesOrder.category || "N/A";
  const totalWeight =
    salesOrder.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{salesOrder.soNumber}</Text>
          <Text style={styles.headerSubtitle}>
            Created on {soFormatters.date(salesOrder.createdAt)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>SO Number</Text>
                <Text style={styles.infoValue}>{salesOrder.soNumber}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>
                  {soFormatters.date(salesOrder.orderDate)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Expected Delivery</Text>
                <Text style={styles.infoValue}>
                  {salesOrder.expectedDeliveryDate
                    ? soFormatters.date(salesOrder.expectedDeliveryDate)
                    : "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{customerName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{categoryName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Weight</Text>
                <Text style={styles.infoValue}>
                  {totalWeight.toFixed(2)} Kg
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created By</Text>
                <Text style={styles.infoValue}>
                  {salesOrder.createdBy || "Admin"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Items ({salesOrder.items?.length || 0})
          </Text>

          {salesOrder.items?.map((item, index) => {
            const productName =
              item.product?.productName || item.productName || "Unknown";
            const productCode = item.product?.productCode || "";
            const dispatchedQty = item.dispatchedQuantity || 0;
            const dispatchedWeight = item.dispatchedWeight || 0;
            const completion =
              item.quantity > 0
                ? Math.round((dispatchedQty / item.quantity) * 100)
                : 0;
            const itemStatus =
              completion === 100
                ? "Complete"
                : completion > 0
                  ? "Partial"
                  : "Pending";
            const statusColor =
              completion === 100
                ? "#10B981"
                : completion > 0
                  ? "#F59E0B"
                  : "#6B7280";

            return (
              <View key={item._id || index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.productName}>{productName}</Text>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        { backgroundColor: statusColor + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.itemStatusText, { color: statusColor }]}
                      >
                        {itemStatus}
                      </Text>
                    </View>
                  </View>
                  {productCode && (
                    <Text style={styles.productCode}>{productCode}</Text>
                  )}
                </View>

                <View style={styles.itemDetailsGrid}>
                  <View style={styles.itemDetailBox}>
                    <Text style={styles.itemDetailLabel}>Ordered</Text>
                    <Text style={styles.itemDetailValue}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.itemDetailBox}>
                    <Text style={styles.itemDetailLabel}>Weight</Text>
                    <Text style={styles.itemDetailValue}>
                      {(item.weight || 0).toFixed(2)} Kg
                    </Text>
                  </View>
                  <View style={styles.itemDetailBox}>
                    <Text style={styles.itemDetailLabel}>Dispatched</Text>
                    <Text
                      style={[styles.itemDetailValue, { color: "#10B981" }]}
                    >
                      {dispatchedQty} {item.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${completion}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.completionText}>{completion}%</Text>
                </View>

                {item.notes && (
                  <View style={styles.itemNotesContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.itemNotes}>{item.notes}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
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
  errorText: { fontSize: 16, color: "#6B7280", marginBottom: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
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
    marginBottom: 8,
  },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
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
  itemTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  productCode: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  itemDetailsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  itemDetailBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemDetailLabel: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  itemDetailValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 40,
    textAlign: "right",
  },
  itemStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemStatusText: { fontSize: 11, fontWeight: "600" },
  itemNotesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 8,
  },
  itemNotes: { flex: 1, fontSize: 13, color: "#78350F" },
  actions: { padding: 16, paddingBottom: 32 },
  closeButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  closeButtonBottom: {
    backgroundColor: "#6B7280",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonBottomText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
