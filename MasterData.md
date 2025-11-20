# YarnFlow React Native - Master Data Implementation Guide

## Overview
This guide provides comprehensive instructions for implementing the Master Data functionality from the YarnFlow web application into a React Native mobile app. The master data includes Customers, Suppliers, Products, and Categories management.

## Table of Contents
1. [Project Setup](#project-setup)
2. [API Configuration](#api-configuration)
3. [Navigation Structure](#navigation-structure)
4. [Component Architecture](#component-architecture)
5. [Implementation Examples](#implementation-examples)
6. [State Management](#state-management)
7. [UI Components](#ui-components)
8. [Best Practices](#best-practices)

## Project Setup

### Dependencies
Add these dependencies to your React Native project:

```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install react-native-paper # For UI components
npm install axios # For API calls
```

### Project Structure
```
src/
├── components/
│   └── masterdata/
│       ├── customers/
│       ├── suppliers/
│       ├── products/
│       └── categories/
├── screens/
│   └── masterdata/
├── services/
│   └── api/
├── hooks/
├── utils/
└── navigation/
```

## API Configuration

### Base API Service
Create `src/services/api/baseAPI.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://your-server-url/api'; // Update with your server URL

class APIService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

export default new APIService();
```

### Master Data API Service
Create `src/services/api/masterDataAPI.js`:

```javascript
import APIService from './baseAPI';

const apiRequest = (endpoint, options = {}) => 
  APIService.request(`/master-data${endpoint}`, options);

// Customer API
export const customerAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    return apiRequest(endpoint);
  },

  getById: async (id) => apiRequest(`/customers/${id}`),

  create: async (customerData) => apiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),

  update: async (id, customerData) => apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  }),

  delete: async (id) => apiRequest(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Supplier API
export const supplierAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return apiRequest(endpoint);
  },

  getById: async (id) => apiRequest(`/suppliers/${id}`),

  create: async (supplierData) => apiRequest('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData),
  }),

  update: async (id, supplierData) => apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData),
  }),

  delete: async (id) => apiRequest(`/suppliers/${id}`, {
    method: 'DELETE',
  }),
};

// Category API
export const categoryAPI = {
  getAll: async (includeSubcategories = false) => {
    const params = includeSubcategories ? { includeSubcategories: 'true' } : {};
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/categories?${queryString}` : '/categories';
    return apiRequest(endpoint);
  },

  create: async (categoryData) => apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),

  update: async (categoryId, categoryData) => apiRequest(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  }),

  delete: async (categoryId) => apiRequest(`/categories/${categoryId}`, {
    method: 'DELETE',
  }),
};

// Product API
export const productAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return apiRequest(endpoint);
  },

  getById: async (id) => apiRequest(`/products/${id}`),

  create: async (productData) => apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),

  update: async (id, productData) => apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  }),

  delete: async (id) => apiRequest(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Stats API
export const getMasterDataStats = async () => apiRequest('/stats');
```

## Navigation Structure

### Master Data Navigator
Create `src/navigation/MasterDataNavigator.js`:

```javascript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MasterDataDashboard from '../screens/masterdata/MasterDataDashboard';
import CustomersScreen from '../screens/masterdata/CustomersScreen';
import SuppliersScreen from '../screens/masterdata/SuppliersScreen';
import ProductsScreen from '../screens/masterdata/ProductsScreen';
import CategoriesScreen from '../screens/masterdata/CategoriesScreen';

const Stack = createStackNavigator();

const MasterDataNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MasterDataDashboard" 
        component={MasterDataDashboard}
        options={{ title: 'Master Data' }}
      />
      <Stack.Screen 
        name="Customers" 
        component={CustomersScreen}
        options={{ title: 'Customers' }}
      />
      <Stack.Screen 
        name="Suppliers" 
        component={SuppliersScreen}
        options={{ title: 'Suppliers' }}
      />
      <Stack.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
    </Stack.Navigator>
  );
};

export default MasterDataNavigator;
```

## Component Architecture

### Custom Hook for Master Data
Create `src/hooks/useMasterData.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { 
  customerAPI, 
  supplierAPI, 
  categoryAPI, 
  productAPI, 
  getMasterDataStats 
} from '../services/api/masterDataAPI';

export const useMasterData = () => {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMasterDataStats();
      setStats(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll(params);
      setCustomers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await supplierAPI.getAll(params);
      setSuppliers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await productAPI.getAll(params);
      setProducts(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    customers,
    suppliers,
    categories,
    products,
    loading,
    error,
    fetchStats,
    fetchCustomers,
    fetchSuppliers,
    fetchCategories,
    fetchProducts,
  };
};
```

## Implementation Examples

### Master Data Dashboard Screen
Create `src/screens/masterdata/MasterDataDashboard.js`:

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useMasterData } from '../../hooks/useMasterData';

const MasterDataDashboard = ({ navigation }) => {
  const { stats, loading, error } = useMasterData();

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Master Data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  const dashboardItems = [
    {
      title: 'Customers',
      count: stats?.customers?.total || 0,
      subtitle: `${stats?.customers?.active || 0} active`,
      color: '#3B82F6',
      icon: '👥',
      screen: 'Customers',
    },
    {
      title: 'Suppliers',
      count: stats?.suppliers?.total || 0,
      subtitle: 'Total suppliers',
      color: '#8B5CF6',
      icon: '🏭',
      screen: 'Suppliers',
    },
    {
      title: 'Products',
      count: stats?.products?.total || 0,
      subtitle: `${stats?.products?.lowStock || 0} low stock`,
      color: '#10B981',
      icon: '🧶',
      screen: 'Products',
    },
    {
      title: 'Categories',
      count: stats?.categories?.total || 0,
      subtitle: 'Product categories',
      color: '#F59E0B',
      icon: '📂',
      screen: 'Categories',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Master Data Management</Text>
        <Text style={styles.subtitle}>
          Manage customers, suppliers, products, and categories
        </Text>
      </View>

      <View style={styles.grid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.count}>{item.count}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    width: '45%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default MasterDataDashboard;
```

### Customer Form Component
Create `src/components/masterdata/customers/CustomerForm.js`:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const CustomerForm = ({ customer, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    notes: '',
    address: {
      city: '',
    },
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName || '',
        gstNumber: customer.gstNumber || '',
        panNumber: customer.panNumber || '',
        notes: customer.notes || '',
        address: {
          city: customer.address?.city || '',
        },
      });
    }
  }, [customer]);

  const extractPANFromGST = (gstNumber) => {
    if (gstNumber && gstNumber.length >= 10) {
      return gstNumber.substring(2, 12).toUpperCase();
    }
    return '';
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else if (field === 'gstNumber') {
      setFormData(prev => ({
        ...prev,
        gstNumber: value.toUpperCase(),
        panNumber: extractPANFromGST(value),
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
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      newErrors.gstNumber = 'GST number must be 15 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={[styles.input, errors.companyName && styles.inputError]}
            value={formData.companyName}
            onChangeText={(value) => handleChange('companyName', value)}
            placeholder="Enter company name"
          />
          {errors.companyName && (
            <Text style={styles.errorText}>{errors.companyName}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={[styles.input, errors.gstNumber && styles.inputError]}
            value={formData.gstNumber}
            onChangeText={(value) => handleChange('gstNumber', value)}
            placeholder="Enter GST number"
            maxLength={15}
          />
          {errors.gstNumber && (
            <Text style={styles.errorText}>{errors.gstNumber}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PAN Number</Text>
          <TextInput
            style={styles.input}
            value={formData.panNumber}
            onChangeText={(value) => handleChange('panNumber', value)}
            placeholder="Enter PAN number"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.address.city}
            onChangeText={(value) => handleChange('address.city', value)}
            placeholder="Enter city"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Enter notes"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
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

export default CustomerForm;
```

## State Management

### Context Provider for Master Data
Create `src/context/MasterDataContext.js`:

```javascript
import React, { createContext, useContext, useReducer } from 'react';

const MasterDataContext = createContext();

const initialState = {
  customers: [],
  suppliers: [],
  products: [],
  categories: [],
  stats: null,
  loading: false,
  error: null,
};

const masterDataReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_STATS':
      return { ...state, stats: action.payload, loading: false };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload, loading: false };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload, loading: false };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, loading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, loading: false };
    case 'ADD_CUSTOMER':
      return { 
        ...state, 
        customers: [...state.customers, action.payload],
        loading: false 
      };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer._id === action.payload._id ? action.payload : customer
        ),
        loading: false
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer._id !== action.payload),
        loading: false
      };
    default:
      return state;
  }
};

export const MasterDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(masterDataReducer, initialState);

  return (
    <MasterDataContext.Provider value={{ state, dispatch }}>
      {children}
    </MasterDataContext.Provider>
  );
};

export const useMasterDataContext = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterDataContext must be used within a MasterDataProvider');
  }
  return context;
};
```

## UI Components

### Reusable Card Component
Create `src/components/common/Card.js`:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';

const Card = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Card;
```

### Search Bar Component
Create `src/components/common/SearchBar.js`:

```javascript
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const SearchBar = ({ value, onChangeText, placeholder = 'Search...' }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

export default SearchBar;
```

## Best Practices

### 1. Error Handling
- Implement comprehensive error handling for all API calls
- Show user-friendly error messages
- Implement retry mechanisms for failed requests

### 2. Performance Optimization
- Use FlatList for large datasets
- Implement pagination for data lists
- Use React.memo for component optimization
- Implement proper loading states

### 3. Offline Support
- Cache frequently accessed data using AsyncStorage
- Implement offline-first approach where possible
- Show appropriate UI when offline

### 4. Security
- Store API tokens securely using KeyChain (iOS) or Keystore (Android)
- Validate all user inputs
- Implement proper authentication flows

### 5. Testing
- Write unit tests for API services
- Test form validations
- Implement integration tests for critical flows

## Configuration Steps

1. **Update Base URL**: Change the `BASE_URL` in `baseAPI.js` to your server URL
2. **Configure Navigation**: Add the MasterDataNavigator to your main navigation
3. **Add Context Provider**: Wrap your app with MasterDataProvider
4. **Style Customization**: Update colors and styles to match your brand
5. **Icon Configuration**: Configure react-native-vector-icons for your platform

## Deployment Checklist

- [ ] API endpoints configured correctly
- [ ] Authentication flow implemented
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Form validations working
- [ ] Navigation flow tested
- [ ] Offline support configured
- [ ] Performance optimized
- [ ] Security measures implemented
- [ ] Testing completed

This comprehensive guide provides everything needed to implement the YarnFlow master data functionality in React Native, maintaining consistency with the web application while optimizing for mobile user experience.
