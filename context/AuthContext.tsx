import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/authAPI';

interface User {
  _id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check stored auth on mount
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Optionally verify token with backend
          try {
            const response = await authAPI.verifyToken();
            if (!response.success) {
              // Token invalid, clear auth
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
          } catch {
            // Verification failed but keep local auth (offline support)
            console.log('Token verification failed, using cached auth');
          }
        }
      } catch (error) {
        console.error('Error restoring auth:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await authAPI.login(email, password);

    if (response.success && response.token) {
      const userData = response.user || response.data || { email };
      setToken(response.token);
      setUser(userData);

      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
      }
    }

    return response;
  };

  const register = async (email: string, password: string) => {
    const response = await authAPI.register(email, password);

    if (response.success && response.token) {
      const userData = response.user || response.data || { email };
      setToken(response.token);
      setUser(userData);

      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    }

    return response;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
