import ErrorState from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/SkeletonLoader";
import { useToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Pagination from "../../components/Pagination";
import {
    poFormatters,
    purchaseOrderAPI,
} from "../../services/purchaseOrderAPI.js";

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierDetails?: {
    companyName: string;
    _id: string;
  };
  category?: {
    categoryName: string;
  };
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items?: any[];
  totalAmount?: number;
}

interface Stats {
  totalPOs: number;
  statusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  overduePOs: number;
  monthlyValue: number;
  pendingApprovals: number;
}

export default function PurchaseOrdersScreen() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPOs: 0,
    statusBreakdown: [],
    overduePOs: 0,
    monthlyValue: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load purchase orders on mount and when search/filter/page changes
  useEffect(() => {
    loadPurchaseOrders();
  }, [debouncedSearch, statusFilter, currentPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, statusFilter]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadPurchaseOrders();
    }, []),
  );

  const loadStats = async () => {
    try {
      const response = await purchaseOrderAPI.getStats();
      if (response && response.success) {
        setStats(
          response.data || {
            totalPOs: 0,
            statusBreakdown: [],
            overduePOs: 0,
            monthlyValue: 0,
            pendingApprovals: 0,
          },
        );
      }
    } catch (err) {
      console.error("Error loading PO stats:", err);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: itemsPerPage,
        page: currentPage,
        sort: "-createdAt",
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await purchaseOrderAPI.getAll(params);

      if (response && response.success) {
        setPurchaseOrders(response.data || []);
        // Backend returns 'pages' and 'total' not 'totalPages' and 'totalItems'
        setTotalPages(
          response.pagination?.pages || response.pagination?.totalPages || 1,
        );
        setTotalItems(
          response.pagination?.total ||
            response.pagination?.totalItems ||
            response.data?.length ||
            0,
        );
      } else {
        setError("Failed to load purchase orders");
      }
    } catch (err: any) {
      console.error("Error loading purchase orders:", err);
      setError(err.message || "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadPurchaseOrders()]);
    setRefreshing(false);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    router.push({
      pathname: "/purchase-orders/[id]",
      params: { id: po._id },
    });
  };

  const handleCreatePO = () => {
    router.push("/purchase-orders/form");
  };

  const handleEdit = (po: PurchaseOrder) => {
    router.push({
      pathname: "/purchase-orders/form",
      params: { id: po._id },
    });
  };

  const handleCancel = (po: PurchaseOrder) => {
    Alert.alert(
      "Cancel Purchase Order",
      "Are you sure you want to cancel this purchase order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await purchaseOrderAPI.cancel(po._id, {
                cancellationReason: "Cancelled by user",
                cancelledBy: "Mobile App",
              });
              toast.showToast('success', 'Order Cancelled', 'Purchase order has been cancelled successfully.');
              loadPurchaseOrders();
            } catch (err: any) {
              toast.showToast('error', 'Cancel Failed', err.message || 'Failed to cancel purchase order.');
            }
          },
        },
      ],
    );
  };

  const handleDelete = (po: PurchaseOrder) => {
    Alert.alert(
      "Delete Purchase Order",
      "Permanently delete this cancelled purchase order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await purchaseOrderAPI.delete(po._id);
              toast.showToast('success', 'Order Deleted', 'Purchase order has been permanently deleted.');
              loadPurchaseOrders();
            } catch (err: any) {
              toast.showToast('error', 'Delete Failed', err.message || 'Failed to delete purchase order.');
            }
          },
        },
      ],
    );
  };

  const getStatusCount = (status: string) => {
    const statusItem = stats?.statusBreakdown?.find(
      (item) => item._id === status,
    );
    return statusItem ? statusItem.count : 0;
  };

  const renderPOCard = ({ item }: { item: PurchaseOrder }) => {
    const statusInfo = poFormatters.status(item.status);
    const isOverdue = poFormatters.isOverdue(
      item.expectedDeliveryDate,
      item.status,
    );
    const supplierName = item.supplierDetails?.companyName || "N/A";
    const categoryName = item.category?.categoryName || "N/A";

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.poNumber}</Text>
            {isOverdue && (
              <View style={styles.overdueTag}>
                <Ionicons name="warning" size={12} color="#EF4444" />
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
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
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Supplier:</Text>
            <Text style={styles.orderValue} numberOfLines={1}>
              {supplierName}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Category:</Text>
            <Text style={styles.orderValue}>{categoryName}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Date:</Text>
            <Text style={styles.orderValue}>
              {poFormatters.date(item.orderDate)}
            </Text>
          </View>

          {item.expectedDeliveryDate && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Delivery Date:</Text>
              <Text
                style={[styles.orderValue, isOverdue && { color: "#EF4444" }]}
              >
                {poFormatters.date(item.expectedDeliveryDate)}
              </Text>
            </View>
          )}

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Items:</Text>
            <Text style={styles.orderValue}>{item.items?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewPO(item)}
          >
            <Ionicons name="eye-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          {item.status === "Draft" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="create-outline" size={18} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: "#10B981" }]}>
                Edit
              </Text>
            </TouchableOpacity>
          )}

          {item.status !== "Cancelled" &&
            item.status !== "Fully_Received" &&
            item.status !== "Draft" && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(`/grn/form?poId=${item._id}` as any)
                }
              >
                <Ionicons name="add-circle-outline" size={18} color="#8B5CF6" />
                <Text style={[styles.actionButtonText, { color: "#8B5CF6" }]}>
                  GRN
                </Text>
              </TouchableOpacity>
            )}

          {item.status !== "Cancelled" &&
            item.status !== "Fully_Received" &&
            item.status !== "Closed" && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCancel(item)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#F59E0B"
                />
                <Text style={[styles.actionButtonText, { color: "#F59E0B" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}

          {item.status === "Cancelled" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>No purchase orders found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? "No orders match your search"
          : "Create your first purchase order to get started"}
      </Text>
    </View>
  );

  if (loading && !refreshing && purchaseOrders.length === 0) {
    return <ListSkeleton count={4} />;
  }

  if (error && purchaseOrders.length === 0) {
    return (
      <ErrorState
        title="Unable to Load Orders"
        message={error}
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="cart" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Purchase Orders</Text>
              <Text style={styles.headerSubtitle}>
                Manage supplier procurement
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.newButton} onPress={handleCreatePO} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#6366F1" />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard(
            getStatusCount("Draft"),
            "Draft",
            "#6366F1",
            "document-text",
          )}
          {renderStatCard(
            getStatusCount("Partially_Received"),
            "Partial",
            "#F59E0B",
            "time",
          )}
          {renderStatCard(
            getStatusCount("Fully_Received"),
            "Completed",
            "#10B981",
            "checkmark-circle",
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders, suppliers, PO numbers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Purchase Orders List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Recent Purchase Orders</Text>

          {purchaseOrders.length === 0
            ? renderEmptyState()
            : purchaseOrders.map((item) => (
                <View key={item._id}>{renderPOCard({ item })}</View>
              ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        )}
      </ScrollView>
    </View>
  );
}

const renderStatCard = (
  value: number,
  label: string,
  color: string,
  icon: string,
) => (
  <View
    style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
  >
    <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366F1",
  },
  scrollView: { flex: 1 },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statContent: { alignItems: "center" },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
    letterSpacing: 0.3,
  },
  overdueTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  overdueText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  orderValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  orderActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
});
