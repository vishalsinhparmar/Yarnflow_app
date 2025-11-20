import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { salesChallanAPI } from '../../services/salesChallanAPI';

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
  const [expandedSOs, setExpandedSOs] = useState<{[key: string]: boolean}>({});
  const [stats, setStats] = useState<ChallanStats>({
    totalChallans: 0,
    completed: 0,
    partial: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(params.filter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sosPerPage] = useState(5);

  useEffect(() => {
    loadAllData();
  }, [statusFilter]);

  useEffect(() => {
    if (params.filter && params.filter !== statusFilter) {
      setStatusFilter(params.filter);
    }
  }, [params.filter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading Sales Challans...');

      // Load stats and challans in parallel
      const [statsRes, challansRes] = await Promise.all([
        salesChallanAPI.getStats(),
        salesChallanAPI.getAll({
          limit: 100,
          sort: '-createdAt',
          populate: 'salesOrder,salesOrder.customer',
        }),
      ]);

      // Process stats
      if (statsRes?.success && statsRes?.data) {
        const data = statsRes.data;
        setStats({
          totalChallans: data.overview?.totalChallans || data.totalChallans || 0,
          completed: data.completed || 0,
          partial: data.partial || 0,
          thisMonth: data.overview?.thisMonth || data.thisMonth || 0,
        });
      }

      // Process challans
      if (challansRes?.success && challansRes?.data) {
        let challanData = Array.isArray(challansRes.data) ? challansRes.data : [];
        
        // Apply status filter
        if (statusFilter !== 'all' && challanData.length > 0) {
          challanData = challanData.filter(challan => {
            if (!challan || !Array.isArray(challan.items) || challan.items.length === 0) {
              return statusFilter === 'Pending';
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

            if (statusFilter === 'Completed') {
              return allItemsComplete;
            } else if (statusFilter === 'Partial') {
              return anyItemPartial;
            }
            return true;
          });
        }

        setChallans(challanData);

        // Group by SO
        const grouped = groupChallansBySO(challanData);
        setGroupedBySO(grouped);

        // Initialize expansion
        const expanded: {[key: string]: boolean} = {};
        grouped.forEach((so, index) => {
          const soKey = so.soId || so.soNumber;
          expanded[soKey] = index < 5;
        });
        setExpandedSOs(expanded);
      }
    } catch (err) {
      console.error('❌ Error loading challans:', err);
      setChallans([]);
      setGroupedBySO([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupChallansBySO = (challanList: any[]): GroupedSO[] => {
    const grouped: {[key: string]: GroupedSO} = {};

    challanList.forEach(challan => {
      const soKey = challan.salesOrder?._id || challan.soReference || 'unknown';

      if (!grouped[soKey]) {
        grouped[soKey] = {
          soId: challan.salesOrder?._id || soKey,
          soNumber: challan.soReference || 'N/A',
          customer: challan.customerDetails?.companyName || 
                   challan.salesOrder?.customer?.companyName || 'Unknown',
          challans: [],
          totalItems: 0,
          dispatchedItems: 0,
          soStatus: 'Pending',
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
    Object.values(grouped).forEach(so => {
      if (so.salesOrder && so.salesOrder.status) {
        if (so.salesOrder.status === 'Delivered') {
          so.soStatus = 'Delivered';
        } else if (so.salesOrder.status === 'Shipped' || so.salesOrder.status === 'Processing') {
          so.soStatus = 'Partial';
        } else {
          so.soStatus = 'Pending';
        }
      } else {
        const allDelivered = so.challans.every(c => c.status === 'Delivered');
        const someDelivered = so.challans.some(c => c.status === 'Delivered');

        if (allDelivered) {
          so.soStatus = 'Delivered';
        } else if (someDelivered || so.dispatchedItems > 0) {
          so.soStatus = 'Partial';
        } else {
          so.soStatus = 'Pending';
        }
      }
    });

    return Object.values(grouped);
  };

  const toggleSO = (soKey: string) => {
    setExpandedSOs(prev => ({
      ...prev,
      [soKey]: !prev[soKey],
    }));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [statusFilter]);

  const handleAddChallan = () => {
    router.push('/sales-challan/form');
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
        onPress={() => setStatusFilter(value)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    const statusColors: {[key: string]: string} = {
      Delivered: '#10B981',
      Partial: '#F59E0B',
      Pending: '#6B7280',
      Complete: '#10B981',
    };
    return statusColors[status] || '#6B7280';
  };

  const getChallanStatus = (challan: any) => {
    if (!challan.items || challan.items.length === 0) return 'Pending';

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

    if (allItemsComplete) return 'Delivered';
    if (anyItemPartial) return 'Partial';
    return 'Pending';
  };

  const filteredGroupedSOs = groupedBySO.filter(so => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const soNumber = so.soNumber?.toLowerCase() || '';
    const customer = so.customer?.toLowerCase() || '';

    return soNumber.includes(query) || customer.includes(query);
  });

  const paginatedSOs = filteredGroupedSOs.slice(
    (currentPage - 1) * sosPerPage,
    currentPage * sosPerPage
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading challans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Sales Challan</Text>
            <Text style={styles.headerSubtitle}>Delivery tracking & shipment documents</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddChallan}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalChallans}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.partial}</Text>
            <Text style={styles.statLabel}>Partial</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by SO number, customer..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
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
          {renderFilterButton('All', 'all')}
          {renderFilterButton('Completed', 'Completed')}
          {renderFilterButton('Partial', 'Partial')}
        </ScrollView>
      </View>

      {/* Challan List Grouped by SO */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {paginatedSOs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No challans match your search' : 'No challans found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Create your first challan to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddChallan}>
                <Text style={styles.emptyButtonText}>+ Create Challan</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.soList}>
            {paginatedSOs.map((so) => {
              const soKey = so.soId || so.soNumber;
              const isExpanded = expandedSOs[soKey];

              return (
                <View key={soKey} style={styles.soCard}>
                  {/* SO Header */}
                  <TouchableOpacity
                    style={styles.soHeader}
                    onPress={() => toggleSO(soKey)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.soHeaderLeft}>
                      <Ionicons
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                        size={24}
                        color="#6B7280"
                      />
                      <View style={styles.soHeaderInfo}>
                        <View style={styles.soHeaderRow}>
                          <Text style={styles.soNumber}>{so.soNumber}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(so.soStatus) + '20' },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: getStatusColor(so.soStatus) }]}
                            >
                              {so.soStatus}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.soCustomer}>
                          Customer: {so.customer} • {so.challans.length} Challan(s) •{' '}
                          {so.dispatchedItems}/{so.totalItems} items dispatched
                        </Text>
                      </View>
                    </View>
                    {so.soStatus !== 'Delivered' && (
                      <TouchableOpacity
                        style={styles.addChallanButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddChallanForSO(so);
                        }}
                      >
                        <Ionicons name="add" size={20} color="#8B5CF6" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {/* Challans List */}
                  {isExpanded && (
                    <View style={styles.challansContainer}>
                      {so.challans.map((challan, index) => {
                        const challanStatus = getChallanStatus(challan);

                        return (
                          <TouchableOpacity
                            key={challan._id}
                            style={[
                              styles.challanCard,
                              index === so.challans.length - 1 && styles.challanCardLast,
                            ]}
                            onPress={() => handleViewChallan(challan._id)}
                            activeOpacity={0.7}
                          >
                            {/* Challan Header */}
                            <View style={styles.challanHeader}>
                              <Text style={styles.challanNumber}>{challan.challanNumber}</Text>
                              <View
                                style={[
                                  styles.statusBadgeSmall,
                                  { backgroundColor: getStatusColor(challanStatus) + '20' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusTextSmall,
                                    { color: getStatusColor(challanStatus) },
                                  ]}
                                >
                                  {challanStatus}
                                </Text>
                              </View>
                            </View>

                            {/* Challan Info */}
                            <View style={styles.challanInfo}>
                              <View style={styles.challanRow}>
                                <Ionicons name="calendar" size={14} color="#6B7280" />
                                <Text style={styles.challanLabel}>Dispatch:</Text>
                                <Text style={styles.challanValue}>
                                  {challan.challanDate
                                    ? new Date(challan.challanDate).toLocaleDateString()
                                    : 'N/A'}
                                </Text>
                              </View>

                              {/* Products */}
                              {challan.items && challan.items.length > 0 && (
                                <View style={styles.challanRow}>
                                  <Ionicons name="cube" size={14} color="#6B7280" />
                                  <Text style={styles.challanLabel}>Products:</Text>
                                  <Text style={styles.challanValue} numberOfLines={1}>
                                    {challan.items
                                      .map((item: any) => item.productName)
                                      .join(', ')}
                                  </Text>
                                </View>
                              )}

                              {/* Quantity */}
                              {challan.items && challan.items.length > 0 && (
                                <View style={styles.challanRow}>
                                  <Ionicons name="layers" size={14} color="#6B7280" />
                                  <Text style={styles.challanLabel}>Quantity:</Text>
                                  <Text style={styles.challanValue}>
                                    {challan.items.reduce(
                                      (sum: number, item: any) =>
                                        sum + (item.dispatchQuantity || 0),
                                      0
                                    )}{' '}
                                    {challan.items[0]?.unit || 'units'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.challanFooter}>
                              <Text style={styles.viewDetailsText}>View Details</Text>
                              <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Pagination */}
            {filteredGroupedSOs.length > sosPerPage && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>

                <Text style={styles.paginationText}>
                  {currentPage} of {Math.ceil(filteredGroupedSOs.length / sosPerPage)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    currentPage === Math.ceil(filteredGroupedSOs.length / sosPerPage) &&
                      styles.paginationButtonDisabled,
                  ]}
                  onPress={() =>
                    setCurrentPage(
                      Math.min(Math.ceil(filteredGroupedSOs.length / sosPerPage), currentPage + 1)
                    )
                  }
                  disabled={currentPage === Math.ceil(filteredGroupedSOs.length / sosPerPage)}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
  },
  soList: {
    padding: 20,
  },
  soCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  soHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  soHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  soHeaderInfo: {
    flex: 1,
  },
  soHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  soNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  soCustomer: {
    fontSize: 13,
    color: '#6B7280',
  },
  addChallanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challansContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  challanCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  challanCardLast: {
    borderBottomWidth: 0,
  },
  challanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challanNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  challanInfo: {
    gap: 8,
    marginBottom: 12,
  },
  challanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challanLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  challanValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
  },
  challanFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  paginationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
