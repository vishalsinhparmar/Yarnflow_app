import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, apiRequest } from '../../services/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/colors';

interface ConnectionHealthCheckProps {
  onConnectionChange?: (isConnected: boolean) => void;
  showStatus?: boolean;
}

export default function ConnectionHealthCheck({ 
  onConnectionChange, 
  showStatus = true 
}: ConnectionHealthCheckProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Try to hit a simple health endpoint
      await apiRequest('/health');
      setIsConnected(true);
      setLastChecked(new Date());
      onConnectionChange?.(true);
    } catch (error) {
      console.error('Connection health check failed:', error);
      setIsConnected(false);
      onConnectionChange?.(false);
      
      // Show detailed error to help with debugging
      if (showStatus) {
        Alert.alert(
          'Connection Error',
          `Cannot connect to backend server.\n\nServer: ${API_BASE_URL}\n\nError: ${error.message}\n\nPlease check:\n1. Backend server is running\n2. Network connection\n3. Firewall settings\n4. IP address is correct`,
          [
            { text: 'Retry', onPress: checkConnection },
            { text: 'Dismiss', style: 'cancel' }
          ]
        );
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showStatus) {
    return null;
  }

  const getStatusColor = () => {
    if (isConnected === null) return COLORS.gray400;
    return isConnected ? COLORS.success : COLORS.danger;
  };

  const getStatusIcon = () => {
    if (isChecking) return 'refresh';
    if (isConnected === null) return 'help-circle';
    return isConnected ? 'checkmark-circle' : 'close-circle';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking connection...';
    if (isConnected === null) return 'Connection unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.statusButton, { borderColor: getStatusColor() }]}
        onPress={checkConnection}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <Ionicons 
            name={getStatusIcon()} 
            size={16} 
            color={getStatusColor()} 
          />
        )}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>
      
      {lastChecked && (
        <Text style={styles.lastCheckedText}>
          Last checked: {lastChecked.toLocaleTimeString()}
        </Text>
      )}
      
      <Text style={styles.serverText}>
        Server: {API_BASE_URL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
  },
  statusText: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    fontWeight: '600',
  },
  lastCheckedText: {
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  serverText: {
    fontSize: 10,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontFamily: 'monospace',
  },
});
