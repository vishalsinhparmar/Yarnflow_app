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
import { salesOrderAPI, soFormatters } from '../../services/salesOrderAPI';


export default function SalesOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [salesOrder, setSalesOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSalesOrder();
    }
  }, [id]);

  const loadSalesOrder = async () => {
    try {
      setLoading(true);
      const response = await salesOrderAPI.getById(id);
      if (response?.success) {
        setSalesOrder(response.data);
      } else {
        Alert.alert('Error', 'Sales order not found');
        router.back();
      }
    } catch (err) {
      console.error('Error loading SO:', err);
      Alert.alert('Error', err.message || 'Failed to load sales order');
      router.back();
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!salesOrder) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Sales order not found</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = soFormatters.status(salesOrder.status);
  const customerName = salesOrder.customer?.companyName || salesOrder.customer || 'N/A';
  const categoryName = salesOrder.category?.categoryName || salesOrder.category || 'N/A';
  const totalWeight = salesOrder.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{salesOrder.soNumber}</Text>
          <Text style={styles.headerSubtitle}>Created on {soFormatters.date(salesOrder.createdAt)}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>SO Number</Text>
                <Text style={styles.infoValue}>{salesOrder.soNumber}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>{soFormatters.date(salesOrder.orderDate)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Expected Delivery</Text>
                <Text style={styles.infoValue}>
                  {salesOrder.expectedDeliveryDate ? soFormatters.date(salesOrder.expectedDeliveryDate) : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{customerName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{categoryName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Weight</Text>
                <Text style={styles.infoValue}>{totalWeight.toFixed(2)} Kg</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created By</Text>
                <Text style={styles.infoValue}>{salesOrder.createdBy || 'Admin'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({salesOrder.items?.length || 0})</Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>PRODUCT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>QUANTITY</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>WEIGHT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>COMPLETION</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
            </View>
            
            {salesOrder.items?.map((item, index) => {
              const productName = item.product?.productName || item.product || 'Unknown';
              const productCode = item.product?.productCode || 'PROD0003';
              const dispatchedQty = item.dispatchedQuantity || 0;
              const dispatchedWeight = item.dispatchedWeight || 0;
              const completion = item.quantity > 0 ? Math.round((dispatchedQty / item.quantity) * 100) : 0;
              const itemStatus = completion === 100 ? 'Complete' : 'Pending';
              
              return (
                <View key={item._id || index} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.productName}>{productName}</Text>
                    <Text style={styles.productCode}>{productCode}</Text>
                    {item.itemNotes && (
                      <Text style={styles.itemNotes}>📝 {item.itemNotes}</Text>
                    )}
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tableText}>{item.quantity} {item.unit}</Text>
                    {dispatchedQty > 0 && (
                      <Text style={styles.dispatchedText}>Dispatched: {dispatchedQty} {item.unit}</Text>
                    )}
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tableText}>{item.weight.toFixed(2)} Kg</Text>
                    {dispatchedWeight > 0 && (
                      <Text style={styles.dispatchedText}>Dispatched: {dispatchedWeight.toFixed(2)} Kg</Text>
                    )}
                  </View>
                  
                  <View style={{ flex: 1.5 }}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${completion}%` }]} />
                    </View>
                    <Text style={styles.completionText}>{completion}%</Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <View style={[styles.itemStatusBadge, { backgroundColor: completion === 100 ? '#10B98120' : '#F59E0B20' }]}>
                      <Text style={[styles.itemStatusText, { color: completion === 100 ? '#10B981' : '#F59E0B' }]}>
                        {itemStatus}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.closeButtonBottom} onPress={() => router.back()}>
            <Text style={styles.closeButtonBottomText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  scrollView: { flex: 1 },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  infoGrid: { gap: 16 },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  productCode: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  itemNotes: { fontSize: 11, color: '#3B82F6', marginTop: 4, fontStyle: 'italic' },
  tableText: { fontSize: 13, color: '#111827' },
  dispatchedText: { fontSize: 11, color: '#10B981', marginTop: 2 },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  completionText: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  itemStatusText: { fontSize: 11, fontWeight: '600' },
  actions: { padding: 16, paddingBottom: 32 },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  closeButtonBottom: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonBottomText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
