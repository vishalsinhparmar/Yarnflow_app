import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardRow}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={styles.cardContent}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={10} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={10} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonStatCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.statCard, style]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <Skeleton width={50} height={22} style={{ marginTop: 8 }} />
      <Skeleton width={60} height={10} style={{ marginTop: 6 }} />
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboardContainer}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Skeleton width={38} height={38} borderRadius={19} />
            <View>
              <Skeleton width={80} height={10} />
              <Skeleton width={120} height={12} style={{ marginTop: 6 }} />
            </View>
          </View>
          <Skeleton width={38} height={38} borderRadius={12} />
        </View>
        <Skeleton width={160} height={24} style={{ marginTop: 16 }} />
      </View>

      {/* Stats skeleton */}
      <View style={styles.statsRow}>
        <SkeletonStatCard style={{ flex: 1 }} />
        <SkeletonStatCard style={{ flex: 1 }} />
      </View>
      <View style={styles.statsRow}>
        <SkeletonStatCard style={{ flex: 1 }} />
        <SkeletonStatCard style={{ flex: 1 }} />
      </View>

      {/* Section skeleton */}
      <Skeleton width={120} height={18} style={{ marginTop: 20, marginHorizontal: 20 }} />
      <View style={styles.statsRow}>
        <SkeletonCard style={{ flex: 1 }} />
        <SkeletonCard style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {/* Header skeleton */}
      <View style={styles.listHeader}>
        <View>
          <Skeleton width={180} height={20} />
          <Skeleton width={140} height={12} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <SkeletonStatCard style={{ flex: 1 }} />
        <SkeletonStatCard style={{ flex: 1 }} />
        <SkeletonStatCard style={{ flex: 1 }} />
      </View>

      {/* Search skeleton */}
      <Skeleton width="100%" height={44} borderRadius={12} style={{ marginHorizontal: 20, marginBottom: 12, width: '90%', alignSelf: 'center' }} />

      {/* Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={{ marginHorizontal: 20, marginBottom: 12 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSkeleton: {
    padding: 20,
    paddingTop: 56,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
});
