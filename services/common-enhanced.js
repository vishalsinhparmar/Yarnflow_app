// Enhanced API Configuration - Production Ready
// Supports: Local Development, Ngrok, and Production Deployment

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================
// 🌐 CONFIGURATION
// ============================================

// Get API URL from app.json (if set)
const EXPO_API_URL = Constants.expoConfig?.extra?.apiUrl;
const PRODUCTION_API_URL = Constants.expoConfig?.extra?.productionApiUrl;

// Local development settings
const LOCAL_CONFIG = {
  ip: "192.168.205.1",  // Your computer's IP
  port: 3050,           // Backend port
};

// ============================================
// 🎯 SMART API URL DETECTION
// ============================================

const getApiUrl = () => {
  // Priority 1: Use explicitly set API URL from app.json
  if (EXPO_API_URL) {
    console.log('🌐 Using configured API URL from app.json');
    return EXPO_API_URL;
  }

  // Priority 2: Use production URL if in production mode
  if (!__DEV__ && PRODUCTION_API_URL) {
    console.log('🚀 Using production API URL');
    return PRODUCTION_API_URL;
  }

  // Priority 3: Auto-detect based on platform (development mode)
  console.log('🔧 Auto-detecting API URL for development...');

  if (Platform.OS === 'web') {
    // Web always uses localhost
    return `http://localhost:${LOCAL_CONFIG.port}/api`;
  }

  if (Platform.OS === 'android') {
    // Check if using physical device or emulator
    if (LOCAL_CONFIG.ip) {
      console.log('📱 Using physical Android device');
      return `http://${LOCAL_CONFIG.ip}:${LOCAL_CONFIG.port}/api`;
    }
    // Android emulator
    return `http://10.0.2.2:${LOCAL_CONFIG.port}/api`;
  }

  if (Platform.OS === 'ios') {
    // Check if using physical device or simulator
    if (LOCAL_CONFIG.ip) {
      console.log('📱 Using physical iOS device');
      return `http://${LOCAL_CONFIG.ip}:${LOCAL_CONFIG.port}/api`;
    }
    // iOS simulator
    return `http://localhost:${LOCAL_CONFIG.port}/api`;
  }

  // Fallback
  return `http://localhost:${LOCAL_CONFIG.port}/api`;
};

export const API_BASE_URL = getApiUrl();

// ============================================
// 📊 CONFIGURATION LOGGING
// ============================================

console.log('═══════════════════════════════════════');
console.log('🌐 API CONFIGURATION');
console.log('═══════════════════════════════════════');
console.log(`Platform: ${Platform.OS}`);
console.log(`Environment: ${__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`API URL: ${API_BASE_URL}`);
console.log('═══════════════════════════════════════');

// ============================================
// 🔧 API REQUEST HELPER
// ============================================

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
    console.log(`🔗 API Request: ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`);
    return data;

  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    
    // Enhanced error messages
    if (error.message.includes('Network request failed')) {
      throw new Error(
        `Cannot connect to server at ${url}\n\n` +
        `Possible causes:\n` +
        `1. Backend server not running\n` +
        `2. Wrong IP address (current: ${LOCAL_CONFIG.ip})\n` +
        `3. Firewall blocking port ${LOCAL_CONFIG.port}\n` +
        `4. Not on same WiFi network\n\n` +
        `Solutions:\n` +
        `• Run: npx expo start --clear\n` +
        `• Use ngrok for easier development\n` +
        `• Deploy backend to production`
      );
    }
    
    throw error;
  }
};

// ============================================
// 🔍 CONNECTION HEALTH CHECK
// ============================================

export const checkConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      console.log('✅ Backend connection healthy');
      return { success: true, url: API_BASE_URL };
    }
    
    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      suggestions: [
        'Check if backend is running',
        'Verify IP address is correct',
        'Add firewall rule for port ' + LOCAL_CONFIG.port,
        'Try using ngrok for development',
      ]
    };
  }
};

// ============================================
// 📱 CONFIGURATION INFO
// ============================================

export const getConfigInfo = () => ({
  apiUrl: API_BASE_URL,
  platform: Platform.OS,
  isDevelopment: __DEV__,
  localConfig: LOCAL_CONFIG,
  expoConfig: {
    apiUrl: EXPO_API_URL,
    productionUrl: PRODUCTION_API_URL,
  },
});

export default { 
  API_BASE_URL, 
  apiRequest, 
  checkConnection,
  getConfigInfo,
};
