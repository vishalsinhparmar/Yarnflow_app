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
import { salesChallanAPI } from "../../services/salesChallanAPI";

interface ChallanStats {
  totalChallans: number;
  completed: number;
  partial: number;
  thisMonth: number;
}

interface GroupedSO {
  soId: string;
  soNumber: string;
  customer: string;
  challans: any[];
  totalItems: number;
  dispatchedItems: number;
  soStatus: string;
  salesOrder: any;
}

export default function SalesChallanListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [challans, setChallans] = useState([]);
  const [groupedBySO, setGroupedBySO] = useState<GroupedSO[]>([]);
  const [expandedSOs, setExpandedSOs] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [stats, setStats] = useState<ChallanStats>({
    totalChallans: 0,
    completed: 0,
    partial: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(params.filter || "all");
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [statusFilter, currentPage]),
  );

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📋 Loading Sales Challans...");

      // Load stats and challans in parallel
      const [statsRes, challansRes] = await Promise.all([
        salesChallanAPI.getStats(),
        salesChallanAPI.getAll({
          page: currentPage,
          limit: itemsPerPage,
          sort: "-createdAt",
          populate: "salesOrder,salesOrder.customer",
        }),
      ]);

      // Process stats
      if (statsRes?.success && statsRes?.data) {
        const data = statsRes.data;
        setStats({
          totalChallans:
            data.overview?.totalChallans || data.totalChallans || 0,
          completed: data.completed || 0,
          partial: data.partial || 0,
          thisMonth: data.overview?.thisMonth || data.thisMonth || 0,
        });
      }

      // Process challans
      if (challansRes?.success && challansRes?.data) {
        let challanData = Array.isArray(challansRes.data)
          ? challansRes.data
          : [];

        // Apply status filter
        if (statusFilter !== "all" && challanData.length > 0) {
          challanData = challanData.filter((challan) => {
            if (
              !challan ||
              !Array.isArray(challan.items) ||
              challan.items.length === 0
            ) {
              return statusFilter === "Pending";
            }

            let allItemsComplete = true;
            let anyItemPartial = false;

            for (let i = 0; i < challan.items.length; i++) {
              const item = challan.items[i];
              const dispatched = item.dispatchQuantity || 0;
              const ordered = item.orderedQuantity || 0;
              const manuallyCompleted = item.manuallyCompleted || false;

              if (manuallyCompleted || dispatched >= ordered) {
                continue;
              } else if (dispatched > 0 && dispatched < ordered) {
                allItemsComplete = false;
                anyItemPartial = true;
              } else {
                allItemsComplete = false;
              }
            }

            if (statusFilter === "Completed") {
              return allItemsComplete;
            } else if (statusFilter === "Partial") {
              return anyItemPartial;
            }
            return true;
          });
        }

        setChallans(challanData);

        // Handle pagination from backend
        if (challansRes.pagination) {
          setTotalPages(challansRes.pagination.totalPages || 1);
          setTotalItems(
            challansRes.pagination.totalItems || challanData.length,
          );
        }

        // Group by SO
        const grouped = groupChallansBySO(challanData);
        setGroupedBySO(grouped);

        // Initialize expansion
        const expanded: { [key: string]: boolean } = {};
        grouped.forEach((so, index) => {
          const soKey = so.soId || so.soNumber;
          expanded[soKey] = index < 5;
        });
        setExpandedSOs(expanded);
      }
    } catch (err: any) {
      console.error("❌ Error loading challans:", err);
      setError(err.message || 'Failed to load challans');
      setChallans([]);
      setGroupedBySO([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupChallansBySO = (challanList: any[]): GroupedSO[] => {
    const grouped: { [key: string]: GroupedSO } = {};

    challanList.forEach((challan) => {
      const soKey = challan.salesOrder?._id || challan.soReference || "unknown";

      if (!grouped[soKey]) {
        grouped[soKey] = {
          soId: challan.salesOrder?._id || soKey,
          soNumber: challan.soReference || "N/A",
          customer:
            challan.customerDetails?.companyName ||
            challan.salesOrder?.customer?.companyName ||
            "Unknown",
          challans: [],
          totalItems: 0,
          dispatchedItems: 0,
          soStatus: "Pending",
          salesOrder: challan.salesOrder,
        };
      }

      grouped[soKey].challans.push(challan);

      // Calculate items
      if (challan.items) {
        grouped[soKey].totalItems += challan.items.length;
        challan.items.forEach((item: any) => {
          if (item.dispatchQuantity >= item.orderedQuantity) {
            grouped[soKey].dispatchedItems++;
          }
        });
      }
    });

    // Determine SO status
    Object.values(grouped).forEach((so) => {
      if (so.salesOrder && so.salesOrder.status) {
        if (so.salesOrder.status === "Delivered") {
          so.soStatus = "Delivered";
        } else if (
          so.salesOrder.status === "Shipped" ||
          so.salesOrder.status === "Processing"
        ) {
          so.soStatus = "Partial";
        } else {
          so.soStatus = "Pending";
        }
      } else {
        const allDelivered = so.challans.every((c) => c.status === "Delivered");
        const someDelivered = so.challans.some((c) => c.status === "Delivered");

        if (allDelivered) {
          so.soStatus = "Delivered";
        } else if (someDelivered || so.dispatchedItems > 0) {
          so.soStatus = "Partial";
        } else {
          so.soStatus = "Pending";
        }
      }
    });

    return Object.values(grouped);
  };

  const toggleSO = (soKey: string) => {
    setExpandedSOs((prev) => ({
      ...prev,
      [soKey]: !prev[soKey],
    }));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [statusFilter]);

  const handleAddChallan = () => {
    router.push("/sales-challan/form");
  };

  const handleAddChallanForSO = (so: GroupedSO) => {
    router.push(`/sales-challan/form?soId=${so.soId}`);
  };

  const handleViewChallan = (challanId: string) => {
    router.push(`/sales-challan/${challanId}`);
  };

  const renderFilterButton = (label: string, value: string) => {
    const isActive = statusFilter === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => handleFilterChange(value)}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
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

  const getChallanStatus = (challan: any) => {
    if (!challan.items || challan.items.length === 0) return "Pending";

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

  const filteredGroupedSOs = groupedBySO.filter((so) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const soNumber = so.soNumber?.toLowerCase() || "";
    const customer = so.customer?.toLowerCase() || "";

    return soNumber.includes(query) || customer.includes(query);
  });

  const paginatedSOs = filteredGroupedSOs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (error && challans.length === 0) {
    return (
      <ErrorState
        title="Unable to Load Challans"
        message={error}
        onRetry={loadAllData}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="car" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Sales Challan</Text>
              <Text style={styles.headerSubtitle}>
                Delivery tracking & shipments
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddChallan} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#8B5CF6" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.subHeader}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="receipt" size={16} color="#6366F1" />
            </View>
            <Text style={styles.statValue}>{stats.totalChallans}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {stats.completed}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {stats.partial}
            </Text>
            <Text style={styles.statLabel}>Partial</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="calendar" size={16} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { color: "#3B82F6" }]}>
              {stats.thisMonth}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by SO number, customer..."
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

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {renderFilterButton("All", "all")}
          {renderFilterButton("Completed", "Completed")}
          {renderFilterButton("Partial", "Partial")}
        </ScrollView>
      </View>

      {/* Challan List - Flat like GRN */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8B5CF6"]}
          />
        }
      >
        {challans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No challans match your search"
                : statusFilter !== "all"
                  ? `No ${statusFilter} challans found`
                  : "No challans found"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term"
                : statusFilter !== "all"
                  ? "Try selecting a different filter"
                  : "Create your first challan to get started"}
            </Text>
            {!searchQuery && statusFilter === "all" && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddChallan}
              >
                <Text style={styles.emptyButtonText}>+ Create Challan</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.challanList}>
            {challans.map((challan: any) => {
              const challanStatus = getChallanStatus(challan);

              return (
                <TouchableOpacity
                  key={challan._id}
                  style={styles.challanCard}
                  onPress={() => handleViewChallan(challan._id)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.challanCardHeader}>
                    <View style={styles.challanCardHeaderLeft}>
                      <View style={styles.challanNumberRow}>
                        <Text style={styles.challanNumber}>
                          {challan.challanNumber || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.statusBadgeRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                getStatusColor(challanStatus) + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(challanStatus) },
                            ]}
                          >
                            {challanStatus}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>

                  {/* SO Reference */}
                  <View style={styles.challanCardRow}>
                    <Ionicons name="document-text" size={16} color="#6B7280" />
                    <Text style={styles.challanCardLabel}>SO Reference:</Text>
                    <Text style={styles.challanCardValue}>
                      {challan.soReference || "N/A"}
                    </Text>
                  </View>

                  {/* Customer */}
                  <View style={styles.challanCardRow}>
                    <Ionicons name="business" size={16} color="#6B7280" />
                    <Text style={styles.challanCardLabel}>Customer:</Text>
                    <Text style={styles.challanCardValue}>
                      {challan.customerDetails?.companyName ||
                        challan.salesOrder?.customer?.companyName ||
                        "Unknown"}
                    </Text>
                  </View>

                  {/* Dispatch Date */}
                  <View style={styles.challanCardRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.challanCardLabel}>Dispatch Date:</Text>
                    <Text style={styles.challanCardValue}>
                      {challan.challanDate
                        ? new Date(challan.challanDate).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>

                  {/* Items Count */}
                  <View style={styles.challanCardRow}>
                    <Ionicons name="cube" size={16} color="#6B7280" />
                    <Text style={styles.challanCardLabel}>Items:</Text>
                    <Text style={styles.challanCardValue}>
                      {challan.items?.length || 0}{" "}
                      {challan.items?.length === 1 ? "item" : "items"}{" "}
                      dispatched
                    </Text>
                  </View>

                  {/* Warehouse Location */}
                  {challan.warehouseLocation && (
                    <View style={styles.challanCardRow}>
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text style={styles.challanCardLabel}>Location:</Text>
                      <Text style={styles.challanCardValue} numberOfLines={1}>
                        {challan.warehouseLocation}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          loading={loading}
        />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerTop: {
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
  addButton: {
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
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  subHeader: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: "#111827",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#8B5CF6",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContainer: {
    flex: 1,
  },
  soList: {
    padding: 20,
  },
  soCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  soHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  soHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  soHeaderInfo: {
    flex: 1,
  },
  soHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  soNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  soCustomer: {
    fontSize: 13,
    color: "#6B7280",
  },
  addChallanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  challanList: {
    padding: 16,
    gap: 12,
  },
  challanCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  challanCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  challanCardHeaderLeft: {
    flex: 1,
  },
  challanNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  challanNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  statusBadgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  challanCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  challanCardLabel: {
    fontSize: 13,
    color: "#6B7280",
    width: 100,
  },
  challanCardValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
  },
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: "#8B5CF6",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
