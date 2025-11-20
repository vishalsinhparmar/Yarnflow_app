import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMasterDataStats } from '../../services/index.js';

export default function MasterDataScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
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
      const response = await getMasterDataStats();
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load master data stats');
      console.error('Master data stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  const navigateToScreen = (screenName: string) => {
    router.push(`/master-data/${screenName.toLowerCase()}/`);
  };

  const dashboardItems = [
    {
      title: 'Customers',
      count: stats?.customers?.total || 0,
      subtitle: `${stats?.customers?.active || 0} active`,
      color: '#3B82F6',
      icon: '👥',
      screen: 'customers',
    },
    {
      title: 'Suppliers',
      count: stats?.suppliers?.total || 0,
      subtitle: 'Total suppliers',
      color: '#8B5CF6',
      icon: '🏭',
      screen: 'suppliers',
    },
    {
      title: 'Products',
      count: stats?.products?.total || 0,
      subtitle: `${stats?.products?.lowStock || 0} low stock`,
      color: '#10B981',
      icon: '🧶',
      screen: 'products',
    },
    {
      title: 'Categories',
      count: stats?.categories?.total || 0,
      subtitle: 'Product categories',
      color: '#F59E0B',
      icon: '📂',
      screen: 'categories',
    },
  ];

  if (loading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Master Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Master Data Management</ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage customers, suppliers, products, and categories
        </ThemedText>
      </ThemedView>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => navigateToScreen(item.screen)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.count}>{item.count}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedView style={styles.infoBox}>
        <ThemedText style={styles.infoText}>
          💡 Master Data is the foundation of YarnFlow. Set up your customers, suppliers, and products before creating transactions.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    width: '45%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoBox: {
    margin: 16,
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
