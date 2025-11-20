import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getWarehouseName } from '../../constants/warehouseLocations';
import { grnAPI } from '../../services/grnAPI';

export default function GRNDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadGRN();
    }
  }, [id]);

  const loadGRN = async () => {
    try {
      setLoading(true);
      console.log('🔗 Loading GRN:', id);
      
      const response = await grnAPI.getById(id);
      console.log('📋 GRN response:', response);

      if (response?.success && response?.data) {
        setGrn(response.data);
      } else {
        Alert.alert('Error', 'Failed to load GRN details');
        router.back();
      }
    } catch (error) {
      console.error('❌ Error loading GRN:', error);
      Alert.alert('Error', 'Failed to load GRN details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/grn/form?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete GRN',
      'Are you sure you want to delete this GRN? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await grnAPI.delete(id);
              Alert.alert('Success', 'GRN deleted successfully');
              router.back();
            } catch (error) {
              console.error('❌ Error deleting GRN:', error);
              Alert.alert('Error', 'Failed to delete GRN');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const statusColors = {
      Complete: '#10B981',
      Completed: '#10B981',
      Pending: '#F59E0B',
      Draft: '#6B7280',
      Approved: '#3B82F6',
    };
    return statusColors[status] || '#6B7280';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading GRN details...</Text>
      </View>
    );
  }

  if (!grn) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>GRN not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GRN Details</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.headerEditButton}>
          <Ionicons name="create-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* GRN Header */}
        <View style={styles.section}>
          <View style={styles.grnHeader}>
            <View>
              <Text style={styles.grnNumber}>{grn.grnNumber || 'N/A'}</Text>
              <Text style={styles.grnDate}>
                Created on {new Date(grn.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(grn.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(grn.status) }]}>
                {grn.status || 'Draft'}
              </Text>
            </View>
          </View>
        </View>

        {/* GRN Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GRN Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>GRN Number</Text>
              <Text style={styles.infoValue}>{grn.grnNumber || 'N/A'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>PO Reference</Text>
              <Text style={styles.infoValue}>
                {grn.purchaseOrder?.poNumber || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Receipt Date</Text>
              <Text style={styles.infoValue}>
                {grn.receiptDate ? new Date(grn.receiptDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(grn.status) + '20' }]}>
                <Text style={[styles.statusTextSmall, { color: getStatusColor(grn.status) }]}>
                  {grn.status || 'Draft'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Supplier Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Information</Text>
          
          <View style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <Ionicons name="business" size={24} color="#10B981" />
              <Text style={styles.supplierName}>
                {grn.purchaseOrder?.supplierDetails?.companyName || 
                 grn.purchaseOrder?.supplier?.companyName || 
                 'Unknown Supplier'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Received */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Received</Text>
          
          {grn.items && grn.items.length > 0 ? (
            grn.items.map((item, index) => {
              const orderedQty = item.orderedQuantity || 0;
              const previousQty = item.previouslyReceived || 0;
              const receivedQty = item.receivedQuantity || 0;
              const pendingQty = orderedQty - previousQty - receivedQty;
              const completionPercentage = orderedQty > 0 
                ? Math.round(((previousQty + receivedQty) / orderedQty) * 100)
                : 0;

              return (
                <View key={index} style={styles.itemCard}>
                  {/* Product Info */}
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemProductName}>{item.productName}</Text>
                    <Text style={styles.itemProductCode}>{item.productCode}</Text>
                  </View>

                  {/* Quantities Grid */}
                  <View style={styles.quantitiesGrid}>
                    <View style={styles.quantityBox}>
                      <Text style={styles.quantityLabel}>Ordered</Text>
                      <Text style={styles.quantityValue}>
                        {orderedQty} {item.unit}
                      </Text>
                    </View>

                    <View style={[styles.quantityBox, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={styles.quantityLabel}>Previously Received</Text>
                      <Text style={[styles.quantityValue, { color: '#1E40AF' }]}>
                        {previousQty} {item.unit}
                      </Text>
                    </View>

                    <View style={[styles.quantityBox, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={styles.quantityLabel}>This GRN</Text>
                      <Text style={[styles.quantityValue, { color: '#065F46' }]}>
                        {receivedQty} {item.unit}
                      </Text>
                    </View>

                    <View style={[styles.quantityBox, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={styles.quantityLabel}>Pending</Text>
                      <Text style={[styles.quantityValue, { color: '#92400E' }]}>
                        {Math.max(0, pendingQty)} {item.unit}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${completionPercentage}%`,
                            backgroundColor: completionPercentage === 100 ? '#10B981' : '#3B82F6'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{completionPercentage}%</Text>
                  </View>

                  {/* Item Notes */}
                  {item.notes && (
                    <View style={styles.itemNotes}>
                      <Text style={styles.itemNotesLabel}>Notes:</Text>
                      <Text style={styles.itemNotesText}>{item.notes}</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.noItemsText}>No items found</Text>
          )}
        </View>

        {/* Warehouse Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse Information</Text>
          
          <View style={styles.warehouseCard}>
            <View style={styles.warehouseRow}>
              <Ionicons name="location" size={20} color="#10B981" />
              <View style={styles.warehouseInfo}>
                <Text style={styles.warehouseLabel}>Warehouse Location</Text>
                <Text style={styles.warehouseValue}>
                  {getWarehouseName(grn.warehouseLocation)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Information */}
        {grn.generalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>General Notes</Text>
              <Text style={styles.notesText}>{grn.generalNotes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete GRN</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerEditButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  grnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  grnNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  grnDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  supplierCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  itemProductCode: {
    fontSize: 13,
    color: '#6B7280',
  },
  quantitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quantityBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  quantityLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'right',
  },
  itemNotes: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  itemNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  itemNotesText: {
    fontSize: 13,
    color: '#78350F',
  },
  noItemsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  warehouseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  warehouseValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
