import LotCard from '@/components/inventory/LotCard';
import StatsCard from '@/components/inventory/StatsCard';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Reconstruct product object from params
    if (params.productId) {
      try {
        const reconstructedProduct = {
          productId: params.productId,
          productName: params.productName,
          productCode: params.productCode,
          currentStock: Number(params.currentStock),
          receivedStock: Number(params.receivedStock),
          issuedStock: Number(params.issuedStock),
          unit: params.unit,
          currentWeight: Number(params.currentWeight),
          totalWeight: Number(params.totalWeight),
          receivedWeight: Number(params.receivedWeight),
          issuedWeight: Number(params.issuedWeight),
          lotCount: Number(params.lotCount),
          grnCount: Number(params.grnCount),
          supplierNames: params.supplierNames,
          suppliers: params.suppliers ? (
            (() => {
              try {
                return JSON.parse(params.suppliers as string);
              } catch {
                return [];
              }
            })()
          ) : [],
          lots: params.lots ? (
            (() => {
              try {
                const parsed = JSON.parse(params.lots as string);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
              } catch {
                return [];
              }
            })()
          ) : [],
        };
        setProduct(reconstructedProduct);
        setLoading(false);
      } catch (error) {
        console.error('Error reconstructing product data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [params.productId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
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
            Current Stock: {product.currentStock || product.totalStock} {product.unit}
            {product.totalWeight && ` • ${product.totalWeight.toFixed(2)} Kg`}
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
                value={`${product.currentStock || product.totalStock} ${product.unit}`}
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
                .filter((lot) => lot && typeof lot === 'object')
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
});
