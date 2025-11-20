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
import { productAPI } from '../../../services/index.js';
import SearchBar from '@/components/masterdata/SearchBar';
import ProductCard from '@/components/masterdata/ProductCard';

interface Product {
  _id: string;
  productName: string;
  category?: {
    categoryName: string;
  };
  description?: string;
}

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
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

  // Load products on mount and when search changes
  useEffect(() => {
    loadProducts();
  }, [debouncedSearch]);

  // Auto-refresh when screen comes into focus (after form submission)
  useFocusEffect(
    useCallback(() => {
      if (products.length > 0 || searchQuery) {
        loadProducts();
      }
    }, [products.length, searchQuery])
  );

  const loadProducts = async (page = 1, append = false) => {
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
      
      const response = await productAPI.getAll(params);
      
      if (response && response.success && Array.isArray(response.data)) {
        const newProducts = response.data;
        
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        setPagination(response.pagination);
      } else {
        setProducts([]);
        setPagination(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      console.error('Products error:', err);
      if (!append) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [debouncedSearch]);

  const handleAddProduct = () => {
    router.push('/master-data/products/form');
  };

  const handleEditProduct = (product: Product) => {
    router.push({
      pathname: '/master-data/products/form',
      params: {
        productId: product._id,
        mode: 'edit',
        productData: JSON.stringify(product),
      },
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p._id === productId);
    
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.productName}"? This action cannot be undone.`,
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
              await productAPI.delete(productId);
              setProducts(prev => prev.filter(p => p._id !== productId));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const loadMoreProducts = () => {
    if (pagination && pagination.hasNextPage && !loading) {
      loadProducts(pagination.currentPage + 1, true);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onEdit={handleEditProduct}
      onDelete={handleDeleteProduct}
    />
  );

  const renderFooter = () => {
    if (!pagination?.hasNextPage) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreProducts}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms' : 'Add your first product to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="cube" size={24} color="#10B981" />
            <Text style={styles.headerTitle}>Product Management</Text>
          </View>
          <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddProduct}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addHeaderButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Manage product catalog, specifications, and inventory tracking</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products..."
        loading={loading && searchQuery !== debouncedSearch}
      />

      {/* Filter Options */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={16} color="#6B7280" />
          <Text style={styles.filterText}>All Categories</Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={products.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* Total Count */}
      {products.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Total Products: {pagination?.totalDocuments || products.length}
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
    backgroundColor: '#10B981',
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignSelf: 'flex-start',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 8,
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
    backgroundColor: '#10B981',
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
