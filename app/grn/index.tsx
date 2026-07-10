import ErrorState from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/SkeletonLoader";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { useWarehouseLocations } from "../../hooks/useWarehouseLocations";
import { grnAPI } from "../../services/grnAPI";

interface GRNListItem {
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
  receiptDate: string;
  status: string;
  receiptStatus?: string;
  items?: any[];
  warehouseLocation?: string;
  createdAt: string;
}

interface GRNStats {
  totalGRNs: number;
  completedGRNs: number;
  thisMonth: number;
}

export default function GRNListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { locations: warehouseLocations } = useWarehouseLocations();

  const getWarehouseName = (idOrName: string) => {
    if (!idOrName) return '';
    const found = warehouseLocations.find((w: any) => w._id === idOrName);
    return found ? found.name : idOrName;
  };

  const [grns, setGrns] = useState<GRNListItem[]>([]);
  const [stats, setStats] = useState<GRNStats>({
    totalGRNs: 0,
    completedGRNs: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("📋 GRN screen focused - loading data");
      setLoading(true);
      setError(null);
      Promise.all([loadGRNs(), loadStats()])
        .catch((err: any) => setError(err.message || 'Failed to load GRN data'))
        .finally(() => {
          setLoading(false);
        });
    }, [statusFilter, currentPage]),
  );

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (params.filter && params.filter !== statusFilter) {
      const filterValue = Array.isArray(params.filter)
        ? params.filter[0]
        : params.filter;
      setStatusFilter(filterValue);
    }
  }, [params.filter]);

  const loadGRNs = async () => {
    try {
      console.log("📋 Loading GRNs with params:", {
        statusFilter,
        currentPage,
      });

      const queryParams: any = {
        limit: itemsPerPage,
        page: currentPage,
        sort: "-createdAt",
      };

      // Only add status filter if not "All"
      if (statusFilter && statusFilter !== "All" && statusFilter !== "all") {
        queryParams.status = statusFilter;
      }

      const response = await grnAPI.getAll(queryParams);
      console.log("📋 GRNs response:", {
        success: response?.success,
        count: response?.data?.length,
        pagination: response?.pagination,
      });

      if (response && response.success) {
        setGrns(response.data || []);
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
        console.log("📋 No GRN data or failed response");
        setGrns([]);
      }
    } catch (err: any) {
      console.error("❌ Error loading GRNs:", err);
      setGrns([]);
      throw err;
    } finally {
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await grnAPI.getStats();
      console.log("📊 GRN Stats response:", response);

      if (response?.success && response?.data) {
        const data = response.data;
        // Backend may return completed, complete, or completedGRNs
        const completedCount = data.completedGRNs || data.completed || data.complete || data.completeCount || 0;
        setStats({
          totalGRNs: data.totalGRNs || data.total || 0,
          completedGRNs: completedCount,
          thisMonth: data.thisMonth || 0,
        });
      }
    } catch (error) {
      console.error("❌ Error loading stats:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGRNs();
    loadStats();
  }, [statusFilter]);

  const handleAddGRN = () => {
    router.push("/grn/form");
  };

  const handleViewGRN = (grnId: string) => {
    router.push(`/grn/${grnId}`);
  };

  const renderFilterButton = (label: string, value: string) => {
    const isActive = statusFilter === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setStatusFilter(value)}
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

  const filteredGRNs = grns.filter((grn) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const grnNumber = grn.grnNumber?.toLowerCase() || "";
    const poNumber = grn.purchaseOrder?.poNumber?.toLowerCase() || "";
    const supplier =
      grn.purchaseOrder?.supplierDetails?.companyName?.toLowerCase() ||
      grn.purchaseOrder?.supplier?.companyName?.toLowerCase() ||
      "";

    return (
      grnNumber.includes(query) ||
      poNumber.includes(query) ||
      supplier.includes(query)
    );
  });

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (error && grns.length === 0) {
    return (
      <ErrorState
        title="Unable to Load GRNs"
        message={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          Promise.all([loadGRNs(), loadStats()])
            .catch((err: any) => setError(err.message || 'Failed to load GRN data'))
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="clipboard" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Goods Receipt Notes</Text>
              <Text style={styles.headerSubtitle}>
                Track incoming goods & materials
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddGRN} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#10B981" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.subHeader}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="layers" size={16} color="#6366F1" />
            </View>
            <Text style={styles.statValue}>{stats.totalGRNs}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-done" size={16} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {stats.completedGRNs}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
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
            placeholder="Search GRNs by number, PO, supplier..."
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
          {renderFilterButton("All Status", "all")}
          {renderFilterButton("Complete", "Complete")}
          {renderFilterButton("Pending", "Pending")}
          {renderFilterButton("Draft", "Draft")}
        </ScrollView>
      </View>

      {/* GRN List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10B981"]}
          />
        }
      >
        {filteredGRNs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No GRNs match your search"
                : statusFilter !== "all"
                  ? `No ${statusFilter} GRNs found`
                  : "No GRNs found"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term"
                : statusFilter !== "all"
                  ? "Try selecting a different filter"
                  : "Create your first GRN to get started"}
            </Text>
            {!searchQuery && statusFilter === "all" && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddGRN}
              >
                <Text style={styles.emptyButtonText}>+ Create GRN</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grnList}>
            {filteredGRNs.map((grn) => (
              <TouchableOpacity
                key={grn._id}
                style={styles.grnCard}
                onPress={() => handleViewGRN(grn._id)}
                activeOpacity={0.7}
              >
                {/* Header */}
                <View style={styles.grnCardHeader}>
                  <View style={styles.grnCardHeaderLeft}>
                    <View style={styles.grnNumberRow}>
                      <Text style={styles.grnNumber}>
                        {grn.grnNumber || "N/A"}
                      </Text>
                      {grn.receiptStatus === "Partial" &&
                        grn.purchaseOrder?._id && (
                          <TouchableOpacity
                            style={styles.addGrnButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/grn/form?poId=${grn.purchaseOrder._id}`,
                              );
                            }}
                          >
                            <Ionicons name="add" size={14} color="#fff" />
                            <Text style={styles.addGrnButtonText}>Add GRN</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.statusBadgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(grn.status) + "20",
                          },
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
                      {grn.receiptStatus && (
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                getReceiptStatusColor(grn.receiptStatus) + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: getReceiptStatusColor(grn.receiptStatus),
                              },
                            ]}
                          >
                            {grn.receiptStatus}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>

                {/* PO Reference */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="document-text" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>PO Reference:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.purchaseOrder?.poNumber || "N/A"}
                  </Text>
                </View>

                {/* Supplier */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>Supplier:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.purchaseOrder?.supplierDetails?.companyName ||
                      grn.purchaseOrder?.supplier?.companyName ||
                      "Unknown"}
                  </Text>
                </View>

                {/* Receipt Date */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>Receipt Date:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.receiptDate
                      ? new Date(grn.receiptDate).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>

                {/* Items Count */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="cube" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>Items:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.items?.length || 0}{" "}
                    {grn.items?.length === 1 ? "item" : "items"} received
                  </Text>
                </View>

                {/* Warehouse Location */}
                {grn.warehouseLocation && (
                  <View style={styles.grnCardRow}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.grnCardLabel}>Location:</Text>
                    <Text style={styles.grnCardValue} numberOfLines={1}>
                      {getWarehouseName(grn.warehouseLocation)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

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
    color: "#10B981",
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
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    fontSize: 11,
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
    backgroundColor: "#10B981",
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
  grnList: {
    padding: 20,
    gap: 12,
  },
  grnCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  grnCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  grnCardHeaderLeft: {
    flex: 1,
  },
  grnNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  grnNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  addGrnButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  addGrnButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  statusBadgeRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
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
  grnCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  grnCardLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  grnCardValue: {
    fontSize: 13,
    color: "#111827",
    flex: 1,
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
    backgroundColor: "#10B981",
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
