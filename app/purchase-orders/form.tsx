import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// Using TouchableOpacity with Modal for better production compatibility
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '@/constants/colors';
import { categoryAPI, productAPI, supplierAPI } from '../../services/masterDataAPI.js';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI.js';

interface FormData {
  supplier: string;
  category: string;
  expectedDeliveryDate: string;
  items: POItem[];
  notes: string;
}

interface POItem {
  product: string;
  productName: string;
  quantity: number;
  unit: string;
  weight: number;
  itemNotes: string;
}

interface Supplier {
  _id: string;
  companyName: string;
}

interface Category {
  _id: string;
  categoryName: string;
}

interface Product {
  _id: string;
  productName: string;
  category: string;
}

export default function PurchaseOrderForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    supplier: '',
    category: '',
    expectedDeliveryDate: '',
    items: [{
      product: '',
      productName: '',
      quantity: 1,
      unit: 'Bags',
      weight: 0,
      itemNotes: ''
    }],
    notes: ''
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  // Modal states for custom pickers
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  // Unit options
  const unitOptions = [
    { label: 'Bags', value: 'Bags' },
    { label: 'Kg', value: 'Kg' },
    { label: 'Tons', value: 'Tons' },
    { label: 'Pieces', value: 'Pieces' },
  ];

  // Custom Picker Component
  const renderCustomPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: Array<{label: string, value: string}>,
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedValue === item.value && styles.selectedOption
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.optionText,
                  selectedValue === item.value && styles.selectedOptionText
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  useEffect(() => {
    loadDropdownData();
    if (isEditMode) {
      loadPurchaseOrder();
    }
  }, []);

  useEffect(() => {
    if (formData.category && products.length > 0) {
      // Filter products by selected category
      const categoryProducts = products.filter(p => 
        p.category === formData.category || 
        (typeof p.category === 'object' && p.category._id === formData.category)
      );
      
      console.log('Category selected:', formData.category);
      console.log('Total products:', products.length);
      console.log('Filtered products:', categoryProducts.length);
      
      setFilteredProducts(categoryProducts);
      
      // Clear product selections in items when category changes
      const updatedItems = formData.items.map(item => ({
        ...item,
        product: '',
        productName: ''
      }));
      
      if (JSON.stringify(updatedItems) !== JSON.stringify(formData.items)) {
        setFormData(prev => ({
          ...prev,
          items: updatedItems
        }));
      }
    } else {
      setFilteredProducts([]);
    }
  }, [formData.category, products]);

  const loadDropdownData = async () => {
    try {
      const [suppliersRes, categoriesRes, productsRes] = await Promise.all([
        supplierAPI.getAll({ limit: 100 }),
        categoryAPI.getAll(),
        productAPI.getAll({ limit: 200 })
      ]);

      if (suppliersRes?.success) setSuppliers(suppliersRes.data || []);
      if (categoriesRes?.success) setCategories(categoriesRes.data || []);
      if (productsRes?.success) setProducts(productsRes.data || []);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      Alert.alert('Error', 'Failed to load form data');
    }
  };

  const loadPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderAPI.getById(id as string);
      if (response?.success) {
        const po = response.data;
        setFormData({
          supplier: po.supplier?._id || po.supplier || '',
          category: po.category?._id || po.category || '',
          expectedDeliveryDate: po.expectedDeliveryDate ? 
            new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '',
          items: po.items?.map((item: any) => ({
            product: item.product?._id || item.product || '',
            productName: item.productName || item.product?.productName || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'Bags',
            weight: item.weight || 0,
            itemNotes: item.itemNotes || item.notes || ''
          })) || [{
            product: '',
            productName: '',
            quantity: 1,
            unit: 'Bags',
            weight: 0,
            itemNotes: ''
          }],
          notes: po.notes || ''
        });
      }
    } catch (err) {
      console.error('Error loading PO:', err);
      Alert.alert('Error', 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.supplier) {
      newErrors.supplier = 'Supplier is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`item_${index}_product`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      }
      if (!item.weight || item.weight <= 0) {
        newErrors[`item_${index}_weight`] = 'Valid weight is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        supplier: formData.supplier,
        category: formData.category,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        items: formData.items.map(item => ({
          product: item.product,
          productName: item.productName || undefined,
          quantity: Number(item.quantity),
          unit: item.unit,
          weight: Number(item.weight),
          itemNotes: item.itemNotes || undefined
        })),
        notes: formData.notes || undefined
      };

      if (isEditMode) {
        await purchaseOrderAPI.update(id as string, submitData);
        Alert.alert('Success', 'Purchase order updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await purchaseOrderAPI.create(submitData);
        Alert.alert('Success', 'Purchase order created successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (err: any) {
      console.error('Error saving PO:', err);
      Alert.alert('Error', err.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        productName: '',
        quantity: 1,
        unit: 'Bags',
        weight: 0,
        itemNotes: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));

    // Clear error when user starts typing
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const renderItem = (item: POItem, index: number) => (
    <View key={index} style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Item {index + 1}</Text>
        {formData.items.length > 1 && (
          <TouchableOpacity 
            onPress={() => removeItem(index)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Product Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Product *</Text>
        <TouchableOpacity 
          style={[
            styles.pickerButton, 
            errors[`item_${index}_product`] && styles.inputError,
            !formData.category && styles.disabledPicker
          ]}
          onPress={() => {
            if (!formData.category) {
              Alert.alert('Category Required', 'Please select a category first to see available products.');
              return;
            }
            if (filteredProducts.length === 0) {
              Alert.alert('No Products', 'No products available for the selected category.');
              return;
            }
            setSelectedItemIndex(index);
            setShowProductModal(true);
          }}
          disabled={!formData.category}
        >
          <Text style={[
            styles.pickerButtonText, 
            !item.product && styles.placeholderText,
            !formData.category && styles.disabledText
          ]}>
            {!formData.category ? 
              'Select category first' :
              filteredProducts.length === 0 ?
                'No products available' :
                item.product ? 
                  filteredProducts.find(p => p._id === item.product)?.productName || 'Select Product' : 
                  'Select Product'
            }
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={!formData.category ? COLORS.gray400 : COLORS.gray500} 
          />
        </TouchableOpacity>
        {errors[`item_${index}_product`] && (
          <Text style={styles.errorText}>{errors[`item_${index}_product`]}</Text>
        )}
        {formData.category && filteredProducts.length === 0 && (
          <Text style={styles.infoText}>
            No products found for selected category. Please add products to this category first.
          </Text>
        )}
      </View>

      {/* Quantity and Unit */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={[styles.input, errors[`item_${index}_quantity`] && styles.inputError]}
            value={item.quantity.toString()}
            onChangeText={(text) => updateItem(index, 'quantity', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="1"
          />
          {errors[`item_${index}_quantity`] && (
            <Text style={styles.errorText}>{errors[`item_${index}_quantity`]}</Text>
          )}
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Unit</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => {
              setSelectedItemIndex(index);
              setShowUnitModal(true);
            }}
          >
            <Text style={styles.pickerButtonText}>{item.unit}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight (Kg) *</Text>
        <TextInput
          style={[styles.input, errors[`item_${index}_weight`] && styles.inputError]}
          value={item.weight.toString()}
          onChangeText={(text) => updateItem(index, 'weight', parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="0"
        />
        {errors[`item_${index}_weight`] && (
          <Text style={styles.errorText}>{errors[`item_${index}_weight`]}</Text>
        )}
      </View>

      {/* Item Notes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Item Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={item.itemNotes}
          onChangeText={(text) => updateItem(index, 'itemNotes', text)}
          placeholder="Special instructions for this item..."
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  if (loading && isEditMode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading purchase order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Supplier */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier *</Text>
            <TouchableOpacity 
              style={[styles.pickerButton, errors.supplier && styles.inputError]}
              onPress={() => setShowSupplierModal(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.supplier && styles.placeholderText]}>
                {formData.supplier ? 
                  suppliers.find(s => s._id === formData.supplier)?.companyName || 'Select Supplier' : 
                  'Select Supplier'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {errors.supplier && <Text style={styles.errorText}>{errors.supplier}</Text>}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity 
              style={[styles.pickerButton, errors.category && styles.inputError]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.category && styles.placeholderText]}>
                {formData.category ? 
                  categories.find(c => c._id === formData.category)?.categoryName || 'Select Category' : 
                  'Select Category'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            {formData.category && (
              <Text style={styles.infoText}>
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available in this category
              </Text>
            )}
          </View>

          {/* Expected Delivery Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expected Delivery Date</Text>
            <TextInput
              style={styles.input}
              value={formData.expectedDeliveryDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, expectedDeliveryDate: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => renderItem(item, index))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Additional notes or instructions..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Update Purchase Order' : 'Create Purchase Order'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Picker Modals */}
      {renderCustomPicker(
        showSupplierModal,
        () => setShowSupplierModal(false),
        'Select Supplier',
        suppliers.map(s => ({ label: s.companyName, value: s._id })),
        formData.supplier,
        (value) => {
          setFormData(prev => ({ ...prev, supplier: value }));
          if (errors.supplier) setErrors(prev => ({ ...prev, supplier: '' }));
        }
      )}

      {renderCustomPicker(
        showCategoryModal,
        () => setShowCategoryModal(false),
        'Select Category',
        categories.map(c => ({ label: c.categoryName, value: c._id })),
        formData.category,
        (value) => {
          setFormData(prev => ({ ...prev, category: value }));
          if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
        }
      )}

      {renderCustomPicker(
        showProductModal,
        () => setShowProductModal(false),
        'Select Product',
        filteredProducts.length > 0 ? 
          filteredProducts.map(p => ({ label: p.productName, value: p._id })) :
          [{ label: 'No products available for this category', value: '' }],
        formData.items[selectedItemIndex]?.product || '',
        (value) => {
          if (value && filteredProducts.length > 0) {
            updateItem(selectedItemIndex, 'product', value);
            const selectedProduct = filteredProducts.find(p => p._id === value);
            if (selectedProduct) {
              updateItem(selectedItemIndex, 'productName', selectedProduct.productName);
            }
          }
        }
      )}

      {renderCustomPicker(
        showUnitModal,
        () => setShowUnitModal(false),
        'Select Unit',
        unitOptions,
        formData.items[selectedItemIndex]?.unit || 'Bags',
        (value) => updateItem(selectedItemIndex, 'unit', value)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemContainer: {
    backgroundColor: COLORS.gray50,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addItemText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitContainer: {
    padding: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.gray600,
  },
  // Custom Picker Styles
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.gray900,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.gray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.gray900,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  disabledPicker: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  disabledText: {
    color: COLORS.gray400,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.info,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
});
