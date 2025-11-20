import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '../../../services/index.js';
import SearchBar from '@/components/masterdata/SearchBar';
import CustomerCard from '@/components/masterdata/CustomerCard';

interface Customer {
  _id: string;
  companyName: string;
  gstNumber?: string;
  panNumber?: string;
  address?: {
    city?: string;
  };
  notes?: string;
}

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load customers on mount and when search changes
  useEffect(() => {
    loadCustomers();
  }, [debouncedSearch]);

  // Auto-refresh when screen comes into focus (after form submission)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have existing data (not on first load)
      if (customers.length > 0 || searchQuery) {
        loadCustomers();
      }
    }, [customers.length, searchQuery])
  );

  const loadCustomers = async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);
      
      const params: any = {
        page,
        limit: 20,
      };
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      const response = await customerAPI.getAll(params);
      
      if (response && response.success && Array.isArray(response.data)) {
        const newCustomers = response.data;
        
        if (append) {
          setCustomers(prev => [...prev, ...newCustomers]);
        } else {
          setCustomers(newCustomers);
        }
        
        setPagination(response.pagination);
      } else {
        setCustomers([]);
        setPagination(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
      console.error('Customers error:', err);
      if (!append) {
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [debouncedSearch]);

  const handleAddCustomer = () => {
    router.push('/master-data/customers/form');
  };

  const handleEditCustomer = (customer: Customer) => {
    router.push({
      pathname: '/master-data/customers/form',
      params: {
        customerId: customer._id,
        mode: 'edit',
        customerData: JSON.stringify(customer),
      },
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c._id === customerId);
    
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete "${customer?.companyName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerAPI.delete(customerId);
              setCustomers(prev => prev.filter(c => c._id !== customerId));
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const loadMoreCustomers = () => {
    if (pagination && pagination.hasNextPage && !loading) {
      loadCustomers(pagination.currentPage + 1, true);
    }
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <CustomerCard
      customer={item}
      onEdit={handleEditCustomer}
      onDelete={handleDeleteCustomer}
    />
  );

  const renderFooter = () => {
    if (!pagination?.hasNextPage) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreCustomers}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Customers Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Customer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && customers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <Text style={styles.headerTitle}>Customer Management</Text>
          </View>
          <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddCustomer}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addHeaderButtonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Manage customer information, contacts, and relationships</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search customers..."
        loading={loading && searchQuery !== debouncedSearch}
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Customer List */}
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={customers.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* Total Count */}
      {customers.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Total Customers: {pagination?.totalDocuments || customers.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  addHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  loadMoreText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
