import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '../../constants/colors';
import { salesOrderAPI } from '../../services/salesOrderAPI.js';

interface Stats {
  totalOrders: number;
  completed: number;
  draft: number;
  pending: number;
}

export default function SalesScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    completed: 0,
    draft: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await salesOrderAPI.getStats();
      console.log('Sales Screen - Stats response:', response);
      
      if (response?.success) {
        const statsData = response.data;
        const statusBreakdown = statsData.statusBreakdown || [];
        
        console.log('Sales Screen - Status breakdown:', statusBreakdown);
        
        // Count delivered orders (check both lowercase and capitalized)
        const completedCount = statusBreakdown
          .filter((s: any) => s._id === 'delivered' || s._id === 'Delivered')
          .reduce((sum: number, s: any) => sum + s.count, 0);
        
        // Count draft orders (check both lowercase and capitalized)
        const draftCount = statusBreakdown
          .filter((s: any) => s._id === 'draft' || s._id === 'Draft')
          .reduce((sum: number, s: any) => sum + s.count, 0);
        
        // Count pending orders (check both lowercase and capitalized)
        const pendingCount = statusBreakdown
          .filter((s: any) => {
            const id = s._id.toLowerCase();
            return ['pending', 'approved', 'partially_dispatched', 'dispatched'].includes(id);
          })
          .reduce((sum: number, s: any) => sum + s.count, 0);

        console.log('Sales Screen - Calculated stats:', {
          totalOrders: statsData.overview?.totalOrders || 0,
          completed: completedCount,
          draft: draftCount,
          pending: pendingCount
        });

        setStats({
          totalOrders: statsData.overview?.totalOrders || 0,
          completed: completedCount,
          draft: draftCount,
          pending: pendingCount,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  const handleNavigateToSalesOrders = () => {
    router.push('/sales-orders');
  };

  const handleCreateSalesOrder = () => {
    router.push('/sales-orders/form');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading sales data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales & Delivery</Text>
        <Text style={styles.headerSubtitle}>Orders, Invoices & Delivery Tracking</Text>
      </View>

      {/* Main Action Cards */}
      <View style={styles.section}>
        {/* Sales Orders Card */}
        <TouchableOpacity
          style={[styles.mainCard, styles.salesOrderCard]}
          onPress={handleNavigateToSalesOrders}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Text style={styles.cardEmoji}>📝</Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <Text style={styles.mainCardTitle}>Sales Orders</Text>
              <Text style={styles.mainCardSubtitle}>Customer orders & invoices</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/sales-orders?filter=all')}
            >
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/sales-orders?filter=Draft')}
            >
              <Text style={[styles.statValue, { color: '#FCD34D' }]}>{stats.draft}</Text>
              <Text style={styles.statLabel}>Draft</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/sales-orders?filter=Delivered')}
            >
              <Text style={[styles.statValue, { color: '#34D399' }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.viewAllText}>View All Orders →</Text>
          </View>
        </TouchableOpacity>

        {/* Sales Challan Card */}
        <TouchableOpacity
          style={[styles.mainCard, styles.challanCard]}
          activeOpacity={0.8}
          onPress={() => router.push('/sales-challan')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={styles.cardEmoji}>🚚</Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <Text style={styles.mainCardTitle}>Sales Challan</Text>
              <Text style={styles.mainCardSubtitle}>Delivery tracking & status</Text>
            </View>
          </View>

          <Text style={styles.challanDescription}>
            Track deliveries, dispatch status, and manage shipment documents
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.viewAllText}>View All Challans →</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handleCreateSalesOrder}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionEmoji}>➕</Text>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Create New Sales Order</Text>
            <Text style={styles.quickActionSubtitle}>Add customer order with products</Text>
          </View>
          <Text style={styles.quickActionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/sales-orders?filter=Draft')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionEmoji}>📝</Text>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Draft Orders</Text>
            <Text style={styles.quickActionSubtitle}>{stats.draft} orders need attention</Text>
          </View>
          <Text style={styles.quickActionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/sales-orders?filter=Delivered')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionEmoji}>✅</Text>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Delivered Orders</Text>
            <Text style={styles.quickActionSubtitle}>{stats.completed} completed orders</Text>
          </View>
          <Text style={styles.quickActionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Overview Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💼</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statValue}>{stats.draft}</Text>
            <Text style={styles.statLabel}>Draft</Text>
          </View>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Create Sales Orders for customer purchases. Generate Sales Challans to track deliveries and shipments.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.gray600,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  section: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  mainCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  salesOrderCard: {
    backgroundColor: '#3B82F6',
  },
  challanCard: {
    backgroundColor: '#8B5CF6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardHeaderRight: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  challanDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  cardEmoji: {
    fontSize: 32,
  },
  quickActionEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
  },
  quickActionArrow: {
    fontSize: 24,
    color: COLORS.gray400,
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  infoBox: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E40AF',
  },
});
