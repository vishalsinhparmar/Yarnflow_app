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

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
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
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.log(`❌ Error response:`, errorData);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If response is not JSON, use status text
        console.log(`❌ Could not parse error response`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`✅ Success: ${url}`);
    return data;

  } catch (error) {
    console.log(`❌ Error details:`, error.message);
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to server. URL: ${url}. Check if backend is running and CORS is enabled.`);
    }
    throw error;
  }
};

export default { API_BASE_URL, apiRequest };
