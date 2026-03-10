// Centralized API config and request helper for React Native
// Automatically detects environment and uses correct API URL

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment variable from Expo config (ensure it's a string)
const EXPO_API_URL = typeof Constants.expoConfig?.extra?.apiUrl === 'string' 
  ? Constants.expoConfig.extra.apiUrl 
  : null;

// Detect if we're in development or production
const isDevelopment = __DEV__;

// ============================================
// 🔧 CONFIGURATION FOR PHYSICAL DEVICE
// ============================================
// If using physical device, set your computer's IP address here
// Find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
// Example: '192.168.1.100' or '192.168.43.145' (for hotspot)
// 
// HOTSPOT USERS: Use the IP your phone assigned to your laptop
// Common ranges: 192.168.43.xxx (Android) or 172.20.10.xxx (iPhone)
const PHYSICAL_DEVICE_IP = "192.168.205.1"; // Updated to match current network IP

// 🔧 IMPORTANT: Make sure this matches your backend server port!
// Your backend is running on port 3050 (from .env file)
const BACKEND_PORT = 3050; // Updated to match backend default port

// Set API URLs based on platform
let DEVELOPMENT_API;

if (Platform.OS === 'web') {
  // For web, ALWAYS use localhost (browsers can't connect to external IPs directly)
  DEVELOPMENT_API = `http://localhost:${BACKEND_PORT}/api`;
  console.log('🌐 Web platform detected - using localhost');
} else if (PHYSICAL_DEVICE_IP && (Platform.OS === 'android' || Platform.OS === 'ios')) {
  // Physical device - use your computer's IP address
  DEVELOPMENT_API = `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api`;
  console.log('📱 Using Physical Device Mode');
} else if (Platform.OS === 'android') {
  // For Android emulator, use 10.0.2.2 (special IP that points to host machine)
  DEVELOPMENT_API = `http://10.0.2.2:${BACKEND_PORT}/api`;
  console.log('🤖 Android emulator detected');
} else if (Platform.OS === 'ios') {
  // For iOS simulator, use localhost
  DEVELOPMENT_API = `http://localhost:${BACKEND_PORT}/api`;
  console.log('📱 iOS simulator detected');
} else {
  // Fallback for other platforms
  DEVELOPMENT_API = `http://localhost:${BACKEND_PORT}/api`;
  console.log('🔧 Using fallback localhost configuration');
}

const PRODUCTION_API = 'https://yarnflow-production.up.railway.app/api';

// Automatic selection: Use Expo env var if set, otherwise auto-detect
export const API_BASE_URL = EXPO_API_URL || (isDevelopment ? DEVELOPMENT_API : PRODUCTION_API);

// API Configuration Summary
console.log(`🌐 Platform: ${Platform.OS} | API: ${API_BASE_URL}`);

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Attach auth token if available
  let authHeaders = {};
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      authHeaders = { 'Authorization': `Bearer ${token}` };
    }
  } catch (e) {
    // Silently fail if AsyncStorage is unavailable
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...authHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    console.log(`🔗 Trying: ${url}`);
    if (config.body) {
      console.log(`📦 Request body:`, config.body);
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      
      // Try to get error details from response body
      let errorMessage = '';
      let errorData = null;
      try {
        errorData = await response.json();
        console.log(`❌ Error response:`, errorData);
        
        // Extract field-specific validation errors if available
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const fieldErrors = errorData.errors.map(e => e.msg || e.message).filter(Boolean);
          errorMessage = fieldErrors.length > 0 ? fieldErrors.join('\n') : '';
        }
        if (!errorMessage && errorData.message) {
          errorMessage = errorData.message;
        }
        if (!errorMessage && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        console.log(`❌ Could not parse error response`);
      }

      // Map HTTP status codes to user-friendly messages
      if (!errorMessage) {
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Your session has expired. Please log in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested item was not found.';
            break;
          case 409:
            errorMessage = 'This item already exists or conflicts with existing data.';
            break;
          case 422:
            errorMessage = 'Please check your input. Some fields have invalid values.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = 'Something went wrong. Please try again.';
            break;
        }
      }
      
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      error.serverMessage = errorData?.message || '';
      throw error;
    }

    const data = await response.json();
    console.log(`✅ Success: ${url}`);
    return data;

  } catch (error) {
    console.log(`❌ Error details:`, error.message);
    
    // Network / connection errors — user-friendly message
    if (
      error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('TypeError: Network') ||
      error.message.includes('AbortError')
    ) {
      const networkError = new Error(
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || error.name === 'AbortError') {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    
    throw error;
  }
};

export default { API_BASE_URL, apiRequest };
