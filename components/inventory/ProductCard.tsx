import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  product: {
    productId: string;
    productName: string;
    productCode?: string;
    currentStock: number;
    receivedStock: number;
    issuedStock: number;
    unit: string;
    currentWeight?: number;
    receivedWeight?: number;
    issuedWeight?: number;
    lotCount?: number;
    supplierNames?: string;
    subProductCount?: number;
  };
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.productName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {product.productCode && (
              <Text style={styles.productCode}>{product.productCode}</Text>
            )}
            {product.subProductCount && product.subProductCount > 0 ? (
              <View style={styles.subProductBadge}>
                <Text style={styles.subProductBadgeText}>
                  {product.subProductCount} sub-product{product.subProductCount > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.stockBadge}>
          <Text style={styles.stockValue}>
            {product.currentStock ?? 0} {product.unit || ''}
          </Text>
        </View>
      </View>

      {/* Stock Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current Stock</Text>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {product.currentStock ?? 0} {product.unit || ''}
          </Text>
          <Text style={styles.statSubtext}>After stock out</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Stock In</Text>
          <Text style={[styles.statValue, { color: COLORS.info }]}>
            +{product.receivedStock}
          </Text>
          <Text style={styles.statSubtext}>From GRN</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Stock Out</Text>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>
            -{product.issuedStock || 0}
          </Text>
          <Text style={styles.statSubtext}>Via Challan</Text>
        </View>
      </View>

      {/* Weight Info */}
      {product.currentWeight !== undefined && (
        <View style={styles.weightContainer}>
          <View style={styles.weightRow}>
            <Ionicons name="scale-outline" size={14} color={COLORS.gray600} />
            <Text style={styles.weightLabel}>Weight:</Text>
            <Text style={styles.weightValue}>
              {product.currentWeight.toFixed(2)} Kg
            </Text>
          </View>
          <View style={styles.weightChanges}>
            {product.receivedWeight != null && product.receivedWeight > 0 && (
              <Text style={[styles.weightChange, { color: COLORS.success }]}>
                +{product.receivedWeight.toFixed(2)}
              </Text>
            )}
            {product.issuedWeight != null && product.issuedWeight > 0 && (
              <Text style={[styles.weightChange, { color: COLORS.danger }]}>
                -{product.issuedWeight.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {product.supplierNames && (
          <View style={styles.supplierInfo}>
            <Ionicons name="business-outline" size={12} color={COLORS.gray500} />
            <Text style={styles.supplierText} numberOfLines={1}>
              {product.supplierNames}
            </Text>
          </View>
        )}
        <View style={styles.lotInfo}>
          <Ionicons name="cube-outline" size={12} color={COLORS.gray500} />
          <Text style={styles.lotText}>{product.lotCount || 0} Lots</Text>
        </View>
      </View>

      {/* View Details Button */}
      <TouchableOpacity style={styles.viewButton} onPress={onPress}>
        <Text style={styles.viewButtonText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  productInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  productCode: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  subProductBadge: {
    backgroundColor: '#FCE7F3',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F9A8D4',
  },
  subProductBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#BE185D',
  },
  stockBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray200,
    marginHorizontal: SPACING.sm,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 9,
    color: COLORS.gray400,
  },
  weightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  weightValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  weightChanges: {
    flexDirection: 'row',
    gap: 8,
  },
  weightChange: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: SPACING.sm,
  },
  supplierText: {
    fontSize: 11,
    color: COLORS.gray600,
    flex: 1,
  },
  lotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lotText: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
});
