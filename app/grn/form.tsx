import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { WAREHOUSE_LOCATIONS } from '../../constants/warehouseLocations';
import { grnAPI } from '../../services/grnAPI';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';

export default function GRNFormScreen() {
  const router = useRouter();
  const { id, poId } = useLocalSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loadingPOs, setLoadingPOs] = useState(true);

  const [formData, setFormData] = useState({
    purchaseOrder: poId || '',
    receiptDate: new Date().toISOString().split('T')[0],
    warehouseLocation: '',
    generalNotes: '',
    items: [],
  });

  const [errors, setErrors] = useState({});

  // Load purchase orders
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Load GRN if editing
  useEffect(() => {
    if (isEditMode) {
      loadGRN();
    }
  }, [id]);

  // Handle pre-selected PO
  useEffect(() => {
    if (poId && !isEditMode) {
      handlePOSelection(poId);
    }
  }, [poId]);

  const loadPurchaseOrders = async () => {
    try {
      setLoadingPOs(true);
      console.log('🔗 Loading purchase orders...');
      
      const response = await purchaseOrderAPI.getAll({ limit: 100 });
      console.log('📦 POs response:', response);

      if (response?.success && response?.data) {
        // Filter out fully received POs
        const incompletePOs = response.data.filter(
          po => po.status !== 'Fully_Received' && po.status !== 'Complete'
        );
        setPurchaseOrders(incompletePOs);
        console.log(`✅ Loaded ${incompletePOs.length} incomplete POs`);
      } else {
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading POs:', error);
      setPurchaseOrders([]);
    } finally {
      setLoadingPOs(false);
    }
  };

  const loadGRN = async () => {
    try {
      setLoading(true);
      const response = await grnAPI.getById(id);
      
      if (response?.success && response?.data) {
        const grn = response.data;
        setFormData({
          purchaseOrder: grn.purchaseOrder?._id || '',
          receiptDate: grn.receiptDate ? new Date(grn.receiptDate).toISOString().split('T')[0] : '',
          warehouseLocation: grn.warehouseLocation || '',
          generalNotes: grn.generalNotes || '',
          items: grn.items?.map(item => ({
            purchaseOrderItem: item.purchaseOrderItem || item._id,
            productName: item.productName,
            productCode: item.productCode,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity || 0,
            unit: item.unit,
            warehouseLocation: item.warehouseLocation || '',
            notes: item.notes || '',
          })) || [],
        });

        if (grn.purchaseOrder) {
          setSelectedPO(grn.purchaseOrder);
        }
      }
    } catch (error) {
      console.error('❌ Error loading GRN:', error);
      Alert.alert('Error', 'Failed to load GRN details');
    } finally {
      setLoading(false);
    }
  };

  const handlePOSelection = async (poId) => {
    if (!poId) {
      setSelectedPO(null);
      setFormData(prev => ({
        ...prev,
        purchaseOrder: '',
        items: [],
      }));
      return;
    }

    try {
      console.log('🔗 Loading PO details:', poId);
      const response = await purchaseOrderAPI.getById(poId);
      
      if (response?.success && response?.data) {
        const po = response.data;
        setSelectedPO(po);
        console.log('📦 PO loaded:', po.poNumber);

        // Populate items from PO
        const items = po.items.map(item => {
          const orderedQty = item.quantity || 0;
          const receivedQty = item.receivedQuantity || 0;
          const pendingQty = orderedQty - receivedQty;

          return {
            purchaseOrderItem: item._id,
            productName: item.productName,
            productCode: item.productCode,
            orderedQuantity: orderedQty,
            previouslyReceived: receivedQty,
            receivedQuantity: pendingQty > 0 ? pendingQty : 0,
            pendingQuantity: pendingQty,
            unit: item.unit,
            warehouseLocation: formData.warehouseLocation,
            notes: '',
            isCompleted: pendingQty <= 0,
          };
        }).filter(item => !item.isCompleted);

        setFormData(prev => ({
          ...prev,
          purchaseOrder: poId,
          items,
        }));

        console.log(`✅ Loaded ${items.length} pending items`);
      }
    } catch (error) {
      console.error('❌ Error loading PO:', error);
      Alert.alert('Error', 'Failed to load PO details');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate pending quantity
    if (field === 'receivedQuantity') {
      const item = updatedItems[index];
      const maxAllowed = item.orderedQuantity - (item.previouslyReceived || 0);
      updatedItems[index].pendingQuantity = maxAllowed - Number(value);
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.purchaseOrder) {
      newErrors.purchaseOrder = 'Purchase Order is required';
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = 'Receipt date is required';
    }

    if (!formData.warehouseLocation) {
      newErrors.warehouseLocation = 'Warehouse Location is required';
    }

    // Check if at least one item has received quantity
    let hasAtLeastOneItem = false;
    formData.items.forEach((item, index) => {
      if (item.receivedQuantity > 0) {
        hasAtLeastOneItem = true;

        // Check if receiving more than pending
        const maxAllowed = item.orderedQuantity - (item.previouslyReceived || 0);
        if (item.receivedQuantity > maxAllowed) {
          newErrors[`items.${index}.receivedQuantity`] = 
            `Cannot receive more than pending (${maxAllowed} ${item.unit})`;
        }
      }
    });

    if (!hasAtLeastOneItem) {
      newErrors.items = 'Please enter received quantity for at least one item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📦 Submitting GRN:', formData);

      const submitData = {
        ...formData,
        items: formData.items
          .filter(item => item.receivedQuantity > 0)
          .map(item => ({
            purchaseOrderItem: item.purchaseOrderItem,
            receivedQuantity: Number(item.receivedQuantity),
            warehouseLocation: item.warehouseLocation || formData.warehouseLocation,
            notes: item.notes || '',
          })),
      };

      let response;
      if (isEditMode) {
        response = await grnAPI.update(id, submitData);
      } else {
        response = await grnAPI.create(submitData);
      }

      console.log('✅ GRN response:', response);

      if (response?.success) {
        Alert.alert(
          'Success',
          `GRN ${isEditMode ? 'updated' : 'created'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response?.message || 'Failed to save GRN');
      }
    } catch (error) {
      console.error('❌ Error submitting GRN:', error);
      Alert.alert('Error', error.message || 'Failed to save GRN');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit GRN' : 'Create New GRN'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Purchase Order */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Purchase Order *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.purchaseOrder}
                onValueChange={(value) => {
                  handleChange('purchaseOrder', value);
                  handlePOSelection(value);
                }}
                enabled={!isEditMode && !loadingPOs}
                style={styles.picker}
              >
                <Picker.Item 
                  label={loadingPOs ? 'Loading...' : 'Select Purchase Order'} 
                  value="" 
                />
                {purchaseOrders.map(po => (
                  <Picker.Item
                    key={po._id}
                    label={`${po.poNumber} - ${po.supplierDetails?.companyName || 'Unknown'}`}
                    value={po._id}
                  />
                ))}
              </Picker>
            </View>
            {errors.purchaseOrder && (
              <Text style={styles.errorText}>{errors.purchaseOrder}</Text>
            )}
          </View>

          {/* Receipt Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Receipt Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.receiptDate}
              onChangeText={(value) => handleChange('receiptDate', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            {errors.receiptDate && (
              <Text style={styles.errorText}>{errors.receiptDate}</Text>
            )}
          </View>
        </View>

        {/* Warehouse Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse Information</Text>

          {/* Warehouse Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Warehouse Location *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.warehouseLocation}
                onValueChange={(value) => handleChange('warehouseLocation', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Warehouse Location" value="" />
                {WAREHOUSE_LOCATIONS.map(warehouse => (
                  <Picker.Item
                    key={warehouse.id}
                    label={warehouse.name}
                    value={warehouse.id}
                  />
                ))}
              </Picker>
            </View>
            {errors.warehouseLocation && (
              <Text style={styles.errorText}>{errors.warehouseLocation}</Text>
            )}
          </View>

          {/* Storage Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Storage Notes</Text>
            <TextInput
              style={styles.input}
              value={formData.generalNotes}
              onChangeText={(value) => handleChange('generalNotes', value)}
              placeholder="Additional storage instructions (optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Items */}
        {selectedPO && formData.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items Received</Text>
            {errors.items && (
              <Text style={styles.errorText}>{errors.items}</Text>
            )}

            {formData.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                {/* Product Info */}
                <View style={styles.itemHeader}>
                  <Text style={styles.itemProductName}>{item.productName}</Text>
                  <Text style={styles.itemProductCode}>{item.productCode}</Text>
                </View>

                {/* Quantities */}
                <View style={styles.itemQuantities}>
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>Ordered</Text>
                    <Text style={styles.quantityValue}>
                      {item.orderedQuantity} {item.unit}
                    </Text>
                  </View>

                  <View style={[styles.quantityBox, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.quantityLabel}>Prev. Received</Text>
                    <Text style={[styles.quantityValue, { color: '#1E40AF' }]}>
                      {item.previouslyReceived || 0} {item.unit}
                    </Text>
                  </View>

                  <View style={[styles.quantityBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.quantityLabel}>Pending</Text>
                    <Text style={[styles.quantityValue, { color: '#92400E' }]}>
                      {item.pendingQuantity || 0} {item.unit}
                    </Text>
                  </View>
                </View>

                {/* Receiving Now */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Receiving Now *</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={String(item.receivedQuantity)}
                      onChangeText={(value) => handleItemChange(index, 'receivedQuantity', value)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </View>
                  {errors[`items.${index}.receivedQuantity`] && (
                    <Text style={styles.errorText}>
                      {errors[`items.${index}.receivedQuantity`]}
                    </Text>
                  )}
                </View>

                {/* Item Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={styles.input}
                    value={item.notes}
                    onChangeText={(value) => handleItemChange(index, 'notes', value)}
                    placeholder="Any notes for this item..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>General Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.generalNotes}
              onChangeText={(value) => handleChange('generalNotes', value)}
              placeholder="Any additional notes about this goods receipt..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !selectedPO}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update GRN' : 'Create GRN'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
  backButton: {
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
  formContainer: {
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  unitText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
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
  itemQuantities: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
