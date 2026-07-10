import LotCard from '@/components/inventory/LotCard';
import StatsCard from '@/components/inventory/StatsCard';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { inventoryAPI } from '../../services/inventoryAPI';

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [subProductBreakdown, setSubProductBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subproducts' | 'lots'>('overview');
  const [selectedSubProduct, setSelectedSubProduct] = useState<any>(null);

  useEffect(() => {
    if (params.productId) {
      loadProductDetail();
    } else {
      setLoading(false);
    }
  }, [params.productId]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId as string;
      const response = await inventoryAPI.getProductDetail(productId);

      if (response?.success && response?.data) {
        const data = response.data;
        const spBreakdown = data.subProductBreakdown || [];
        setProduct({
          productId: data.product?._id || productId,
          productName: data.product?.productName || params.productName,
          unit: data.product?.unit || params.unit || 'Bags',
          currentStock: data.currentStock ?? Number(params.currentStock ?? 0),
          receivedStock: data.receivedStock ?? Number(params.receivedStock ?? 0),
          issuedStock: data.issuedStock ?? Number(params.issuedStock ?? 0),
          currentWeight: data.currentWeight ?? Number(params.currentWeight ?? 0),
          receivedWeight: data.receivedWeight ?? Number(params.receivedWeight ?? 0),
          issuedWeight: data.issuedWeight ?? Number(params.issuedWeight ?? 0),
          lotCount: data.lotCount ?? Number(params.lotCount ?? 0),
          suppliers: data.suppliers || [],
          lots: data.lots || [],
          hasSubProducts: spBreakdown.length > 0 || params.hasSubProducts === '1',
          subProductCount: spBreakdown.length || Number(params.subProductCount ?? 0),
        });
        setSubProductBreakdown(spBreakdown);
      } else {
        // Fallback to params if API call fails
        const reconstructed = {
          productId: params.productId,
          productName: params.productName,
          unit: params.unit,
          currentStock: Number(params.currentStock ?? 0),
          receivedStock: Number(params.receivedStock ?? 0),
          issuedStock: Number(params.issuedStock ?? 0),
          currentWeight: Number(params.currentWeight ?? 0),
          receivedWeight: Number(params.receivedWeight ?? 0),
          issuedWeight: Number(params.issuedWeight ?? 0),
          lotCount: Number(params.lotCount ?? 0),
          hasSubProducts: params.hasSubProducts === '1',
          subProductCount: Number(params.subProductCount ?? 0),
          suppliers: params.suppliers ? JSON.parse(params.suppliers as string) : [],
          lots: params.lots ? JSON.parse(params.lots as string) : [],
        };
        setProduct(reconstructed);
      }
    } catch (error) {
      console.error('Error loading product detail:', error);
      // Fallback to params
      try {
        const reconstructed = {
          productId: params.productId,
          productName: params.productName,
          unit: params.unit,
          currentStock: Number(params.currentStock ?? 0),
          receivedStock: Number(params.receivedStock ?? 0),
          issuedStock: Number(params.issuedStock ?? 0),
          currentWeight: Number(params.currentWeight ?? 0),
          receivedWeight: Number(params.receivedWeight ?? 0),
          issuedWeight: Number(params.issuedWeight ?? 0),
          lotCount: Number(params.lotCount ?? 0),
          hasSubProducts: params.hasSubProducts === '1',
          subProductCount: Number(params.subProductCount ?? 0),
          suppliers: params.suppliers ? JSON.parse(params.suppliers as string) : [],
          lots: params.lots ? JSON.parse(params.lots as string) : [],
        };
        setProduct(reconstructed);
      } catch {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray400} />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{product.productName}</Text>
          <Text style={styles.headerSubtitle}>
            Stock: {product.currentStock ?? product.totalStock ?? 0} {product.unit || 'Bags'}
            {product.currentWeight ? ` • ${product.currentWeight.toFixed(2)} Kg` : ''}
            {product.hasSubProducts && product.subProductCount > 0
              ? ` • ${product.subProductCount} Sub-Product${product.subProductCount > 1 ? 's' : ''}`
              : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <StatsCard
                icon="cube"
                label="Current Stock"
                value={`${product.currentStock ?? product.totalStock ?? 0} ${product.unit || 'Bags'}`}
                color={COLORS.success}
              />
              <Text style={styles.statNote}>After stock out</Text>
            </View>
            <View style={styles.statCardWrapper}>
              <StatsCard
                icon="arrow-down-circle"
                label="Stock In (GRN)"
                value={`+${product.receivedStock || product.totalStock}`}
                color={COLORS.info}
              />
              <Text style={styles.statNote}>Total received</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <StatsCard
                icon="arrow-up-circle"
                label="Stock Out"
                value={`-${product.issuedStock || 0}`}
                color={COLORS.danger}
              />
              <Text style={styles.statNote}>Via Challan</Text>
            </View>
            <View style={styles.statCardWrapper}>
              <StatsCard
                icon="layers"
                label="Total Lots"
                value={product.lotCount || product.grnCount || 0}
                color="#9333EA"
              />
              <Text style={styles.statNote}>Inventory lots</Text>
            </View>
          </View>
        </View>

        {/* Sub-Product Breakdown */}
        {subProductBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sub-Product Breakdown</Text>
            {subProductBreakdown.map((sp: any, index: number) => (
              <View key={sp.subProductId || index} style={styles.subProductRow}>
                <View style={styles.subProductLeft}>
                  <View style={styles.subProductDot} />
                  <Text style={styles.subProductName}>
                    {product.productName} X {sp.subProductName}
                  </Text>
                </View>
                <View style={styles.subProductStats}>
                  <View style={styles.subProductStat}>
                    <Text style={styles.subProductStatLabel}>Stock</Text>
                    <Text style={styles.subProductStatValue}>
                      {sp.currentStock ?? 0} {product.unit}
                    </Text>
                  </View>
                  <View style={styles.subProductStat}>
                    <Text style={styles.subProductStatLabel}>Weight</Text>
                    <Text style={styles.subProductStatValue}>
                      {(sp.currentWeight ?? 0).toFixed(2)} kg
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewSubProductButton}
                  onPress={() => setSelectedSubProduct(sp)}
                >
                  <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.viewSubProductButtonText}>View Details</Text>
                </TouchableOpacity>
                {sp.perUnitWeights && sp.perUnitWeights.length > 0 && (
                  <View style={styles.perUnitContainer}>
                    <Text style={styles.perUnitLabel}>Per-unit weights:</Text>
                    <View style={styles.perUnitChips}>
                      {sp.perUnitWeights.slice(0, 8).map((w: number, wi: number) => (
                        <View key={wi} style={styles.perUnitChip}>
                          <Text style={styles.perUnitChipText}>#{wi + 1}: {w.toFixed(2)}kg</Text>
                        </View>
                      ))}
                      {sp.perUnitWeights.length > 8 && (
                        <Text style={styles.perUnitMore}>+{sp.perUnitWeights.length - 8} more</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Suppliers */}
        {product.suppliers && product.suppliers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suppliers</Text>
            <View style={styles.supplierContainer}>
              {product.suppliers
                .filter((supplier: any) => supplier && (typeof supplier === 'string' || typeof supplier === 'object'))
                .map((supplier: any, index: number) => {
                  const supplierName = typeof supplier === 'string' ? supplier : supplier.name || supplier.companyName || 'Unknown Supplier';
                  return (
                    <View key={`supplier-${index}-${supplierName}`} style={styles.supplierBadge}>
                      <Ionicons name="business" size={14} color="#7C3AED" />
                      <Text style={styles.supplierText}>{String(supplierName)}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Inventory Lots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Inventory Lots ({product.lotCount || product.grnCount || 0} Lots)
          </Text>
          <View style={styles.lotsContainer}>
            {(product.lots || product.grns || []).length > 0 ? (
              (product.lots || product.grns || [])
                .filter((lot: any) => lot && typeof lot === 'object')
                .map((lot: any, index: number) => {
                  // Create completely new object to avoid WeakMap issues
                  const safeLot = {
                    lotNumber: lot.lotNumber || lot.lotId || `lot-${index}`,
                    grnNumber: lot.grnNumber || `grn-${index}`,
                    status: lot.status || 'Active',
                    supplierName: lot.supplierName || 'Unknown Supplier',
                    warehouse: lot.warehouse || lot.warehouseLocation || '',
                    warehouseLocation: lot.warehouseLocation || lot.warehouse || '',
                    receivedQuantity: Number(lot.receivedQuantity) || 0,
                    currentQuantity: Number(lot.currentQuantity) || 0,
                    issuedQuantity: Number(lot.issuedQuantity) || 0,
                    receivedDate: lot.receivedDate || lot.receiptDate || '',
                    receiptDate: lot.receiptDate || lot.receivedDate || '',
                    movements: Array.isArray(lot.movements) ? lot.movements.filter(Boolean) : []
                  };
                  
                  return (
                    <LotCard
                      key={`lot-${safeLot.lotNumber}-${index}`}
                      lot={safeLot}
                      productUnit={String(product.unit || 'Units')}
                    />
                  );
                })
            ) : (
              <View style={styles.emptyLots}>
                <Ionicons name="cube-outline" size={48} color={COLORS.gray300} />
                <Text style={styles.emptyLotsText}>No lot information available</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sub-Product Detail Modal */}
      <Modal
        visible={!!selectedSubProduct}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSubProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {selectedSubProduct?.subProductName
                    ? `${product?.productName || 'Product'} X ${selectedSubProduct.subProductName}`
                    : 'Product Details'}
                </Text>
                {selectedSubProduct && (
                  <Text style={styles.modalSubtitle}>
                    Stock: {selectedSubProduct.currentStock ?? 0} {product?.unit || 'Bags'} • Weight: {(selectedSubProduct.currentWeight ?? 0).toFixed(2)} kg
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedSubProduct(null)}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSubProduct && (
                <>
                  {/* Sub-product stats */}
                  <View style={styles.modalStatsRow}>
                    <View style={[styles.modalStatCard, { backgroundColor: '#ECFDF5' }]}>
                      <Text style={[styles.modalStatLabel, { color: '#065F46' }]}>Current Stock</Text>
                      <Text style={[styles.modalStatValue, { color: '#065F46' }]}>
                        {selectedSubProduct.currentStock ?? 0} {product?.unit || 'Bags'}
                      </Text>
                    </View>
                    <View style={[styles.modalStatCard, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={[styles.modalStatLabel, { color: '#1E40AF' }]}>Current Weight</Text>
                      <Text style={[styles.modalStatValue, { color: '#1E40AF' }]}>
                        {(selectedSubProduct.currentWeight ?? 0).toFixed(2)} kg
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalStatsRow}>
                    <View style={[styles.modalStatCard, { backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.modalStatLabel, { color: '#374151' }]}>Received</Text>
                      <Text style={[styles.modalStatValue, { color: '#374151' }]}>
                        {selectedSubProduct.receivedStock ?? 0} {product?.unit || 'Bags'}
                      </Text>
                    </View>
                    <View style={[styles.modalStatCard, { backgroundColor: '#FEF2F2' }]}>
                      <Text style={[styles.modalStatLabel, { color: '#991B1B' }]}>Issued</Text>
                      <Text style={[styles.modalStatValue, { color: '#991B1B' }]}>
                        {selectedSubProduct.issuedStock ?? 0} {product?.unit || 'Bags'}
                      </Text>
                    </View>
                  </View>

                  {/* Lots for this sub-product */}
                  <Text style={styles.modalSectionTitle}>Inventory Lots</Text>
                  {(selectedSubProduct.lots || []).length > 0 ? (
                    (selectedSubProduct.lots || []).map((lot: any, index: number) => {
                      const safeLot = {
                        lotNumber: lot.lotNumber || lot.lotId || `lot-${index}`,
                        grnNumber: lot.grnNumber || `grn-${index}`,
                        status: lot.status || 'Active',
                        supplierName: lot.supplierName || 'Unknown Supplier',
                        warehouse: lot.warehouse || lot.warehouseLocation || '',
                        warehouseLocation: lot.warehouseLocation || lot.warehouse || '',
                        receivedQuantity: Number(lot.receivedQuantity) || 0,
                        currentQuantity: Number(lot.currentQuantity) || 0,
                        issuedQuantity: Number(lot.issuedQuantity) || 0,
                        receivedDate: lot.receivedDate || lot.receiptDate || '',
                        receiptDate: lot.receiptDate || lot.receivedDate || '',
                        movements: Array.isArray(lot.movements) ? lot.movements.filter(Boolean) : []
                      };
                      return (
                        <LotCard
                          key={`sp-lot-${safeLot.lotNumber}-${index}`}
                          lot={safeLot}
                          productUnit={String(product?.unit || 'Units')}
                        />
                      );
                    })
                  ) : (
                    <View style={styles.emptyLots}>
                      <Ionicons name="cube-outline" size={48} color={COLORS.gray300} />
                      <Text style={styles.emptyLotsText}>No lot information available</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray600,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray600,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  statsContainer: {
    padding: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statCardWrapper: {
    flex: 1,
    marginRight: SPACING.md,
  },
  statNote: {
    fontSize: 10,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: SPACING.lg,
  },
  supplierContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  supplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  supplierText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 6,
  },
  lotsContainer: {
  },
  emptyLots: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyLotsText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },
  subProductRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subProductLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subProductDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  subProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  subProductStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  subProductStat: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  subProductStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 2,
  },
  subProductStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  perUnitContainer: {
    marginTop: 4,
  },
  perUnitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  perUnitChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  perUnitChip: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  perUnitChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  perUnitMore: {
    fontSize: 11,
    color: '#6B7280',
    alignSelf: 'center',
    marginLeft: 4,
  },
  viewSubProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  viewSubProductButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '85%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.md,
  },
  modalStatCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
});
