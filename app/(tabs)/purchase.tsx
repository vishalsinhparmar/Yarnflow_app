import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { grnAPI } from '../../services/grnAPI';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';

export default function PurchaseScreen() {
  const router = useRouter();
  const [poStats, setPoStats] = useState({ pending: 0, total: 0 });
  const [grnStats, setGrnStats] = useState({ today: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load PO stats
      const poResponse = await purchaseOrderAPI.getStats();
      if (poResponse?.success && poResponse?.data) {
        const pendingCount = poResponse.data.statusBreakdown
          ?.filter(s => s._id === 'Pending' || s._id === 'Draft')
          .reduce((sum, s) => sum + s.count, 0) || 0;
        const totalCount = poResponse.data.overview?.totalPOs || 0;
        setPoStats({ pending: pendingCount, total: totalCount });
      }

      // Load GRN stats
      const grnResponse = await grnAPI.getStats();
      if (grnResponse?.success && grnResponse?.data) {
        setGrnStats({
          today: grnResponse.data.thisMonth || 0,
          total: grnResponse.data.totalGRNs || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseOrders = () => {
    router.push('/purchase-orders');
  };

  const handleGRN = () => {
    router.push('/grn');
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Purchase Management</ThemedText>
        <ThemedText style={styles.subtitle}>Purchase Orders & Goods Receipt</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#3B82F6' }]}
          onPress={handlePurchaseOrders}
        >
          <Text style={styles.cardIcon}>🛒</Text>
          <Text style={styles.cardTitle}>Purchase Orders</Text>
          <Text style={styles.cardSubtitle}>Create & manage POs</Text>
          <View style={styles.badge}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.badgeText}>{poStats.pending} Pending</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#10B981' }]}
          onPress={handleGRN}
        >
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>Goods Receipt Notes</Text>
          <Text style={styles.cardSubtitle}>Record incoming goods</Text>
          <View style={styles.badge}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.badgeText}>{grnStats.total} Total</Text>
            )}
          </View>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.statsSection}>
        <ThemedText style={styles.statsTitle}>Overview</ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statValue}>{loading ? '...' : poStats.total}</Text>
            <Text style={styles.statLabel}>Total POs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={styles.statValue}>{loading ? '...' : poStats.pending}</Text>
            <Text style={styles.statLabel}>Pending POs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{loading ? '...' : grnStats.total}</Text>
            <Text style={styles.statLabel}>Total GRNs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statValue}>{loading ? '...' : grnStats.today}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.infoBox}>
        <ThemedText style={styles.infoText}>
          💡 Create Purchase Orders to order materials from suppliers. Record Goods Receipt Notes when materials arrive to add them to inventory.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  section: {
    padding: 20,
    gap: 15,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoBox: {
    margin: 20,
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
