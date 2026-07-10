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
import { useToast } from '@/components/ui/Toast';
import { customerAPI } from '../../../services/index.js';

interface CustomerFormData {
  companyName: string;
  gstNumber: string;
  panNumber: string;
  address: {
    city: string;
  };
  notes: string;
}

export default function CustomerFormScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit';
  const customerId = params.customerId as string;

  const [formData, setFormData] = useState<CustomerFormData>({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    address: {
      city: '',
    },
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && params.customerData) {
      try {
        const customerData = JSON.parse(params.customerData as string);
        setFormData({
          companyName: customerData.companyName || '',
          gstNumber: customerData.gstNumber || '',
          panNumber: customerData.panNumber || '',
          address: {
            city: customerData.address?.city || '',
          },
          notes: customerData.notes || '',
        });
      } catch (error) {
        console.error('Error parsing customer data:', error);
        toast.showToast('error', 'Load Failed', 'Failed to load customer data');
        router.back();
      }
    }
  }, [isEditMode, params.customerData]);

  const extractPANFromGST = (gstNumber: string) => {
    if (gstNumber && gstNumber.length >= 10) {
      return gstNumber.substring(2, 12).toUpperCase();
    }
    return '';
  };

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CustomerFormData] as object),
          [child]: value,
        },
      }));
    } else if (field === 'gstNumber') {
      const upperGST = value.toUpperCase();
      setFormData(prev => ({
        ...prev,
        gstNumber: upperGST,
        panNumber: extractPANFromGST(upperGST),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

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

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      newErrors.gstNumber = 'GST number must be 15 characters';
    }

    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN number format';
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
      
      if (isEditMode) {
        await customerAPI.update(customerId, formData);
        toast.showToast('success', 'Customer Updated', 'Customer updated successfully');
        setTimeout(() => router.back(), 800);
      } else {
        await customerAPI.create(formData);
        toast.showToast('success', 'Customer Created', 'Customer created successfully');
        setTimeout(() => router.back(), 800);
      }
    } catch (err: any) {
      toast.showToast('error', 'Save Failed', err.message || 'Failed to save customer');
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
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Company Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={[styles.input, errors.companyName && styles.inputError]}
              value={formData.companyName}
              onChangeText={(value) => handleChange('companyName', value)}
              placeholder="Enter company name"
              placeholderTextColor="#9CA3AF"
            />
            {errors.companyName && (
              <Text style={styles.errorText}>{errors.companyName}</Text>
            )}
          </View>

          {/* GST Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST Number</Text>
            <TextInput
              style={[styles.input, errors.gstNumber && styles.inputError]}
              value={formData.gstNumber}
              onChangeText={(value) => handleChange('gstNumber', value)}
              placeholder="22AAAAA0000A1Z5"
              placeholderTextColor="#9CA3AF"
              maxLength={15}
              autoCapitalize="characters"
            />
            {formData.gstNumber.length > 0 && (
              <Text style={styles.helperText}>PAN will be auto-filled from GST number</Text>
            )}
            {errors.gstNumber && (
              <Text style={styles.errorText}>{errors.gstNumber}</Text>
            )}
          </View>

          {/* PAN Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={[styles.input, errors.panNumber && styles.inputError]}
              value={formData.panNumber}
              onChangeText={(value) => handleChange('panNumber', value.toUpperCase())}
              placeholder="AAAAA0000A"
              placeholderTextColor="#9CA3AF"
              maxLength={10}
              autoCapitalize="characters"
            />
            {errors.panNumber && (
              <Text style={styles.errorText}>{errors.panNumber}</Text>
            )}
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.address.city}
              onChangeText={(value) => handleChange('address.city', value)}
              placeholder="Enter city"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => handleChange('notes', value)}
              placeholder="Additional notes..."
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
              {isEditMode ? 'Update Customer' : 'Create Customer'}
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
    color: '#3B82F6',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
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
    backgroundColor: '#3B82F6',
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
