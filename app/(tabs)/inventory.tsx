import CategorySection from '@/components/inventory/CategorySection';
import SearchBar from '@/components/inventory/SearchBar';
import StatsCard from '@/components/inventory/StatsCard';
import ErrorState from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { inventoryAPI } from '../../services/index.js';

export default function InventoryScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load inventory on mount and when search changes
  useEffect(() => {
    loadInventory();
  }, [debouncedSearch]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: 1,
        limit: 20,
        sortBy: 'latestReceiptDate',
        sortOrder: 'desc'
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      const response = await inventoryAPI.getAll(params);
      
      // Safely handle response data
      if (response && response.success && Array.isArray(response.data)) {
        // Create a clean copy of the data to avoid WeakMap issues
        const cleanData = response.data.map((category: any) => {
          const categoryObj = {
            categoryId: String(category.categoryId || 'uncategorized'),
            categoryName: String(category.categoryName || 'Uncategorized'),
            totalProducts: Number(category.totalProducts || category.products?.length || 0),
            products: [] as any[]
          };
          
          if (Array.isArray(category.products)) {
            categoryObj.products = category.products.map((product: any) => {
              const productObj: any = {
                productId: String(product.productId || product._id || ''),
                productName: String(product.productName || ''),
                productCode: String(product.productCode || ''),
                currentStock: Number(product.currentStock || product.totalStock || 0),
                receivedStock: Number(product.receivedStock || 0),
                issuedStock: Number(product.issuedStock || 0),
                unit: String(product.unit || 'Bags'),
                currentWeight: Number(product.currentWeight || product.totalWeight || 0),
                totalWeight: Number(product.totalWeight || product.currentWeight || 0),
                receivedWeight: Number(product.receivedWeight || 0),
                issuedWeight: Number(product.issuedWeight || 0),
                lotCount: Number(product.lotCount || 0),
                grnCount: Number(product.grnCount || 0),
                supplierNames: String(product.supplierNames || ''),
                hasSubProducts: Boolean(product.hasSubProducts || (product.subProductCount && product.subProductCount > 0)),
                subProductCount: Number(product.subProductCount || 0),
                suppliers: [],
                lots: []
              };
              
              // Safely copy suppliers array
              if (Array.isArray(product.suppliers)) {
                productObj.suppliers = product.suppliers.map((s: any) => String(s));
              }
              
              // Safely copy lots array with all nested data
              if (Array.isArray(product.lots)) {
                productObj.lots = product.lots.map((lot: any) => {
                  const lotObj: any = {
                    lotNumber: String(lot.lotNumber || ''),
                    lotId: String(lot.lotId || lot._id || ''),
                    grnNumber: String(lot.grnNumber || ''),
                    receivedQuantity: Number(lot.receivedQuantity || 0),
                    currentQuantity: Number(lot.currentQuantity || 0),
                    issuedQuantity: Number(lot.issuedQuantity || 0),
                    status: String(lot.status || 'Active'),
                    receivedDate: lot.receivedDate ? String(lot.receivedDate) : null,
                    supplierName: String(lot.supplierName || ''),
                    warehouse: String(lot.warehouse || lot.warehouseLocation || ''),
                    movements: []
                  };
                  
                  // Safely copy movements array
                  if (Array.isArray(lot.movements)) {
                    lotObj.movements = lot.movements.map((movement: any) => ({
                      type: String(movement.type || ''),
                      quantity: Number(movement.quantity || 0),
                      weight: Number(movement.weight || 0),
                      date: movement.date ? String(movement.date) : null,
                      reference: String(movement.reference || ''),
                      notes: String(movement.notes || ''),
                      performedBy: String(movement.performedBy || 'System'),
                      _id: String(movement._id || '')
                    }));
                  }
                  
                  return lotObj;
                });
              }
              
              return productObj;
            });
          }
          
          return categoryObj;
        });
        
        setInventory({
          success: true,
          data: cleanData,
          pagination: response.pagination || null
        });
        
        // Auto-expand all categories
        const expanded: Record<string, boolean> = {};
        cleanData.forEach((cat: any) => {
          expanded[cat.categoryId] = true;
        });
        setExpandedCategories(expanded);
      } else {
        setInventory({ success: true, data: [], pagination: null });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
      console.error('Inventory error:', err);
      setInventory(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  }, [debouncedSearch]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleViewProduct = (product: any) => {
    // Navigate to product detail screen with serializable data
    router.push({
      pathname: '/inventory/product-detail',
      params: {
        productId: product.productId,
        productName: product.productName,
        productCode: product.productCode || '',
        currentStock: product.currentStock,
        receivedStock: product.receivedStock,
        issuedStock: product.issuedStock,
        unit: product.unit,
        currentWeight: product.currentWeight || 0,
        totalWeight: product.totalWeight || 0,
        receivedWeight: product.receivedWeight || 0,
        issuedWeight: product.issuedWeight || 0,
        lotCount: product.lotCount || 0,
        grnCount: product.grnCount || 0,
        supplierNames: product.supplierNames || '',
        hasSubProducts: product.hasSubProducts ? '1' : '0',
        subProductCount: String(product.subProductCount || 0),
        suppliers: JSON.stringify(product.suppliers || []),
        lots: JSON.stringify(product.lots || product.grns || []),
      }
    });
  };

  // Calculate stats
  const getStats = () => {
    if (!inventory?.data) return { totalProducts: 0, activeCategories: 0, totalStock: 0, totalWeight: 0 };
    
    let totalProducts = 0;
    let totalStock = 0;
    let totalWeight = 0;
    
    inventory.data.forEach((category: any) => {
      totalProducts += category.products?.length || 0;
      category.products?.forEach((product: any) => {
        totalStock += product.currentStock || 0;
        totalWeight += product.currentWeight || 0;
      });
    });
    
    return {
      totalProducts,
      activeCategories: inventory.data.length,
      totalStock,
      totalWeight
    };
  };

  const stats = getStats();

  if (loading && !inventory) {
    return <ListSkeleton count={4} />;
  }

  if (error && !inventory) {
    return (
      <ErrorState
        title="Unable to Load Inventory"
        message={error}
        onRetry={loadInventory}
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <Text style={styles.subtitle}>Track and manage inventory from approved GRNs</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <StatsCard
              icon="cube"
              label="Total Products"
              value={stats.totalProducts}
              color={COLORS.warning}
            />
          </View>
          <View style={styles.statCard}>
            <StatsCard
              icon="pricetags"
              label="Active Categories"
              value={stats.activeCategories}
              color={COLORS.warning}
            />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <StatsCard
              icon="layers"
              label="Total Stock (Bags)"
              value={stats.totalStock}
              color={COLORS.success}
            />
          </View>
          <View style={styles.statCard}>
            <StatsCard
              icon="scale"
              label="Total Weight (Tons)"
              value={(stats.totalWeight / 1000).toFixed(2)}
              color={COLORS.success}
            />
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        loading={loading && searchQuery !== debouncedSearch}
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Category List */}
      {inventory?.data && inventory.data.length > 0 ? (
        inventory.data.map((category: any) => (
          <CategorySection
            key={category.categoryId || 'uncategorized'}
            category={category}
            isExpanded={expandedCategories[category.categoryId || 'uncategorized']}
            onToggle={() => toggleCategory(category.categoryId || 'uncategorized')}
            onViewProduct={handleViewProduct}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No inventory data available</Text>
          <Text style={styles.emptySubtext}>
            Products that are 100% received from POs will appear here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: SPACING.sm,
  },
  statsContainer: {
    padding: SPACING.lg,
    
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    marginRight: SPACING.md,
  },
  errorContainer: {
    backgroundColor: COLORS.dangerLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl * 2,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});
