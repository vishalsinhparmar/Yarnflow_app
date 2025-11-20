import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { poFormatters, purchaseOrderAPI } from '../../services/purchaseOrderAPI.js';

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
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load purchase orders on mount and when search changes
  useEffect(() => {
    loadPurchaseOrders();
  }, [debouncedSearch, statusFilter]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadPurchaseOrders();
    }, [])
  );

  const loadStats = async () => {
    try {
      const response = await purchaseOrderAPI.getStats();
      if (response && response.success) {
        setStats(response.data || {
          totalPOs: 0,
          statusBreakdown: [],
          overduePOs: 0,
          monthlyValue: 0,
          pendingApprovals: 0
        });
      }
    } catch (err) {
      console.error('Error loading PO stats:', err);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        limit: 20,
        sort: '-createdAt'
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
      } else {
        setError('Failed to load purchase orders');
      }
    } catch (err: any) {
      console.error('Error loading purchase orders:', err);
      setError(err.message || 'Failed to load purchase orders');
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
      pathname: '/purchase-orders/[id]',
      params: { id: po._id }
    });
  };

  const handleCreatePO = () => {
    router.push('/purchase-orders/form');
  };

  const handleEdit = (po: PurchaseOrder) => {
    router.push({
      pathname: '/purchase-orders/form',
      params: { id: po._id }
    });
  };

  const handleCancel = (po: PurchaseOrder) => {
    Alert.alert(
      'Cancel Purchase Order',
      'Are you sure you want to cancel this purchase order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await purchaseOrderAPI.cancel(po._id, {
                cancellationReason: 'Cancelled by user',
                cancelledBy: 'Mobile App',
              });
              Alert.alert('Success', 'Purchase order cancelled successfully');
              loadPurchaseOrders();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel purchase order');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (po: PurchaseOrder) => {
    Alert.alert(
      'Delete Purchase Order',
      'Permanently delete this cancelled purchase order? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await purchaseOrderAPI.delete(po._id);
              Alert.alert('Success', 'Purchase order deleted successfully');
              loadPurchaseOrders();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete purchase order');
            }
          },
        },
      ]
    );
  };

  const getStatusCount = (status: string) => {
    const statusItem = stats?.statusBreakdown?.find(item => item._id === status);
    return statusItem ? statusItem.count : 0;
  };

  const renderPOCard = ({ item }: { item: PurchaseOrder }) => {
    const statusInfo = poFormatters.status(item.status);
    const isOverdue = poFormatters.isOverdue(item.expectedDeliveryDate, item.status);
    const supplierName = item.supplierDetails?.companyName || 'N/A';
    const categoryName = item.category?.categoryName || 'N/A';

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
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Supplier:</Text>
            <Text style={styles.orderValue} numberOfLines={1}>{supplierName}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Category:</Text>
            <Text style={styles.orderValue}>{categoryName}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Date:</Text>
            <Text style={styles.orderValue}>{poFormatters.date(item.orderDate)}</Text>
          </View>

          {item.expectedDeliveryDate && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Delivery Date:</Text>
              <Text style={[styles.orderValue, isOverdue && { color: '#EF4444' }]}>
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

          {item.status === 'Draft' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="create-outline" size={18} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Edit</Text>
            </TouchableOpacity>
          )}

          {item.status !== 'Cancelled' && 
           item.status !== 'Fully_Received' && 
           item.status !== 'Closed' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCancel(item)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Cancel</Text>
            </TouchableOpacity>
          )}

          {item.status === 'Cancelled' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
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
          ? 'No orders match your search'
          : 'Create your first purchase order to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>+ PO</Text>
          <Text style={styles.headerSubtitle}>Manage supplier orders and procurement</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={handleCreatePO}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard(getStatusCount('Draft'), 'Draft', '#6366F1', 'document-text')}
          {renderStatCard(getStatusCount('Partially_Received'), 'Partial', '#F59E0B', 'time')}
          {renderStatCard(getStatusCount('Fully_Received'), 'Completed', '#10B981', 'checkmark-circle')}
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
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Purchase Orders List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Recent Purchase Orders</Text>
          
          {purchaseOrders.length === 0 ? (
            renderEmptyState()
          ) : (
            purchaseOrders.map((item) => (
              <View key={item._id}>{renderPOCard({ item })}</View>
            ))
          )}
        </View>
      </ScrollView>

    </View>
  );
}

const renderStatCard = (value: number, label: string, color: string, icon: string) => (
  <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366F1',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: '#E0E7FF', marginTop: 4 },
  newButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: { flex: 1 },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  overdueText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
