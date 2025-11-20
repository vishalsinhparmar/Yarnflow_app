import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productAPI, categoryAPI } from '../../../services/index.js';

interface ProductFormData {
  productName: string;
  category: string;
  description: string;
}

interface Category {
  _id: string;
  categoryName: string;
}

export default function ProductFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit';
  const productId = params.productId as string;

  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    category: '',
    description: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
    
    if (isEditMode && params.productData) {
      try {
        const productData = JSON.parse(params.productData as string);
        setFormData({
          productName: productData.productName || '',
          category: productData.category?._id || '',
          description: productData.description || '',
        });
      } catch (error) {
        console.error('Error parsing product data:', error);
        Alert.alert('Error', 'Failed to load product data');
        router.back();
      }
    }
  }, [isEditMode, params.productData]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryAPI.getAll();
      if (response && response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Ensure we only send the fields we want (exclude any legacy fields)
      const cleanFormData = {
        productName: formData.productName.trim(),
        category: formData.category,
        description: formData.description.trim()
      };
      
      if (isEditMode) {
        await productAPI.update(productId, cleanFormData);
        Alert.alert('Success', 'Product updated successfully', [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
              setTimeout(() => {
                router.replace('/master-data/products/');
              }, 100);
            }
          }
        ]);
      } else {
        await productAPI.create(cleanFormData);
        Alert.alert('Success', 'Product created successfully', [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
              setTimeout(() => {
                router.replace('/master-data/products/');
              }, 100);
            }
          }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[styles.input, errors.productName && styles.inputError]}
              value={formData.productName}
              onChangeText={(value) => handleChange('productName', value)}
              placeholder="Enter product name"
              placeholderTextColor="#9CA3AF"
            />
            {errors.productName && (
              <Text style={styles.errorText}>{errors.productName}</Text>
            )}
          </View>


          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    !formData.category && styles.categoryOptionSelected,
                  ]}
                  onPress={() => handleChange('category', '')}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      !formData.category && styles.categoryOptionTextSelected,
                    ]}
                  >
                    No Category
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryOption,
                      formData.category === category._id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => handleChange('category', category._id)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.category === category._id && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {category.categoryName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Description about the product..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update Product' : 'Create Product'}
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryOptionTextSelected: {
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
