import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    router.push(`/master-data/${screenName.toLowerCase()}/` as any);
  };

  const dashboardItems: { title: string; count: number; subtitle: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap; screen: string }[] = [
    {
      title: 'Customers',
      count: stats?.customers?.total || 0,
      subtitle: `${stats?.customers?.active || 0} active`,
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      icon: 'people',
      screen: 'customers',
    },
    {
      title: 'Suppliers',
      count: stats?.suppliers?.total || 0,
      subtitle: 'Total suppliers',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      icon: 'business',
      screen: 'suppliers',
    },
    {
      title: 'Products',
      count: stats?.products?.total || 0,
      subtitle: `${stats?.products?.lowStock || 0} low stock`,
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: 'cube',
      screen: 'products',
    },
    {
      title: 'Categories',
      count: stats?.categories?.total || 0,
      subtitle: 'Product categories',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: 'folder-open',
      screen: 'categories',
    },
    {
      title: 'Sub-Products',
      count: stats?.subProducts?.total || 0,
      subtitle: 'View all sub-products',
      color: '#EC4899',
      bgColor: '#FCE7F3',
      icon: 'git-branch',
      screen: 'sub-products',
    },
  ];

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="folder-open" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Master Data</Text>
              <Text style={styles.headerSubtitle}>Manage your business data</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Cards Grid */}
        <View style={styles.grid}>
          {dashboardItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigateToScreen(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={[styles.cardIconWrap, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[styles.cardCount, { color: item.color }]}>{item.count}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="bulb" size={16} color="#2563EB" />
          </View>
          <Text style={styles.infoText}>
            Master Data is the foundation of YarnFlow. Set up your customers, suppliers, and products before creating transactions.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    margin: 6,
    width: '46%',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCount: {
    fontSize: 28,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  infoBox: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#1E40AF',
  },
});
