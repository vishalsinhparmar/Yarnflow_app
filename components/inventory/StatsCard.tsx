import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '@/constants/colors';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
  backgroundColor?: string;
}

export default function StatsCard({ icon, label, value, color, backgroundColor }: StatsCardProps) {
  return (
    <View style={[styles.container, { backgroundColor: backgroundColor || color }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Ionicons name={icon} size={32} color="#FFFFFF" style={styles.icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 90,
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  icon: {
    opacity: 0.9,
  },
});
