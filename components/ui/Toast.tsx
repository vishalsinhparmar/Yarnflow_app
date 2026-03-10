import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Return a fallback that uses Alert if ToastProvider is not available
    return {
      showToast: (type, title, message) => {
        const { Alert } = require('react-native');
        Alert.alert(title, message || '');
      },
    };
  }
  return context;
};

const TOAST_CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; bg: string; border: string; iconBg: string; iconColor: string; titleColor: string; msgColor: string }> = {
  success: {
    icon: 'checkmark-circle',
    bg: '#F0FDF4',
    border: '#86EFAC',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    titleColor: '#15803D',
    msgColor: '#166534',
  },
  error: {
    icon: 'alert-circle',
    bg: '#FEF2F2',
    border: '#FECACA',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    titleColor: '#991B1B',
    msgColor: '#7F1D1D',
  },
  warning: {
    icon: 'warning',
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    titleColor: '#92400E',
    msgColor: '#78350F',
  },
  info: {
    icon: 'information-circle',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    titleColor: '#1E40AF',
    msgColor: '#1E3A8A',
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, toast.duration || 3500);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg, borderColor: config.border, transform: [{ translateY }], opacity }]}>
      <View style={[styles.toastIconWrap, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.icon} size={20} color={config.iconColor} />
      </View>
      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, { color: config.titleColor }]}>{toast.title}</Text>
        {toast.message ? (
          <Text style={[styles.toastMessage, { color: config.msgColor }]} numberOfLines={2}>
            {toast.message}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.toastDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color={config.titleColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev.slice(-2), { id, type, title, message, duration }]); // Keep max 3
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toastMessage: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  toastDismiss: {
    marginLeft: 8,
    padding: 4,
  },
});
