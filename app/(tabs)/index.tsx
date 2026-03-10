import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardAPI } from '../../services/index.js';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.getStats();
      if (response?.success && response?.data) {
        setStats(response.data);
      } else {
        setStats(response);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Make sure your backend server is running at the configured API URL
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadDashboardData}>
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={['#F97316', '#EA580C']} style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={styles.greetingText}>Welcome back</Text>
              <Text style={styles.userEmail}>{user?.email || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => router.push('/purchase-orders')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="cart" size={22} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statValue}>{stats.workflowMetrics?.purchaseOrders || 0}</Text>
                <Text style={styles.statLabel}>Purchase Orders</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => router.push('/inventory')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="cube" size={22} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statValue}>{stats.workflowMetrics?.inventoryLots || 0}</Text>
                <Text style={styles.statLabel}>Inventory Lots</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => router.push('/sales-orders')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="pricetag" size={22} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statValue}>{stats.workflowMetrics?.salesOrders || 0}</Text>
                <Text style={styles.statLabel}>Sales Orders</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => router.push('/sales-challan')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="send" size={22} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statValue}>{stats.workflowMetrics?.salesChallans || 0}</Text>
                <Text style={styles.statLabel}>Active Deliveries</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/purchase-orders/form')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="add-circle" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>New Purchase Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/grn/form')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="clipboard" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionText}>Record GRN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/sales-orders/form')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="create" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Create Sales Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/sales-challan')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="car" size={28} color="#8B5CF6" />
            </View>
            <Text style={styles.actionText}>View Deliveries</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Module Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/master-data')}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="folder-open" size={26} color="#3B82F6" />
            </View>
            <Text style={styles.moduleText}>Master Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/purchase')}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="cart" size={26} color="#6366F1" />
            </View>
            <Text style={styles.moduleText}>Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/inventory')}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cube" size={26} color="#10B981" />
            </View>
            <Text style={styles.moduleText}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/sales')}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="pricetag" size={26} color="#F59E0B" />
            </View>
            <Text style={styles.moduleText}>Sales</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCardWrap: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {
    padding: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduleText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F9FAFB',
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
