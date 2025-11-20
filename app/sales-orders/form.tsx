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
import { apiRequest } from '../../services/common';
import { salesOrderAPI } from '../../services/salesOrderAPI';

export default function SalesOrderForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    customer: '',
    expectedDeliveryDate: '',
    category: '',
    items: [{ 
      product: '', 
      quantity: '', 
      unit: '', 
      weight: '', 
      itemNotes: '',
      availableStock: 0,
      totalProductWeight: 0,
      productStock: 0
    }],
  });

  useEffect(() => {
    loadCustomers();
    loadCategories();
    if (isEditMode) loadSalesOrder();
  }, []);

  useEffect(() => {
    if (formData.category) {
      loadProducts(formData.category);
    } else {
      setProducts([]);
    }
  }, [formData.category]);

  const loadCustomers = async () => {
    try {
      const response = await apiRequest('/master-data/customers');
      if (response?.success) setCustomers(response.data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/master-data/categories');
      if (response?.success) setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProducts = async (categoryId) => {
    try {
      const response = await apiRequest(`/inventory?category=${categoryId}&populate=product&limit=200`);
      console.log('Inventory API response:', response);
      
      if (response?.success) {
        let inventoryData = response.data || [];
        
        // Check if data is nested in a category structure
        if (inventoryData.length > 0 && inventoryData[0].products) {
          // Flatten products from category structure
          const allProducts = [];
          inventoryData.forEach(cat => {
            if (cat.products && Array.isArray(cat.products)) {
              cat.products.forEach(prod => {
                allProducts.push({
                  _id: prod.productId || prod._id,
                  productName: prod.productName || 'Unknown Product',
                  productCode: prod.productCode || '',
                  unit: prod.unit || 'Bags',
                  totalStock: prod.totalStock || 0,
                  totalWeight: prod.totalWeight || 0,
                });
              });
            }
          });
          console.log('Loaded products (nested):', allProducts);
          setProducts(allProducts.filter(p => p._id && p.totalStock > 0));
        } else {
          // Direct product list
          const allProducts = inventoryData.map(inv => {
            const product = inv.product;
            return {
              _id: product?._id || inv.product,
              productName: product?.productName || product?.name || 'Unknown Product',
              productCode: product?.productCode || product?.code || '',
              unit: product?.unit || 'Bags',
              totalStock: inv.totalStock || 0,
              totalWeight: inv.totalWeight || 0,
            };
          }).filter(p => p._id && p.totalStock > 0);
          
          console.log('Loaded products (direct):', allProducts);
          setProducts(allProducts);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadSalesOrder = async () => {
    try {
      setLoading(true);
      const response = await salesOrderAPI.getById(id);
      if (response?.success) {
        const so = response.data;
        setFormData({
          customer: so.customer?._id || so.customer || '',
          category: so.category?._id || so.category || '',
          expectedDeliveryDate: so.expectedDeliveryDate 
            ? new Date(so.expectedDeliveryDate).toISOString().split('T')[0] 
            : '',
          items: so.items.map(item => ({
            product: item.product?._id || item.product || '',
            quantity: String(item.quantity || ''),
            unit: item.unit || '',
            weight: String(item.weight || ''),
            itemNotes: item.itemNotes || '',
          })),
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load sales order');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { 
        product: '', 
        quantity: '', 
        unit: '', 
        weight: '', 
        itemNotes: '',
        availableStock: 0,
        totalProductWeight: 0,
        productStock: 0
      }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      Alert.alert('Error', 'At least one item is required');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-populate unit and stock info when product is selected
    if (field === 'product') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index].unit = selectedProduct.unit;
        newItems[index].availableStock = selectedProduct.totalStock;
        newItems[index].totalProductWeight = selectedProduct.totalWeight;
        newItems[index].productStock = selectedProduct.totalStock;
        
        // Auto-calculate weight if quantity already exists
        const qty = Number(newItems[index].quantity) || 0;
        if (qty > 0 && selectedProduct.totalStock > 0) {
          const weightPerUnit = selectedProduct.totalWeight / selectedProduct.totalStock;
          newItems[index].weight = String((qty * weightPerUnit).toFixed(2));
        }
      }
    }

    // Auto-calculate weight when quantity changes
    if (field === 'quantity') {
      const product = products.find(p => p._id === newItems[index].product);
      if (product && product.totalStock > 0) {
        const weightPerUnit = product.totalWeight / product.totalStock;
        const qty = Number(value) || 0;
        if (qty > 0) {
          newItems[index].weight = String((qty * weightPerUnit).toFixed(2));
        }
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const validateForm = () => {
    if (!formData.customer) {
      Alert.alert('Validation Error', 'Please select a customer');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product) {
        Alert.alert('Validation Error', `Please select a product for item ${i + 1}`);
        return false;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        Alert.alert('Validation Error', `Please enter a valid quantity for item ${i + 1}`);
        return false;
      }
      const product = products.find(p => p._id === item.product);
      if (product && Number(item.quantity) > product.totalStock) {
        Alert.alert('Stock Error', `Item ${i + 1}: Requested quantity (${item.quantity}) exceeds available stock (${product.totalStock})`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        customer: formData.customer,
        category: formData.category,
        items: formData.items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          unit: item.unit || 'Bags',
          weight: Number(item.weight) || 0,
          notes: item.itemNotes || '', // Changed from itemNotes to notes to match backend
        })),
      };

      if (formData.expectedDeliveryDate) {
        payload.expectedDeliveryDate = formData.expectedDeliveryDate;
      }

      console.log('📦 Submitting payload:', JSON.stringify(payload, null, 2));

      if (isEditMode) {
        const response = await salesOrderAPI.update(id, payload);
        console.log('✅ Update response:', response);
        Alert.alert('Success', 'Sales order updated successfully', [
          { text: 'OK', onPress: () => router.push('/sales-orders') }
        ]);
      } else {
        const response = await salesOrderAPI.create(payload);
        console.log('✅ Create response:', response);
        Alert.alert('Success', 'Sales order created successfully', [
          { text: 'OK', onPress: () => router.push('/sales-orders') }
        ]);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      Alert.alert('Error', err.message || 'Failed to save sales order');
    } finally {
      setSubmitting(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Sales Order' : 'New Sales Order'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.fieldContainer, { flex: 1 }]}>
              <Text style={styles.label}>Customer <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.customer}
                  onValueChange={(value) => setFormData({ ...formData, customer: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Customer" value="" />
                  {customers.map((c) => (
                    <Picker.Item key={c._id} label={c.companyName} value={c._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.fieldContainer, { flex: 1 }]}>
              <Text style={styles.label}>Expected Delivery Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.expectedDeliveryDate}
                onChangeText={(value) => setFormData({ ...formData, expectedDeliveryDate: value })}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select Category" value="" />
                {categories.map((c) => (
                  <Picker.Item key={c._id} label={c.categoryName} value={c._id} />
                ))}
              </Picker>
            </View>
            {!formData.category && (
              <Text style={styles.helperText}>ℹ️ Select a category first to see available products from inventory</Text>
            )}
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddItem}
              disabled={!formData.category}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => {
            const selectedProduct = products.find(p => p._id === item.product);
            const weightPerUnit = selectedProduct && selectedProduct.totalStock > 0
              ? selectedProduct.totalWeight / selectedProduct.totalStock
              : 0;

            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  {formData.items.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Product <Text style={styles.required}>*</Text></Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={item.product}
                      onValueChange={(value) => handleItemChange(index, 'product', value)}
                      style={styles.picker}
                      enabled={!!formData.category}
                    >
                      <Picker.Item 
                        label={formData.category ? "Select Product" : "Select Category First"} 
                        value="" 
                      />
                      {products.map((p) => (
                        <Picker.Item
                          key={p._id}
                          label={`${p.productName} (Stock: ${p.totalStock} ${p.unit})`}
                          value={p._id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {selectedProduct && (
                    <Text style={styles.stockText}>Available: {selectedProduct.totalStock} {selectedProduct.unit}</Text>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Quantity <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(value) => handleItemChange(index, 'quantity', value)}
                      placeholder="0"
                    />
                  </View>

                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Unit</Text>
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value={item.unit}
                      editable={false}
                      placeholder="Auto"
                    />
                  </View>

                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Weight (Kg) <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.weight}
                      onChangeText={(value) => handleItemChange(index, 'weight', value)}
                      placeholder="0"
                    />
                  </View>
                </View>

                {selectedProduct && weightPerUnit > 0 && (
                  <Text style={styles.suggestedText}>
                    Suggested: {((Number(item.quantity) || 0) * weightPerUnit).toFixed(2)} Kg ({weightPerUnit.toFixed(2)} Kg per {selectedProduct.unit})
                  </Text>
                )}

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Item Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    value={item.itemNotes}
                    onChangeText={(value) => handleItemChange(index, 'itemNotes', value)}
                    placeholder="Special instructions for this item (optional)"
                  />
                  <Text style={styles.noteInfo}>📄 These notes will appear on the challan and PDF</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Update Order' : 'Create Order'}
              </Text>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  scrollView: { flex: 1 },
  formSection: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  required: { color: '#EF4444' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  picker: { height: 50 },
  helperText: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  stockText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  suggestedText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  noteInfo: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  itemCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
