import ErrorState from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesOrderAPI.getStats();
      
      if (response?.success) {
        const statsData = response.data;
        const statusBreakdown = statsData.statusBreakdown || [];
        
        const completedCount = statusBreakdown
          .filter((s: any) => s._id === 'delivered' || s._id === 'Delivered')
          .reduce((sum: number, s: any) => sum + s.count, 0);
        
        const draftCount = statusBreakdown
          .filter((s: any) => s._id === 'draft' || s._id === 'Draft')
          .reduce((sum: number, s: any) => sum + s.count, 0);
        
        const pendingCount = statusBreakdown
          .filter((s: any) => ['Pending', 'Processing'].includes(s._id))
          .reduce((sum: number, s: any) => sum + s.count, 0);

        setStats({
          totalOrders: statsData.overview?.totalOrders || 0,
          completed: completedCount,
          draft: draftCount,
          pending: pendingCount,
        });
      }
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  if (loading) {
    return <ListSkeleton count={3} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to Load Sales Data"
        message={error}
        onRetry={loadStats}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
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
          activeOpacity={0.85}
          onPress={() => router.push('/sales-orders')}
        >
          <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.mainCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={28} color="#FFF" />
              </View>
              <View style={styles.cardHeaderRight}>
                <Text style={styles.mainCardTitle}>Sales Orders</Text>
                <Text style={styles.mainCardSubtitle}>Customer orders & invoices</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/sales-orders?filter=all')}>
                <Text style={styles.mainStatValue}>{stats.totalOrders}</Text>
                <Text style={styles.mainStatLabel}>Total</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/sales-orders?filter=Draft')}>
                <Text style={[styles.mainStatValue, { color: '#FCD34D' }]}>{stats.draft}</Text>
                <Text style={styles.mainStatLabel}>Draft</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/sales-orders?filter=Delivered')}>
                <Text style={[styles.mainStatValue, { color: '#34D399' }]}>{stats.completed}</Text>
                <Text style={styles.mainStatLabel}>Delivered</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.viewAllText}>View All Orders</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sales Challan Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/sales-challan')}
        >
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.mainCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="car" size={28} color="#FFF" />
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
              <Text style={styles.viewAllText}>View All Challans</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/sales-orders/form')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="add-circle" size={24} color="#3B82F6" />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Create New Sales Order</Text>
            <Text style={styles.quickActionSubtitle}>Add customer order with products</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/sales-orders?filter=Draft')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIconWrap, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="create" size={24} color="#F59E0B" />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Draft Orders</Text>
            <Text style={styles.quickActionSubtitle}>{stats.draft} orders need attention</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/sales-orders?filter=Delivered')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Delivered Orders</Text>
            <Text style={styles.quickActionSubtitle}>{stats.completed} completed orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Overview Stats */}
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="briefcase" size={22} color="#6366F1" />
            </View>
            <Text style={styles.overviewValue}>{stats.totalOrders}</Text>
            <Text style={styles.overviewLabel}>Total Orders</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.overviewValue}>{stats.pending}</Text>
            <Text style={styles.overviewLabel}>Pending</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-done" size={22} color="#10B981" />
            </View>
            <Text style={styles.overviewValue}>{stats.completed}</Text>
            <Text style={styles.overviewLabel}>Delivered</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={[styles.overviewIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="document" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.overviewValue}>{stats.draft}</Text>
            <Text style={styles.overviewLabel}>Draft</Text>
          </View>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="bulb" size={18} color="#1E40AF" />
        <Text style={styles.infoText}>
          Create Sales Orders for customer purchases. Generate Sales Challans to track deliveries and shipments.
        </Text>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 16,
    gap: 14,
  },
  mainCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderRight: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.85,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
  },
  mainStatLabel: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.8,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  challanDescription: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  overviewSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  overviewIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#1E40AF',
  },
});
