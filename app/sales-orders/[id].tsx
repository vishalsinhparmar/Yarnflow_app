import { useToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { salesChallanAPI } from "../../services/salesChallanAPI";
import { salesOrderAPI, soFormatters } from "../../services/salesOrderAPI";

interface SOItem {
  _id?: string;
  product?: { _id: string; productName: string; productCode?: string } | string;
  productName?: string;
  productCode?: string;
  subProduct?: { _id: string; name: string } | string;
  subProductName?: string;
  quantity: number;
  unit: string;
  weight: number;
  dispatchedQuantity?: number;
  deliveredQuantity?: number;
  shippedQuantity?: number;
  dispatchedWeight?: number;
  notes?: string;
}

interface SalesOrder {
  _id: string;
  soNumber: string;
  customer?: { _id: string; companyName: string } | string;
  category?: { _id: string; categoryName: string } | string;
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: SOItem[];
  createdBy?: string;
  createdAt: string;
}

export default function SalesOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const toast = useToast();

  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSalesOrder();
    }
  }, [id]);

  const loadSalesOrder = async () => {
    try {
      setLoading(true);
      const soId = Array.isArray(id) ? id[0] : id as string;
      const [soResponse, dispatchedResponse] = await Promise.allSettled([
        salesOrderAPI.getById(soId),
        salesChallanAPI.getAll({ salesOrder: soId, limit: 200 }),
      ]);

      if (soResponse.status === 'fulfilled' && soResponse.value?.success) {
        setSalesOrder(soResponse.value.data);
      } else {
        toast.showToast('error', 'Not Found', 'Sales order not found');
        router.back();
        return;
      }

      // Build dispatched map from challans — keyed by salesOrderItem id
      if (dispatchedResponse.status === 'fulfilled' && dispatchedResponse.value?.success) {
        const challans = dispatchedResponse.value.data || [];
        const dMap: Record<string, number> = {};
        challans.forEach((challan: any) => {
          (challan.items || []).forEach((item: any) => {
            const key = item.salesOrderItem?.toString() || item._id?.toString();
            if (key) dMap[key] = (dMap[key] || 0) + (item.dispatchQuantity || 0);
          });
        });
        setDispatchedMap(dMap);
      }
    } catch (err: any) {
      console.error("Error loading SO:", err);
      toast.showToast('error', 'Load Failed', err?.message || 'Failed to load sales order');
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
    (typeof salesOrder.customer === 'object' ? salesOrder.customer?.companyName : salesOrder.customer) || "N/A";
  const categoryName =
    (typeof salesOrder.category === 'object' ? salesOrder.category?.categoryName : salesOrder.category) || "N/A";
  const totalWeight = salesOrder.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;
  // Use live challan data (dispatchedMap) when available, fall back to stored SO item fields
  const getItemDispatched = (item: SOItem) => {
    const liveQty = item._id ? dispatchedMap[item._id] : undefined;
    return liveQty ?? item.deliveredQuantity ?? item.shippedQuantity ?? item.dispatchedQuantity ?? 0;
  };
  const totalDispatched = salesOrder.items?.reduce((sum, item) => sum + getItemDispatched(item), 0) || 0;
  const totalOrdered = salesOrder.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const overallCompletion = totalOrdered > 0 ? Math.round((totalDispatched / totalOrdered) * 100) : 0;

  // Group items by product (matching web SalesOrderDetailModal pattern)
  const getProductGroups = () => {
    const groups: { productId: string; productName: string; productCode: string; unit: string; items: SOItem[] }[] = [];
    const seen = new Map<string, number>();
    (salesOrder.items || []).forEach((item) => {
      const key = (typeof item.product === 'object' ? item.product?._id : item.product) || `__${groups.length}`;
      if (!seen.has(key)) {
        seen.set(key, groups.length);
        groups.push({
          productId: key,
          productName: item.productName || (typeof item.product === 'object' ? item.product?.productName : '') || 'N/A',
          productCode: typeof item.product === 'object' ? (item.product?.productCode || '') : '',
          unit: item.unit,
          items: [],
        });
      }
      groups[seen.get(key)!].items.push(item);
    });
    return groups;
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header — matching web's blue-to-indigo */}
      <LinearGradient
        colors={["#2563EB", "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIconRow}>
            <View style={styles.headerIconBox}>
              <Ionicons name="cart" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>{salesOrder.soNumber}</Text>
              <Text style={styles.headerSubtitle}>
                Created on {soFormatters.date(salesOrder.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
          {salesOrder.status === 'Draft' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/sales-orders/form?id=${salesOrder._id}` as any)}
            >
              <Ionicons name="pencil" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Overall completion bar — always shown when SO has items */}
        {totalOrdered > 0 && (
          <View style={styles.section}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionLabel}>Overall Completion</Text>
              <Text style={[styles.completionPct, { color: overallCompletion === 100 ? '#10B981' : '#6366F1' }]}>
                {overallCompletion}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${overallCompletion}%` as any,
                backgroundColor: overallCompletion === 100 ? '#10B981' : '#6366F1',
              }]} />
            </View>
            <View style={styles.completionStats}>
              <Text style={styles.completionStat}>Dispatched: {totalDispatched} / {totalOrdered}</Text>
              <Text style={styles.completionStat}>Weight: {totalWeight.toFixed(2)} Kg</Text>
            </View>
          </View>
        )}

        {/* Order Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cart-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Order Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>SO Number</Text>
                <Text style={styles.infoValue}>{salesOrder.soNumber}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>{soFormatters.date(salesOrder.orderDate)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Expected Delivery</Text>
                <Text style={styles.infoValue}>
                  {salesOrder.expectedDeliveryDate ? soFormatters.date(salesOrder.expectedDeliveryDate) : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Total Weight</Text>
                <Text style={styles.infoValue}>{totalWeight.toFixed(2)} Kg</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{customerName}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{categoryName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items — grouped by product */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cube-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>
              Order Items ({salesOrder.items?.length || 0}{getProductGroups().length > 1 ? ` across ${getProductGroups().length} products` : ''})
            </Text>
          </View>

          {getProductGroups().map((group, gi) => (
            <View key={gi} style={styles.productGroup}>
              {/* Product group header */}
              <View style={styles.productGroupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productGroupName}>{group.productName}</Text>
                  {group.productCode ? <Text style={styles.productGroupCode}>{group.productCode}</Text> : null}
                </View>
                <Text style={styles.productGroupUnit}>Unit: {group.unit || 'Bags'}</Text>
              </View>

              {group.items.map((item, ri) => {
                const subName = item.subProductName || (typeof item.subProduct === 'object' ? item.subProduct?.name : '');
                const dispatchedQty = getItemDispatched(item);
                const dispatchedWeight = item.dispatchedWeight || 0;
                const pending = Math.max(0, item.quantity - dispatchedQty);
                const completion = item.quantity > 0 ? Math.round((dispatchedQty / item.quantity) * 100) : 0;
                const itemStatusLabel = completion === 100 ? 'Complete' : completion > 0 ? 'Partial' : 'Pending';
                const itemStatusColor = completion === 100 ? '#10B981' : completion > 0 ? '#F59E0B' : '#6B7280';

                return (
                  <View key={item._id || ri} style={styles.itemRow}>
                    {/* Product / sub-product name */}
                    <View style={styles.itemNameRow}>
                      {subName ? (
                        <Text style={styles.subProductName}>{group.productName} X {subName}</Text>
                      ) : (
                        <Text style={styles.productRowName}>{group.productName}</Text>
                      )}
                      <View style={[styles.itemStatusBadge, { backgroundColor: itemStatusColor + '20' }]}>
                        <Text style={[styles.itemStatusText, { color: itemStatusColor }]}>{itemStatusLabel}</Text>
                      </View>
                    </View>

                    {/* Stats grid */}
                    <View style={styles.itemDetailsGrid}>
                      <View style={styles.itemDetailBox}>
                        <Text style={styles.itemDetailLabel}>Ordered</Text>
                        <Text style={styles.itemDetailValue}>{item.quantity} {item.unit}</Text>
                      </View>
                      <View style={styles.itemDetailBox}>
                        <Text style={styles.itemDetailLabel}>Weight</Text>
                        <Text style={styles.itemDetailValue}>{(item.weight || 0).toFixed(2)} Kg</Text>
                      </View>
                      <View style={styles.itemDetailBox}>
                        <Text style={styles.itemDetailLabel}>Dispatched</Text>
                        <Text style={[styles.itemDetailValue, { color: '#10B981' }]}>{dispatchedQty} {item.unit}</Text>
                      </View>
                      <View style={styles.itemDetailBox}>
                        <Text style={styles.itemDetailLabel}>Pending</Text>
                        <Text style={[styles.itemDetailValue, { color: pending > 0 ? '#F59E0B' : '#10B981' }]}>
                          {pending} {item.unit}
                        </Text>
                      </View>
                    </View>

                    {dispatchedWeight > 0 && (
                      <Text style={styles.dispatchedWeightText}>
                        Dispatched Weight: {dispatchedWeight.toFixed(2)} Kg
                      </Text>
                    )}

                    {/* Progress */}
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {
                          width: `${completion}%` as any,
                          backgroundColor: itemStatusColor,
                        }]} />
                      </View>
                      <Text style={[styles.completionText, { color: itemStatusColor }]}>{completion}%</Text>
                    </View>

                    {item.notes ? (
                      <View style={styles.notesBox}>
                        <Ionicons name="document-text-outline" size={13} color="#92400E" />
                        <Text style={styles.notesText}>{item.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {salesOrder.status !== 'Completed' && salesOrder.status !== 'Cancelled' && (
            <TouchableOpacity
              style={styles.createChallanButton}
              onPress={() => router.push(`/sales-challan/form?soId=${salesOrder._id}` as any)}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.createChallanButtonText}>Create Challan</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeButtonBottom} onPress={() => router.back()}>
            <Text style={styles.closeButtonBottomText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F4FF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorText: { fontSize: 16, color: "#6B7280", marginBottom: 16 },
  // Header
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, gap: 12 },
  headerBack: { padding: 4 },
  headerCenter: { flex: 1 },
  headerIconRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconBox: { width: 40, height: 40, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "#BFDBFE", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  editButton: { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  // Section
  section: { backgroundColor: "#FFF", margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  // Completion bar
  completionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  completionLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  completionPct: { fontSize: 16, fontWeight: "700" },
  completionStats: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  completionStat: { fontSize: 12, color: "#6B7280" },
  // Info grid
  infoGrid: { gap: 10 },
  infoRow: { flexDirection: "row", gap: 10 },
  infoCard: { flex: 1, backgroundColor: "#F9FAFB", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  infoLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "700" },
  // Product group
  productGroup: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  productGroupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EFF6FF", paddingHorizontal: 14, paddingVertical: 10 },
  productGroupName: { fontSize: 14, fontWeight: "700", color: "#1E40AF" },
  productGroupCode: { fontSize: 11, color: "#60A5FA", marginTop: 2 },
  productGroupUnit: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
  itemRow: { padding: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  itemNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  subProductName: { fontSize: 14, fontWeight: "700", color: "#059669", flex: 1 },
  productRowName: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },
  itemStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  itemStatusText: { fontSize: 11, fontWeight: "700" },
  itemDetailsGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
  itemDetailBox: { flex: 1, backgroundColor: "#F9FAFB", padding: 8, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  itemDetailLabel: { fontSize: 10, color: "#6B7280", marginBottom: 3 },
  itemDetailValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  dispatchedWeightText: { fontSize: 12, color: "#10B981", marginBottom: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  completionText: { fontSize: 12, fontWeight: "700", minWidth: 38, textAlign: "right" },
  notesBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 10, backgroundColor: "#FEF3C7", padding: 10, borderRadius: 8 },
  notesText: { flex: 1, fontSize: 12, color: "#92400E" },
  actions: { padding: 16, paddingBottom: 32, marginTop: 16, gap: 12 },
  createChallanButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#8B5CF6", paddingVertical: 14, borderRadius: 10 },
  createChallanButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  closeButtonBottom: { backgroundColor: "#6B7280", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  closeButtonBottomText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
