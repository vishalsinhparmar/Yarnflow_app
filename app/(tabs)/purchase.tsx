import ErrorState from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/SkeletonLoader";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { grnAPI } from "../../services/grnAPI";
import { purchaseOrderAPI } from "../../services/purchaseOrderAPI";

interface POStats {
  pending: number;
  draft: number;
  approved: number;
  partialReceived: number;
  fullyReceived: number;
  total: number;
}

interface GRNStats {
  thisMonth: number;
  total: number;
  complete: number;
  partial: number;
}

export default function PurchaseScreen() {
  const router = useRouter();
  const [poStats, setPoStats] = useState<POStats>({
    pending: 0,
    draft: 0,
    approved: 0,
    partialReceived: 0,
    fullyReceived: 0,
    total: 0,
  });
  const [grnStats, setGrnStats] = useState<GRNStats>({
    thisMonth: 0,
    total: 0,
    complete: 0,
    partial: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const loadStats = async () => {
    try {
      setError(null);
      // Load PO stats
      const poResponse = await purchaseOrderAPI.getStats();
      console.log("📊 PO Stats response:", poResponse);

      if (poResponse?.success && poResponse?.data) {
        const data = poResponse.data;
        const statusBreakdown = data.statusBreakdown || [];

        // Extract counts from status breakdown
        const getCount = (status: string) => {
          const found = statusBreakdown.find((s: any) => s._id === status);
          return found?.count || 0;
        };

        setPoStats({
          pending: getCount("Pending"),
          draft: getCount("Draft"),
          approved: getCount("Approved"),
          partialReceived: getCount("Partially_Received"),
          fullyReceived: getCount("Fully_Received"),
          total:
            data.overview?.totalPOs ||
            statusBreakdown.reduce(
              (sum: number, s: any) => sum + (s.count || 0),
              0,
            ) ||
            0,
        });
      }

      // Load GRN stats
      const grnResponse = await grnAPI.getStats();
      console.log("📊 GRN Stats response:", grnResponse);

      if (grnResponse?.success && grnResponse?.data) {
        const data = grnResponse.data;
        setGrnStats({
          thisMonth: data.thisMonth || 0,
          total: data.totalGRNs || 0,
          complete: data.completedGRNs || 0,
          partial: data.partialGRNs || 0,
        });
      }
    } catch (err: any) {
      console.error("Error loading stats:", err);
      setError(err.message || 'Failed to load purchase data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handlePurchaseOrders = () => {
    router.push("/purchase-orders");
  };

  const handleGRN = () => {
    router.push("/grn");
  };

  const pendingPOs = poStats.pending + poStats.draft;

  if (loading && !refreshing) {
    return <ListSkeleton count={3} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to Load Purchase Data"
        message={error}
        onRetry={loadStats}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3B82F6"]}
          />
        }
      >
        {/* Gradient Header */}
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="cart" size={22} color="#FFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Purchase Management</Text>
                <Text style={styles.headerSubtitle}>Purchase Orders & Goods Receipt</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handlePurchaseOrders}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: "#EFF6FF" },
              ]}
            >
              <Ionicons name="cart" size={28} color="#3B82F6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Purchase Orders</Text>
              <Text style={styles.actionSubtitle}>Create & manage POs</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeValue}>{pendingPOs}</Text>
              <Text style={styles.actionBadgeLabel}>Pending</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleGRN}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: "#ECFDF5" },
              ]}
            >
              <Ionicons name="clipboard-outline" size={28} color="#10B981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Goods Receipt Notes</Text>
              <Text style={styles.actionSubtitle}>Record incoming goods</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={[styles.actionBadgeValue, { color: "#10B981" }]}>
                {grnStats.total}
              </Text>
              <Text style={styles.actionBadgeLabel}>Total</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* PO Stats Section - Simplified */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Purchase Order Status</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: "#8B5CF6" }]}>
              <Text style={[styles.statValue, { color: "#8B5CF6" }]}>
                {loading ? "-" : poStats.partialReceived}
              </Text>
              <Text style={styles.statLabel}>Partial</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                {loading ? "-" : poStats.fullyReceived}
              </Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#111827" }]}>
              <Text style={[styles.statValue, { color: "#111827" }]}>
                {loading ? "-" : poStats.total}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* GRN Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>GRN Overview</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                {loading ? "-" : grnStats.complete}
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
              <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                {loading ? "-" : grnStats.partial}
              </Text>
              <Text style={styles.statLabel}>Partial</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#3B82F6" }]}>
              <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                {loading ? "-" : grnStats.thisMonth}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Create Purchase Orders to order materials from suppliers. Record
            Goods Receipt Notes when materials arrive to add them to inventory.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    flex: 1,
    marginLeft: 14,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  actionBadge: {
    alignItems: "center",
    marginRight: 8,
    paddingHorizontal: 10,
  },
  actionBadgeValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3B82F6",
  },
  actionBadgeLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderLeftWidth: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
    textAlign: "center",
  },
  infoBox: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#1E40AF",
  },
});
