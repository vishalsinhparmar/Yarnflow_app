// Authentication API Service for YarnFlow Mobile
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './common.js';

// ============ AUTH API ============
export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store token and user data if login successful
      if (response.success && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user || {}));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (email, password, name) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await apiRequest('/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response;
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false, message: error.message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get stored token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  // Get stored user
  getUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  },
};

export default authAPI;
