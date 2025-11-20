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
import { salesChallanAPI } from '../../services/salesChallanAPI';
import { salesOrderAPI } from '../../services/salesOrderAPI';

export default function SalesChallanFormScreen() {
  const router = useRouter();
  const { id, soId } = useLocalSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSO, setSelectedSO] = useState(null);
  const [loadingSOs, setLoadingSOs] = useState(true);
  const [dispatchedQuantities, setDispatchedQuantities] = useState<{[key: string]: number}>({});

  const [formData, setFormData] = useState({
    salesOrder: soId || '',
    challanDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    warehouseLocation: '',
    notes: '',
    items: [],
  });

  const [errors, setErrors] = useState({});

  // Load sales orders
  useEffect(() => {
    loadSalesOrders();
  }, []);

  // Load challan if editing
  useEffect(() => {
    if (isEditMode) {
      loadChallan();
    }
  }, [id]);

  // Handle pre-selected SO
  useEffect(() => {
    if (soId && !isEditMode) {
      handleSOSelection(soId);
    }
  }, [soId]);

  const loadSalesOrders = async () => {
    try {
      setLoadingSOs(true);
      console.log('🔗 Loading sales orders...');

      const response = await salesOrderAPI.getAll({ limit: 100 });
      console.log('📦 SOs response:', response);

      if (response?.success && response?.data) {
        // Filter out fully delivered/cancelled SOs
        const incompleteSOs = response.data.filter(
          so => so.status !== 'Delivered' && so.status !== 'Cancelled'
        );
        setSalesOrders(incompleteSOs);
        console.log(`✅ Loaded ${incompleteSOs.length} incomplete SOs`);
      } else {
        setSalesOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading SOs:', error);
      setSalesOrders([]);
    } finally {
      setLoadingSOs(false);
    }
  };

  const loadChallan = async () => {
    try {
      setLoading(true);
      const response = await salesChallanAPI.getById(id);

      if (response?.success && response?.data) {
        const challan = response.data;
        setFormData({
          salesOrder: challan.salesOrder?._id || '',
          challanDate: challan.challanDate
            ? new Date(challan.challanDate).toISOString().split('T')[0]
            : '',
          expectedDeliveryDate: challan.expectedDeliveryDate
            ? new Date(challan.expectedDeliveryDate).toISOString().split('T')[0]
            : '',
          warehouseLocation: challan.warehouseLocation || '',
          notes: challan.notes || '',
          items: challan.items?.map((item: any) => ({
            salesOrderItem: item.salesOrderItem || item._id,
            product: item.product?._id,
            productName: item.productName,
            productCode: item.productCode,
            orderedQuantity: item.orderedQuantity,
            dispatchQuantity: item.dispatchQuantity || 0,
            previouslyDispatched: 0,
            pendingQuantity: 0,
            unit: item.unit,
            weight: item.weight || 0,
            markAsComplete: item.markAsComplete || false,
            notes: item.notes || '',
          })) || [],
        });

        if (challan.salesOrder) {
          setSelectedSO(challan.salesOrder);
        }
      }
    } catch (error) {
      console.error('❌ Error loading challan:', error);
      Alert.alert('Error', 'Failed to load challan details');
    } finally {
      setLoading(false);
    }
  };

  const handleSOSelection = async (soId: string) => {
    if (!soId) {
      setSelectedSO(null);
      setFormData(prev => ({
        ...prev,
        salesOrder: '',
        items: [],
      }));
      return;
    }

    try {
      console.log('🔗 Loading SO details:', soId);
      
      // Load SO and dispatched quantities in parallel
      const [soResponse, dispatchedResponse] = await Promise.all([
        salesOrderAPI.getById(soId),
        salesChallanAPI.getAll({ salesOrder: soId }),
      ]);

      if (soResponse?.success && soResponse?.data) {
        const so = soResponse.data;
        setSelectedSO(so);
        console.log('📦 SO loaded:', so.soNumber);

        // Build dispatched map
        const dispatchedMap: {[key: string]: number} = {};
        if (dispatchedResponse?.success && dispatchedResponse?.data) {
          dispatchedResponse.data.forEach((challan: any) => {
            if (challan.items) {
              challan.items.forEach((item: any) => {
                const itemId = item.salesOrderItem?.toString() || item._id?.toString();
                if (itemId) {
                  dispatchedMap[itemId] = (dispatchedMap[itemId] || 0) + (item.dispatchQuantity || 0);
                }
              });
            }
          });
        }
        setDispatchedQuantities(dispatchedMap);

        // Populate items
        const items = so.items.map((item: any) => {
          const dispatched = dispatchedMap[item._id] || 0;
          const remaining = Math.max(0, item.quantity - dispatched);
          const weightPerUnit = item.weight / item.quantity;
          const remainingWeight = remaining * weightPerUnit;

          return {
            salesOrderItem: item._id,
            product: item.product?._id,
            productName: item.product?.productName || item.productName,
            productCode: item.product?.productCode || item.productCode,
            orderedQuantity: item.quantity,
            dispatchQuantity: remaining,
            previouslyDispatched: dispatched,
            pendingQuantity: 0,
            unit: item.unit,
            weight: remainingWeight,
            weightPerUnit: weightPerUnit,
            markAsComplete: false,
            notes: item.notes || '',
          };
        }).filter((item: any) => item.orderedQuantity - item.previouslyDispatched > 0);

        setFormData(prev => ({
          ...prev,
          salesOrder: soId,
          items,
        }));

        console.log(`✅ Loaded ${items.length} pending items`);
      }
    } catch (error) {
      console.error('❌ Error loading SO:', error);
      Alert.alert('Error', 'Failed to load SO details');
    }
  };

  const handleChange = (field: string, value: any) => {
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

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate weight and pending
    if (field === 'dispatchQuantity') {
      const item = updatedItems[index];
      const quantity = Number(value) || 0;
      updatedItems[index].weight = quantity * (item.weightPerUnit || 0);
      updatedItems[index].pendingQuantity = 
        item.orderedQuantity - item.previouslyDispatched - quantity;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.salesOrder) {
      newErrors.salesOrder = 'Sales Order is required';
    }

    if (!formData.challanDate) {
      newErrors.challanDate = 'Challan date is required';
    }

    if (!formData.warehouseLocation) {
      newErrors.warehouseLocation = 'Warehouse Location is required';
    }

    // Check if at least one item has dispatch quantity
    let hasAtLeastOneItem = false;
    formData.items.forEach((item: any, index: number) => {
      if (item.dispatchQuantity > 0) {
        hasAtLeastOneItem = true;

        // Check if dispatching more than pending
        const maxAllowed = item.orderedQuantity - item.previouslyDispatched;
        if (item.dispatchQuantity > maxAllowed) {
          newErrors[`items.${index}.dispatchQuantity`] =
            `Cannot dispatch more than pending (${maxAllowed} ${item.unit})`;
        }
      }
    });

    if (!hasAtLeastOneItem) {
      newErrors.items = 'Please enter dispatch quantity for at least one item';
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
      console.log('📦 Submitting challan:', formData);

      const submitData = {
        salesOrder: formData.salesOrder,
        challanDate: formData.challanDate,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        warehouseLocation: formData.warehouseLocation,
        notes: formData.notes,
        items: formData.items
          .filter((item: any) => item.dispatchQuantity > 0)
          .map((item: any) => ({
            salesOrderItem: item.salesOrderItem,
            product: item.product,
            productName: item.productName,
            productCode: item.productCode,
            orderedQuantity: item.orderedQuantity,
            dispatchQuantity: Number(item.dispatchQuantity),
            unit: item.unit,
            weight: Number(item.weight),
            markAsComplete: item.markAsComplete || false,
            notes: item.notes || '',
          })),
      };

      let response;
      if (isEditMode) {
        response = await salesChallanAPI.update(id, submitData);
      } else {
        response = await salesChallanAPI.create(submitData);
      }

      console.log('✅ Challan response:', response);

      if (response?.success) {
        Alert.alert(
          'Success',
          `Challan ${isEditMode ? 'updated' : 'created'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response?.message || 'Failed to save challan');
      }
    } catch (error) {
      console.error('❌ Error submitting challan:', error);
      Alert.alert('Error', error.message || 'Failed to save challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
          {isEditMode ? 'Edit Challan' : 'Create Sales Challan'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Sales Order */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sales Order *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.salesOrder}
                onValueChange={(value) => {
                  handleChange('salesOrder', value);
                  handleSOSelection(value);
                }}
                enabled={!isEditMode && !loadingSOs}
                style={styles.picker}
              >
                <Picker.Item
                  label={loadingSOs ? 'Loading...' : 'Select Sales Order'}
                  value=""
                />
                {salesOrders.map((so: any) => (
                  <Picker.Item
                    key={so._id}
                    label={`${so.soNumber} - ${so.customer?.companyName || 'Unknown'}`}
                    value={so._id}
                  />
                ))}
              </Picker>
            </View>
            {errors.salesOrder && (
              <Text style={styles.errorText}>{errors.salesOrder}</Text>
            )}
          </View>

          {/* Challan Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Challan Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.challanDate}
              onChangeText={(value) => handleChange('challanDate', value)}
              placeholder="YYYY-MM-DD (e.g., 2025-11-16)"
              placeholderTextColor="#9CA3AF"
            />
            {errors.challanDate && (
              <Text style={styles.errorText}>{errors.challanDate}</Text>
            )}
          </View>

          {/* Expected Delivery Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Expected Delivery Date</Text>
            <TextInput
              style={styles.input}
              value={formData.expectedDeliveryDate}
              onChangeText={(value) => handleChange('expectedDeliveryDate', value)}
              placeholder="YYYY-MM-DD (Optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Dispatch Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispatch Information</Text>

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
                {WAREHOUSE_LOCATIONS.map((warehouse) => (
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

          {/* Dispatch Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Dispatch Notes</Text>
            <TextInput
              style={styles.input}
              value={formData.notes}
              onChangeText={(value) => handleChange('notes', value)}
              placeholder="Special dispatch instructions (optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Items to Dispatch */}
        {selectedSO && formData.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items to Dispatch</Text>
            {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}

            {formData.items.map((item: any, index: number) => (
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
                    <Text style={styles.quantityLabel}>Prev. Dispatched</Text>
                    <Text style={[styles.quantityValue, { color: '#1E40AF' }]}>
                      {item.previouslyDispatched || 0} {item.unit}
                    </Text>
                  </View>

                  <View style={[styles.quantityBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.quantityLabel}>Pending</Text>
                    <Text style={[styles.quantityValue, { color: '#92400E' }]}>
                      {item.orderedQuantity - (item.previouslyDispatched || 0)} {item.unit}
                    </Text>
                  </View>
                </View>

                {/* Dispatching Now */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Dispatching Now *</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={String(item.dispatchQuantity)}
                      onChangeText={(value) =>
                        handleItemChange(index, 'dispatchQuantity', value)
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </View>
                  {errors[`items.${index}.dispatchQuantity`] && (
                    <Text style={styles.errorText}>
                      {errors[`items.${index}.dispatchQuantity`]}
                    </Text>
                  )}
                </View>

                {/* Weight */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(item.weight)}
                    onChangeText={(value) => handleItemChange(index, 'weight', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Mark as Complete */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() =>
                    handleItemChange(index, 'markAsComplete', !item.markAsComplete)
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      item.markAsComplete && styles.checkboxChecked,
                    ]}
                  >
                    {item.markAsComplete && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Mark as Complete</Text>
                </TouchableOpacity>

                {/* Item Notes */}
                {item.notes && (
                  <View style={styles.itemNotes}>
                    <Text style={styles.itemNotesLabel}>SO Notes:</Text>
                    <Text style={styles.itemNotesText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !selectedSO}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update Challan' : 'Create Challan'}
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  itemNotes: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
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
    backgroundColor: '#8B5CF6',
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
