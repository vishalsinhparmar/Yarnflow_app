import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { salesOrderAPI, soFormatters } from '../../services/salesOrderAPI';

export default function SalesOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [salesOrders, setSalesOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    delivered: 0,
    draft: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(params.filter || 'all');

  // Update filter when URL params change
  useEffect(() => {
    if (params.filter && params.filter !== statusFilter) {
      setStatusFilter(params.filter);
    }
  }, [params.filter]);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadSalesOrders(), loadStats()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSalesOrders = async () => {
    try {
      const params = {
        limit: 100, // Increased for better UX
        sort: '-createdAt',
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      console.log('📋 Loading sales orders with params:', params);
      const response = await salesOrderAPI.getAll(params);
      console.log('📋 Sales orders response:', {
        success: response?.success,
        count: response?.data?.length || 0,
        filter: statusFilter
      });
      
      if (response?.success) {
        const orders = response.data || [];
        setSalesOrders(orders);
        
        if (orders.length === 0 && statusFilter !== 'all') {
          console.log(`ℹ️ No ${statusFilter} orders found`);
        }
      }
    } catch (err) {
      console.error('❌ Error loading sales orders:', err);
      Alert.alert('Error', 'Failed to load sales orders. Please try again.');
    }
  };

  const loadStats = async () => {
    try {
      const response = await salesOrderAPI.getStats();
      console.log('📊 Stats response:', response);
      
      if (response?.success) {
        const statsData = response.data;
        const statusBreakdown = statsData.statusBreakdown || [];
        
        console.log('📊 Status breakdown:', statusBreakdown);
        
        // Count delivered orders (completed) - check both lowercase and capitalized
        const deliveredCount = statusBreakdown
          .filter((s) => s._id === 'delivered' || s._id === 'Delivered')
          .reduce((sum, s) => sum + s.count, 0);
        
        // Count draft orders - check both lowercase and capitalized
        const draftCount = statusBreakdown
          .filter((s) => s._id === 'draft' || s._id === 'Draft')
          .reduce((sum, s) => sum + s.count, 0);

        const totalOrders = statsData.overview?.totalOrders || 0;

        console.log('📊 Calculated stats:', { totalOrders, deliveredCount, draftCount });

        setStats({
          totalOrders,
          delivered: deliveredCount,
          draft: draftCount,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [statusFilter, searchQuery]);

  const handleSearch = () => {
    loadSalesOrders();
  };

  const handleCancel = (id) => {
    Alert.alert(
      'Cancel Sales Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await salesOrderAPI.cancel(id, 'Cancelled by user');
              Alert.alert('Success', 'Order cancelled successfully');
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order');
            }
          }
        }
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Sales Order',
      'Are you sure you want to permanently delete this cancelled order? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await salesOrderAPI.delete(id);
              Alert.alert('Success', 'Sales order deleted successfully');
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete sales order');
            }
          }
        }
      ]
    );
  };

  const renderStatCard = (value, label, color, icon) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderFilterButton = (label, value) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setStatusFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        statusFilter === value && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderCard = (order) => {
    const statusInfo = soFormatters.status(order.status);
    const isOverdue = soFormatters.isOverdue(order.expectedDeliveryDate, order.status);
    const customerName = order.customer?.companyName || order.customer || 'N/A';
    const categoryName = order.category?.categoryName || order.category || 'N/A';

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
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Customer:</Text>
            <Text style={styles.orderValue} numberOfLines={1}>{customerName}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Category:</Text>
            <Text style={styles.orderValue}>{categoryName}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Date:</Text>
            <Text style={styles.orderValue}>{soFormatters.date(order.orderDate)}</Text>
          </View>

          {order.expectedDeliveryDate && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Delivery Date:</Text>
              <Text style={[styles.orderValue, isOverdue && { color: '#EF4444' }]}>
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

          {order.status === 'Draft' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Editing order:', order._id);
                router.push(`/sales-orders/form?id=${order._id}`);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Edit</Text>
            </TouchableOpacity>
          )}

          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCancel(order._id)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Cancel</Text>
            </TouchableOpacity>
          )}

          {order.status === 'Cancelled' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(order._id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading sales orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sales Orders (SO)</Text>
          <Text style={styles.headerSubtitle}>Manage customer orders and sales transactions</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/sales-orders/form')}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.newButtonText}>New Sales Order</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsContainer}>
          {renderStatCard(stats.totalOrders, 'Total Orders', '#6B7280', 'document-text')}
          {renderStatCard(stats.delivered, 'Completed', '#10B981', 'checkmark-circle')}
          {renderStatCard(stats.draft, 'Draft', '#3B82F6', 'create')}
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
              <TouchableOpacity onPress={() => { setSearchQuery(''); loadSalesOrders(); }}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {renderFilterButton('All', 'all')}
            {renderFilterButton('Draft', 'Draft')}
            {renderFilterButton('Delivered', 'Delivered')}
            {renderFilterButton('Cancelled', 'Cancelled')}
          </ScrollView>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Recent Sales Orders</Text>
          
          {salesOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No sales orders found</Text>
              <Text style={styles.emptySubtext}>
                {statusFilter !== 'all' 
                  ? `No ${statusFilter} orders available`
                  : 'Create your first sales order to get started'}
              </Text>
            </View>
          ) : (
            salesOrders.map(renderOrderCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  newButtonText: { color: '#6366F1', fontSize: 14, fontWeight: '600' },
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
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
