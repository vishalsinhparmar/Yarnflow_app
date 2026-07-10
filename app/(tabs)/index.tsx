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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
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
        <Text style={styles.errorTitle}>Cannot Connect</Text>
        <Text style={styles.errorHint}>
          Make sure your backend server is running and the IP address is correct.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadDashboardData}>
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const wf = stats?.workflowMetrics || {};
  const inventory = stats?.stats?.inventory || {};

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
    >
      {/* Gradient Header */}
      <LinearGradient colors={['#1D4ED8', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.name || user?.username || user?.email?.split('@')[0] || 'User'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>YarnFlow — Business at a glance</Text>

        {/* 4 key metric chips in header */}
        <View style={styles.headerMetrics}>
          <TouchableOpacity style={styles.metricChip} onPress={() => router.push('/inventory')}>
            <Ionicons name="cube-outline" size={16} color="#BFDBFE" />
            <Text style={styles.metricChipValue}>{inventory.totalBags || 0}</Text>
            <Text style={styles.metricChipLabel}>Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.metricChip} onPress={() => router.push('/purchase-orders')}>
            <Ionicons name="cart-outline" size={16} color="#BFDBFE" />
            <Text style={styles.metricChipValue}>{wf.purchaseOrders || 0}</Text>
            <Text style={styles.metricChipLabel}>POs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.metricChip} onPress={() => router.push('/grn')}>
            <Ionicons name="clipboard-outline" size={16} color="#BFDBFE" />
            <Text style={styles.metricChipValue}>{wf.goodsReceipt || 0}</Text>
            <Text style={styles.metricChipLabel}>GRNs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.metricChip} onPress={() => router.push('/sales-orders')}>
            <Ionicons name="pricetag-outline" size={16} color="#BFDBFE" />
            <Text style={styles.metricChipValue}>{wf.salesOrders || 0}</Text>
            <Text style={styles.metricChipLabel}>Sales</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Actions — most common daily tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'add-circle', bg: '#EEF2FF', color: '#6366F1', label: 'New Purchase\nOrder', route: '/purchase-orders/form' },
            { icon: 'clipboard', bg: '#ECFDF5', color: '#10B981', label: 'Record\nGRN', route: '/grn/form' },
            { icon: 'create', bg: '#FFF7ED', color: '#F59E0B', label: 'New Sales\nOrder', route: '/sales-orders/form' },
            { icon: 'car', bg: '#F5F3FF', color: '#8B5CF6', label: 'New\nChallan', route: '/sales-challan/form' },
          ].map((a) => (
            <TouchableOpacity
              key={a.route}
              style={styles.actionCard}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={28} color={a.color} />
              </View>
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Navigation modules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Modules</Text>
        <View style={styles.modulesGrid}>
          {[
            { icon: 'folder-open', bg: '#DBEAFE', color: '#3B82F6', label: 'Master Data', route: '/master-data' },
            { icon: 'cart', bg: '#EEF2FF', color: '#6366F1', label: 'Purchase Orders', route: '/purchase-orders' },
            { icon: 'clipboard', bg: '#ECFDF5', color: '#10B981', label: 'GRN Records', route: '/grn' },
            { icon: 'cube', bg: '#DCFCE7', color: '#16A34A', label: 'Inventory', route: '/inventory' },
            { icon: 'pricetag', bg: '#FFF7ED', color: '#F59E0B', label: 'Sales Orders', route: '/sales-orders' },
            { icon: 'send', bg: '#F5F3FF', color: '#8B5CF6', label: 'Challans', route: '/sales-challan' },
          ].map((m) => (
            <TouchableOpacity
              key={m.route}
              style={styles.moduleCard}
              onPress={() => router.push(m.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.moduleIconWrap, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon as any} size={26} color={m.color} />
              </View>
              <Text style={styles.moduleText}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#F0F4FF' },
  // Header
  header: {
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  greetingText: { fontSize: 13, color: '#BFDBFE', fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginTop: 2 },
  headerSubtitle: { fontSize: 12, color: '#93C5FD', marginBottom: 16 },
  logoutButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMetrics: { flexDirection: 'row', gap: 8 },
  metricChip: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2,
  },
  metricChipValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  metricChipLabel: { fontSize: 10, color: '#BFDBFE', fontWeight: '600' },
  // Sections
  section: { paddingHorizontal: 16, marginBottom: 4, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  // Quick actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    flex: 1, minWidth: 140, padding: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  actionIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionText: { fontSize: 12, textAlign: 'center', fontWeight: '600', color: '#374151', lineHeight: 16 },
  // Inventory
  invRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  invCard: {
    flex: 1, backgroundColor: '#FFF', padding: 14, borderRadius: 12,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  invValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 2 },
  invLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  invSubLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  // Category breakdown
  categorySection: { marginTop: 12, marginBottom: 12 },
  categoryTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  categoryList: { gap: 8 },
  categoryItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  categoryDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1',
    marginRight: 10,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 },
  categoryDetails: { fontSize: 11, color: '#6B7280' },
  categoryWeight: { fontSize: 11, color: '#6366F0', fontWeight: '500' },
  viewInventoryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0',
  },
  viewInventoryText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  // Modules
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleCard: {
    flex: 1, minWidth: 140, padding: 18, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  moduleIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleText: { fontSize: 13, textAlign: 'center', fontWeight: '600', color: '#374151' },
  // Error
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  errorIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#EF4444', marginBottom: 8 },
  errorHint: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3B82F6', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 10 },
  retryBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
