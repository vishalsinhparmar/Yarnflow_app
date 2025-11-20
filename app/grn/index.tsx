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
    View,
} from 'react-native';
import { grnAPI } from '../../services/grnAPI';

export default function GRNListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [grns, setGrns] = useState([]);
  const [stats, setStats] = useState({
    totalGRNs: 0,
    completedGRNs: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(params.filter || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGRNs();
    loadStats();
  }, [statusFilter]);

  useEffect(() => {
    if (params.filter && params.filter !== statusFilter) {
      setStatusFilter(params.filter);
    }
  }, [params.filter]);

  const loadGRNs = async () => {
    try {
      console.log('📋 Loading GRNs with params:', { statusFilter, limit: 100 });
      
      const params = {
        limit: 100,
        sort: '-createdAt',
        populate: 'purchaseOrder,purchaseOrder.supplier',
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await grnAPI.getAll(params);
      console.log('📋 GRNs response:', { count: response?.data?.length, filter: statusFilter });

      if (response?.success && response?.data) {
        setGrns(response.data);
      } else {
        setGrns([]);
      }
    } catch (error) {
      console.error('❌ Error loading GRNs:', error);
      setGrns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await grnAPI.getStats();
      console.log('📊 GRN Stats response:', response);

      if (response?.success && response?.data) {
        const data = response.data;
        setStats({
          totalGRNs: data.totalGRNs || 0,
          completedGRNs: data.completedGRNs || 0,
          thisMonth: data.thisMonth || 0,
        });
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGRNs();
    loadStats();
  }, [statusFilter]);

  const handleAddGRN = () => {
    router.push('/grn/form');
  };

  const handleViewGRN = (grnId) => {
    router.push(`/grn/${grnId}`);
  };

  const renderFilterButton = (label, value) => {
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

  const getStatusColor = (status) => {
    const statusColors = {
      Complete: '#10B981',
      Completed: '#10B981',
      Pending: '#F59E0B',
      Draft: '#6B7280',
      Approved: '#3B82F6',
    };
    return statusColors[status] || '#6B7280';
  };

  const filteredGRNs = grns.filter(grn => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const grnNumber = grn.grnNumber?.toLowerCase() || '';
    const poNumber = grn.purchaseOrder?.poNumber?.toLowerCase() || '';
    const supplier = grn.purchaseOrder?.supplierDetails?.companyName?.toLowerCase() || 
                     grn.purchaseOrder?.supplier?.companyName?.toLowerCase() || '';
    
    return grnNumber.includes(query) || poNumber.includes(query) || supplier.includes(query);
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading GRNs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Goods Receipt Notes</Text>
            <Text style={styles.headerSubtitle}>Track incoming goods and materials</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddGRN}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalGRNs}</Text>
            <Text style={styles.statLabel}>Total GRNs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completedGRNs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
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
            placeholder="Search GRNs by number, PO reference, supplier..."
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
          {renderFilterButton('All Status', 'all')}
          {renderFilterButton('Complete', 'Complete')}
          {renderFilterButton('Pending', 'Pending')}
          {renderFilterButton('Draft', 'Draft')}
        </ScrollView>
      </View>

      {/* GRN List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {filteredGRNs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No GRNs match your search' : 
               statusFilter !== 'all' ? `No ${statusFilter} GRNs found` : 
               'No GRNs found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' :
               statusFilter !== 'all' ? 'Try selecting a different filter' :
               'Create your first GRN to get started'}
            </Text>
            {!searchQuery && statusFilter === 'all' && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddGRN}>
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
                    <Text style={styles.grnNumber}>{grn.grnNumber || 'N/A'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(grn.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(grn.status) }]}>
                        {grn.status || 'Draft'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>

                {/* PO Reference */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="document-text" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>PO Reference:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.purchaseOrder?.poNumber || 'N/A'}
                  </Text>
                </View>

                {/* Supplier */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>Supplier:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.purchaseOrder?.supplierDetails?.companyName || 
                     grn.purchaseOrder?.supplier?.companyName || 
                     'Unknown'}
                  </Text>
                </View>

                {/* Receipt Date */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>Receipt Date:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.receiptDate ? new Date(grn.receiptDate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                {/* Items Count */}
                <View style={styles.grnCardRow}>
                  <Ionicons name="cube" size={16} color="#6B7280" />
                  <Text style={styles.grnCardLabel}>Items:</Text>
                  <Text style={styles.grnCardValue}>
                    {grn.items?.length || 0} {grn.items?.length === 1 ? 'item' : 'items'} received
                  </Text>
                </View>

                {/* Warehouse Location */}
                {grn.warehouseLocation && (
                  <View style={styles.grnCardRow}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.grnCardLabel}>Location:</Text>
                    <Text style={styles.grnCardValue} numberOfLines={1}>
                      {grn.warehouseLocation}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#10B981',
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
    backgroundColor: '#10B981',
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
  grnList: {
    padding: 20,
    gap: 12,
  },
  grnCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  grnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  grnCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grnNumber: {
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
  grnCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  grnCardLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  grnCardValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
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
    backgroundColor: '#10B981',
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
