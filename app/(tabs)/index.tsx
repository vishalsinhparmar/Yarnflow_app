import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardAPI } from '../../services/index.js';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.getStats();
      console.log('Dashboard stats response:', response);
      // Backend returns { success: true, data: {...} }
      if (response?.success && response?.data) {
        setStats(response.data);
      } else {
        setStats(response); // Fallback if response format is different
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
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <ThemedText style={styles.loadingText}>Loading Dashboard...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
        <ThemedText style={styles.errorHint}>
          Make sure your backend server is running at the configured API URL
        </ThemedText>
        <Text style={styles.retryButton} onPress={loadDashboardData}>
          Retry
        </Text>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
        <ThemedText style={styles.subtitle}>Welcome to YarnFlow</ThemedText>
      </ThemedView>

      {/* Stats Cards */}
      {stats && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Overview</ThemedText>
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#6366F1' }]}
              onPress={() => router.push('/purchase-orders')}
            >
              <Text style={styles.statIcon}>🛒</Text>
              <Text style={styles.statValue}>{stats.workflowMetrics?.purchaseOrders || 0}</Text>
              <Text style={styles.statLabel}>Purchase Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/inventory')}
            >
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{stats.workflowMetrics?.inventoryLots || 0}</Text>
              <Text style={styles.statLabel}>Inventory Lots</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#F59E0B' }]}
              onPress={() => router.push('/sales-orders')}
            >
              <Text style={styles.statIcon}>💼</Text>
              <Text style={styles.statValue}>{stats.workflowMetrics?.salesOrders || 0}</Text>
              <Text style={styles.statLabel}>Sales Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}
              onPress={() => router.push('/sales-challan')}
            >
              <Text style={styles.statIcon}>🚚</Text>
              <Text style={styles.statValue}>{stats.workflowMetrics?.salesChallans || 0}</Text>
              <Text style={styles.statLabel}>Active Deliveries</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/purchase-orders/form')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <ThemedText style={styles.actionText}>New Purchase Order</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/grn/form')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <ThemedText style={styles.actionText}>Record GRN</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/sales-orders/form')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <ThemedText style={styles.actionText}>Create Sales Order</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/sales-challan')}
          >
            <Text style={styles.actionIcon}>🚚</Text>
            <ThemedText style={styles.actionText}>View Deliveries</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Module Navigation */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Modules</ThemedText>
        <View style={styles.modulesGrid}>
          <TouchableOpacity 
            style={styles.moduleCard}
            onPress={() => router.push('/master-data')}
          >
            <Text style={styles.moduleIcon}>📁</Text>
            <ThemedText style={styles.moduleText}>Master Data</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moduleCard}
            onPress={() => router.push('/purchase')}
          >
            <Text style={styles.moduleIcon}>🛒</Text>
            <ThemedText style={styles.moduleText}>Purchase</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moduleCard}
            onPress={() => router.push('/inventory')}
          >
            <Text style={styles.moduleIcon}>📦</Text>
            <ThemedText style={styles.moduleText}>Inventory</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moduleCard}
            onPress={() => router.push('/sales')}
          >
            <Text style={styles.moduleIcon}>💼</Text>
            <ThemedText style={styles.moduleText}>Sales</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  section: {
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  moduleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    flex: 1,
    minWidth: 150,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduleText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: 'bold',
    padding: 10,
  },
});
