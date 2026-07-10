import SearchBar from '@/components/masterdata/SearchBar';
import SupplierCard from '@/components/masterdata/SupplierCard';
import Pagination from '@/components/Pagination';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { supplierAPI } from '../../../services/index.js';

interface Supplier {
  _id: string;
  companyName: string;
  gstNumber?: string;
  panNumber?: string;
  address?: {
    city?: string;
  };
  status?: string;
}

export default function SuppliersScreen() {
  const router = useRouter();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load suppliers on mount and when search changes
  useEffect(() => {
    loadSuppliers();
  }, [debouncedSearch]);

  // Auto-refresh when screen comes into focus (after form submission)
  useFocusEffect(
    useCallback(() => {
      if (suppliers.length > 0 || searchQuery) {
        loadSuppliers();
      }
    }, [suppliers.length, searchQuery])
  );

  const loadSuppliers = async (page = 1, append = false) => {
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
      
      const response = await supplierAPI.getAll(params);
      
      if (response && response.success && Array.isArray(response.data)) {
        const newSuppliers = response.data;
        
        if (append) {
          setSuppliers(prev => [...prev, ...newSuppliers]);
        } else {
          setSuppliers(newSuppliers);
        }
        
        setPagination(response.pagination);
      } else {
        setSuppliers([]);
        setPagination(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
      console.error('Suppliers error:', err);
      if (!append) {
        setSuppliers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  }, [debouncedSearch]);

  const handleAddSupplier = () => {
    router.push('/master-data/suppliers/form');
  };

  const handleEditSupplier = (supplier: Supplier) => {
    router.push({
      pathname: '/master-data/suppliers/form',
      params: {
        supplierId: supplier._id,
        mode: 'edit',
        supplierData: JSON.stringify(supplier),
      },
    });
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier?.companyName}"? This action cannot be undone.`,
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
              await supplierAPI.delete(supplierId);
              setSuppliers(prev => prev.filter(s => s._id !== supplierId));
              toast.showToast('success', 'Supplier Deleted', 'Supplier removed successfully');
            } catch (err: any) {
              toast.showToast('error', 'Delete Failed', err.message || 'Failed to delete supplier');
            }
          },
        },
      ]
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadSuppliers(page, false);
  };

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <SupplierCard
      supplier={item}
      onEdit={handleEditSupplier}
      onDelete={handleDeleteSupplier}
    />
  );

  const renderFooter = () => {
    if (!pagination || pagination.pages <= 1) return null;
    
    return (
      <Pagination
        currentPage={pagination.current || currentPage}
        totalPages={pagination.pages || 1}
        totalItems={pagination.total || suppliers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        loading={loading}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Suppliers Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddSupplier}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Supplier</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && suppliers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading suppliers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="business" size={24} color="#8B5CF6" />
            <Text style={styles.headerTitle}>Supplier Management</Text>
          </View>
          <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddSupplier}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addHeaderButtonText}>Add Supplier</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Manage supplier information, contracts, and vendor relationships</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search suppliers..."
        loading={loading && searchQuery !== debouncedSearch}
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Supplier List */}
      <FlatList
        data={suppliers}
        renderItem={renderSupplier}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={suppliers.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* Total Count */}
      {suppliers.length > 0 && pagination && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Total Suppliers: {pagination?.total || suppliers.length}
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
