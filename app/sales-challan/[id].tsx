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
import { salesChallanAPI } from '../../services/salesChallanAPI';

export default function SalesChallanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadChallan();
    }
  }, [id]);

  const loadChallan = async () => {
    try {
      setLoading(true);
      // Use getAll with ID filter instead of getById to avoid backend auto-populate bug
      const response = await salesChallanAPI.getAll({
        _id: id,
        populate: 'salesOrder,salesOrder.customer'
      });
      if (response?.success && response?.data && response.data.length > 0) {
        setChallan(response.data[0]);
      } else {
        Alert.alert('Error', 'Challan not found');
        router.back();
      }
    } catch (err) {
      console.error('Error loading challan:', err);
      Alert.alert('Error', err.message || 'Failed to load challan');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/sales-challan/form?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Challan',
      'Are you sure you want to delete this challan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await salesChallanAPI.delete(id);
              Alert.alert('Success', 'Challan deleted successfully');
              router.back();
            } catch (error) {
              console.error('❌ Error deleting challan:', error);
              Alert.alert('Error', 'Failed to delete challan');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    const statusColors: {[key: string]: string} = {
      Delivered: '#10B981',
      Partial: '#F59E0B',
      Pending: '#6B7280',
      Complete: '#10B981',
    };
    return statusColors[status] || '#6B7280';
  };

  const getChallanStatus = () => {
    if (!challan || !challan.items || challan.items.length === 0) return 'Pending';

    let allItemsComplete = true;
    let anyItemPartial = false;

    challan.items.forEach((item: any) => {
      const dispatched = item.dispatchQuantity || 0;
      const ordered = item.orderedQuantity || 0;
      const manuallyCompleted = item.manuallyCompleted || false;

      if (manuallyCompleted || dispatched >= ordered) {
        // Complete
      } else if (dispatched > 0 && dispatched < ordered) {
        allItemsComplete = false;
        anyItemPartial = true;
      } else {
        allItemsComplete = false;
      }
    });

    if (allItemsComplete) return 'Delivered';
    if (anyItemPartial) return 'Partial';
    return 'Pending';
  };

  const getItemStatus = (item: any) => {
    const dispatched = item.dispatchQuantity || 0;
    const ordered = item.orderedQuantity || 0;
    const manuallyCompleted = item.manuallyCompleted || false;

    if (manuallyCompleted || dispatched >= ordered) {
      return 'Complete';
    } else if (dispatched > 0 && dispatched < ordered) {
      return 'Partial';
    }
    return 'Pending';
  };

  const getItemCompletion = (item: any) => {
    const dispatched = item.dispatchQuantity || 0;
    const ordered = item.orderedQuantity || 0;
    
    if (ordered === 0) return 0;
    return Math.round((dispatched / ordered) * 100);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading challan details...</Text>
      </View>
    );
  }

  if (!challan) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Challan not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const challanStatus = getChallanStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challan Details</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.headerEditButton}>
          <Ionicons name="create-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Challan Header */}
        <View style={styles.section}>
          <View style={styles.challanHeader}>
            <View>
              <Text style={styles.challanNumber}>{challan.challanNumber || 'N/A'}</Text>
              <Text style={styles.challanDate}>
                Created on{' '}
                {new Date(challan.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(challanStatus) + '20' },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(challanStatus) }]}>
                {challanStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Challan Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challan Information</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Challan Number</Text>
              <Text style={styles.infoValue}>{challan.challanNumber || 'N/A'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SO Reference</Text>
              <Text style={styles.infoValue}>{challan.soReference || 'N/A'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dispatch Date</Text>
              <Text style={styles.infoValue}>
                {challan.challanDate
                  ? new Date(challan.challanDate).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Expected Delivery</Text>
              <Text style={styles.infoValue}>
                {challan.expectedDeliveryDate
                  ? new Date(challan.expectedDeliveryDate).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>
                {challan.customerDetails?.companyName ||
                  challan.salesOrder?.customer?.companyName ||
                  'Unknown'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Warehouse Location</Text>
              <Text style={styles.infoValue}>
                {getWarehouseName(challan.warehouseLocation)}
              </Text>
            </View>
          </View>
        </View>

        {/* Dispatched Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispatched Items</Text>

          {challan.items && challan.items.length > 0 ? (
            challan.items.map((item: any, index: number) => {
              const itemStatus = getItemStatus(item);
              const completion = getItemCompletion(item);

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
                      <Text style={styles.quantityLabel}>SO Total Qty</Text>
                      <Text style={styles.quantityValue}>
                        {item.orderedQuantity} {item.unit}
                      </Text>
                    </View>

                    <View style={[styles.quantityBox, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={styles.quantityLabel}>This Challan</Text>
                      <Text style={[styles.quantityValue, { color: '#065F46' }]}>
                        {item.dispatchQuantity} {item.unit}
                      </Text>
                    </View>

                    <View style={[styles.quantityBox, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={styles.quantityLabel}>Weight</Text>
                      <Text style={[styles.quantityValue, { color: '#1E40AF' }]}>
                        {item.weight?.toFixed(2) || 0} kg
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
                            width: `${completion}%`,
                            backgroundColor:
                              completion === 100 ? '#10B981' : '#3B82F6',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{completion}%</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.itemStatusContainer}>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        { backgroundColor: getStatusColor(itemStatus) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTextSmall,
                          { color: getStatusColor(itemStatus) },
                        ]}
                      >
                        {itemStatus}
                      </Text>
                    </View>
                    {item.manuallyCompleted && (
                      <View style={styles.manuallyCompletedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.manuallyCompletedText}>
                          Manually Completed
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Item Notes */}
                  {item.notes && (
                    <View style={styles.itemNotes}>
                      <Ionicons name="document-text" size={14} color="#92400E" />
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

        {/* Additional Information */}
        {challan.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dispatch Notes</Text>

            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{challan.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Challan</Text>
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
    backgroundColor: '#8B5CF6',
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
  challanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challanNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  challanDate: {
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
    flex: 1,
    textAlign: 'right',
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
    gap: 8,
    marginBottom: 12,
  },
  quantityBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
  itemStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  manuallyCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  manuallyCompletedText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  itemNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  itemNotesText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
  },
  noItemsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
