import ErrorState from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/SkeletonLoader";
import { useToast } from "@/components/ui/Toast";
import { BORDER_RADIUS, COLORS, SPACING } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Pagination from "../../components/Pagination";
import { salesOrderAPI, soFormatters } from "../../services/salesOrderAPI";

export default function SalesOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    delivered: 0,
    draft: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(params.filter || "all");
  const toast = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [statusFilter, currentPage]),
  );

  // Reset page when filter changes
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadSalesOrders(), loadStats()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSalesOrders = async () => {
    try {
      const queryParams: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: "orderDate",
        sortOrder: "desc",
      };

      if (statusFilter !== "all") {
        queryParams.status = statusFilter;
      }

      if (searchQuery) {
        queryParams.search = searchQuery;
      }

      console.log("📋 Loading sales orders with params:", queryParams);
      const response = await salesOrderAPI.getAll(queryParams);

      if (response?.success) {
        const orders = response.data || [];
        setSalesOrders(orders);

        // Handle pagination from backend
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalItems(response.pagination.totalCount || orders.length);
        }
      }
    } catch (err: any) {
      console.error("❌ Error loading sales orders:", err);
      throw err;
    }
  };

  const loadStats = async () => {
    try {
      const response = await salesOrderAPI.getStats();

      if (response?.success) {
        const statsData = response.data;
        const statusBreakdown = statsData.statusBreakdown || [];

        const deliveredCount = statusBreakdown
          .filter((s: any) => s._id === "delivered" || s._id === "Delivered")
          .reduce((sum: number, s: any) => sum + s.count, 0);

        const draftCount = statusBreakdown
          .filter((s: any) => s._id === "draft" || s._id === "Draft")
          .reduce((sum: number, s: any) => sum + s.count, 0);

        const pendingCount = statusBreakdown
          .filter(
            (s: any) =>
              s._id === "Pending" ||
              s._id === "pending" ||
              s._id === "Processing",
          )
          .reduce((sum: number, s: any) => sum + s.count, 0);

        const totalOrders = statsData.overview?.totalOrders || 0;

        setStats({
          totalOrders,
          delivered: deliveredCount,
          draft: draftCount,
          pending: pendingCount,
        });
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    loadData();
  }, [statusFilter, searchQuery]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadSalesOrders();
  };

  const handleCancel = (id) => {
    Alert.alert(
      "Cancel Sales Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await salesOrderAPI.cancel(id as string, "Cancelled by user");
              toast.showToast('success', 'Order Cancelled', 'Sales order has been cancelled successfully.');
              loadData();
            } catch (err: any) {
              toast.showToast('error', 'Cancel Failed', err.message || 'Failed to cancel order. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Sales Order",
      "Are you sure you want to permanently delete this cancelled order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await salesOrderAPI.delete(id as string);
              toast.showToast('success', 'Order Deleted', 'Sales order has been permanently deleted.');
              loadData();
            } catch (err: any) {
              toast.showToast('error', 'Delete Failed', err.message || 'Failed to delete sales order. Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderStatCard = (
    value: number,
    label: string,
    color: string,
    icon: any,
  ) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{loading ? "-" : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderFilterButton = (label: string, value: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => handleFilterChange(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          statusFilter === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderCard = (order: any) => {
    const statusInfo = soFormatters.status(order.status);
    const isOverdue = soFormatters.isOverdue(
      order.expectedDeliveryDate,
      order.status,
    );
    const customerName = order.customer?.companyName || order.customer || "N/A";
    const categoryName =
      order.category?.categoryName || order.category || "N/A";

    return (
      <View key={order._id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.soNumber}</Text>
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
            <Text style={styles.orderLabel}>Customer:</Text>
            <Text style={styles.orderValue} numberOfLines={1}>
              {customerName}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Category:</Text>
            <Text style={styles.orderValue}>{categoryName}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Date:</Text>
            <Text style={styles.orderValue}>
              {soFormatters.date(order.orderDate)}
            </Text>
          </View>

          {order.expectedDeliveryDate && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Delivery Date:</Text>
              <Text
                style={[styles.orderValue, isOverdue && { color: "#EF4444" }]}
              >
                {soFormatters.date(order.expectedDeliveryDate)}
              </Text>
            </View>
          )}

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Items:</Text>
            <Text style={styles.orderValue}>{order.items?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/sales-orders/${order._id}`)}
          >
            <Ionicons name="eye-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          {order.status === "Draft" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log("Editing order:", order._id);
                router.push(`/sales-orders/form?id=${order._id}`);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: "#10B981" }]}>
                Edit
              </Text>
            </TouchableOpacity>
          )}

          {order.status !== "Cancelled" && order.status !== "Delivered" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCancel(order._id)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: "#F59E0B" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}

          {order.status === "Cancelled" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(order._id)}
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

  if (loading && !refreshing) {
    return <ListSkeleton count={4} />;
  }

  if (error && salesOrders.length === 0) {
    return (
      <ErrorState
        title="Unable to Load Orders"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="document-text" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Sales Orders</Text>
              <Text style={styles.headerSubtitle}>Manage customer orders</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push("/sales-orders/form")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#6366F1" />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          {renderStatCard(
            stats.totalOrders,
            "Total Orders",
            "#6B7280",
            "document-text",
          )}
          {renderStatCard(
            stats.delivered,
            "Completed",
            "#10B981",
            "checkmark-circle",
          )}
          {renderStatCard(stats.draft, "Draft", "#3B82F6", "create")}
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders, customers, SO numbers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  loadSalesOrders();
                }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {renderFilterButton("All", "all")}
            {renderFilterButton("Draft", "Draft")}
            {renderFilterButton("Delivered", "Delivered")}
            {renderFilterButton("Cancelled", "Cancelled")}
          </ScrollView>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Recent Sales Orders</Text>

          {salesOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>No sales orders found</Text>
              <Text style={styles.emptySubtext}>
                {statusFilter !== "all"
                  ? `No ${statusFilter} orders available`
                  : "Create your first sales order to get started"}
              </Text>
            </View>
          ) : (
            <>
              {salesOrders.map(renderOrderCard)}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                loading={loading}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
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
  newButtonText: { color: "#6366F1", fontSize: 14, fontWeight: "700" },
  scrollView: { flex: 1 },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
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
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: "#6B7280", textAlign: "center", fontWeight: "500" },
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
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#FFF",
  },
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
  // Pagination styles
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.gray200,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  paginationButtonTextDisabled: {
    color: COLORS.gray400,
  },
  paginationInfo: {
    alignItems: "center",
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  paginationSubtext: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
});
