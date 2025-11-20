import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '@/constants/colors';
import ProductCard from './ProductCard';

interface CategorySectionProps {
  category: {
    categoryId: string;
    categoryName: string;
    totalProducts: number;
    products: any[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  onViewProduct: (product: any) => void;
}

export default function CategorySection({
  category,
  isExpanded,
  onToggle,
  onViewProduct,
}: CategorySectionProps) {
  return (
    <View style={styles.container}>
      {/* Category Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={24}
            color={COLORS.gray700}
          />
          <View style={styles.headerText}>
            <Text style={styles.categoryName}>{category.categoryName}</Text>
            <Text style={styles.productCount}>
              {category.totalProducts || category.products?.length || 0} Products
            </Text>
          </View>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{category.categoryName}</Text>
        </View>
      </TouchableOpacity>

      {/* Products List */}
      {isExpanded && (
        <View style={styles.productsContainer}>
          {category.products && category.products.length > 0 ? (
            category.products.map((product: any, index: number) => (
              <ProductCard
                key={product.productId || index}
                product={product}
                onPress={() => onViewProduct(product)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>No products in this category</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.gray50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray900,
    textTransform: 'capitalize',
  },
  productCount: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productsContainer: {
    padding: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },
});
