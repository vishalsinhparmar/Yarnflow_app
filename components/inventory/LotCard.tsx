import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '@/constants/colors';

interface LotCardProps {
  lot: {
    lotNumber?: string;
    grnNumber: string;
    status?: string;
    supplierName: string;
    warehouse?: string;
    warehouseLocation?: string;
    receivedQuantity: number;
    currentQuantity?: number;
    issuedQuantity?: number;
    receivedDate?: string;
    receiptDate?: string;
    movements?: any[];
  };
  productUnit: string;
}

// Simple date formatter to avoid external dependencies
const formatSimpleDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// Simple warehouse name formatter
const getSimpleWarehouseName = (code: string): string => {
  if (!code) return 'Unknown';
  return code.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

function LotCard({ lot, productUnit }: LotCardProps) {
  // Validate input
  if (!lot || typeof lot !== 'object') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid lot data</Text>
      </View>
    );
  }

  // Extract safe values
  const lotNumber = String(lot.lotNumber || lot.grnNumber || 'Unknown');
  const grnNumber = String(lot.grnNumber || 'Unknown');
  const status = String(lot.status || 'Active');
  const supplierName = String(lot.supplierName || 'Unknown Supplier');
  const warehouse = String(lot.warehouse || lot.warehouseLocation || 'Unknown');
  const receivedQuantity = Number(lot.receivedQuantity) || 0;
  const currentQuantity = Number(lot.currentQuantity) || 0;
  const issuedQuantity = Number(lot.issuedQuantity) || 0;
  const receivedDate = lot.receivedDate || lot.receiptDate;
  const safeProductUnit = String(productUnit || 'Units');
  const isLotFormat = Boolean(lot.lotNumber);

  // Status colors - using direct values to avoid dynamic objects
  const statusBgColor = status === 'Active' ? COLORS.successLight : 
                       status === 'Consumed' ? COLORS.gray100 : 
                       status === 'Reserved' ? COLORS.warningLight : COLORS.gray100;
  
  const statusTextColor = status === 'Active' ? COLORS.success : 
                         status === 'Consumed' ? COLORS.gray500 : 
                         status === 'Reserved' ? COLORS.warning : COLORS.gray500;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.lotNumber}>{lotNumber}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>GRN: {grnNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.date}>{formatSimpleDate(receivedDate)}</Text>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📦 Supplier: </Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {supplierName}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>🏢 Warehouse: </Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {getSimpleWarehouseName(warehouse)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📥 Received: </Text>
          <Text style={[styles.detailValue, styles.successText]}>
            {String(receivedQuantity)} {safeProductUnit}
          </Text>
        </View>

        {isLotFormat && currentQuantity !== undefined && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📊 Current: </Text>
            <Text style={[styles.detailValue, styles.infoText]}>
              {String(currentQuantity)} {safeProductUnit}
            </Text>
          </View>
        )}

        {isLotFormat && issuedQuantity > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📤 Issued: </Text>
            <Text style={[styles.detailValue, styles.dangerText]}>
              -{String(issuedQuantity)} {safeProductUnit}
            </Text>
          </View>
        )}
      </View>

      {/* Simple Movement History */}
      {isLotFormat && lot.movements && Array.isArray(lot.movements) && lot.movements.length > 0 && (
        <View style={styles.movementsContainer}>
          <Text style={styles.movementsTitle}>Movement History</Text>
          {lot.movements
            .filter(m => m && typeof m === 'object' && m.type)
            .slice(0, 3)
            .map((movement, index) => {
              const movementType = String(movement.type || 'Unknown');
              const isReceived = movementType === 'Received';
              const quantity = Number(movement.quantity) || 0;
              const reference = String(movement.reference || '');
              const notes = String(movement.notes || '');
              
              return (
                <View key={String(index)} style={isReceived ? styles.movementReceived : styles.movementIssued}>
                  <View style={styles.movementHeader}>
                    <Text style={styles.movementType}>
                      {isReceived ? '📥 Stock In' : '📤 Stock Out'}
                    </Text>
                    <Text style={isReceived ? styles.successText : styles.dangerText}>
                      {isReceived ? '+' : '-'}{String(quantity)} {safeProductUnit}
                    </Text>
                  </View>
                  {reference && (
                    <Text style={styles.movementReference}>Ref: {reference}</Text>
                  )}
                  {notes && (
                    <Text style={styles.movementNotes}>{notes}</Text>
                  )}
                  <Text style={styles.movementDate}>
                    {formatSimpleDate(movement.date)}
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
}

export default LotCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  lotNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  badge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'right',
  },
  detailsGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.gray900,
    fontWeight: '600',
    flex: 1,
  },
  successText: {
    color: COLORS.success,
  },
  infoText: {
    color: COLORS.info,
  },
  dangerText: {
    color: COLORS.danger,
  },
  movementsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: SPACING.md,
  },
  movementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SPACING.sm,
  },
  movementReceived: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.successLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  movementIssued: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.dangerLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  movementType: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  movementReference: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  movementNotes: {
    fontSize: 11,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  movementDate: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    padding: SPACING.md,
  },
});
