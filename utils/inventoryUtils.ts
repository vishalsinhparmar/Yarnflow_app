// Utility functions for inventory management

// Format currency (Indian Rupees)
export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

// Format quantity with unit
export const formatQuantity = (quantity: number, unit: string): string => {
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)}K ${unit}`;
  }
  return `${quantity} ${unit}`;
};

// Format date
export const formatDate = (date: string | Date | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Format relative time
export const formatRelativeTime = (date: string | Date | null): string => {
  if (!date) return '-';
  
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(date);
};

// Get status color
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'Active': '#10B981',
    'Reserved': '#F59E0B',
    'Consumed': '#6B7280',
    'Expired': '#EF4444',
    'Damaged': '#EF4444',
    'Returned': '#3B82F6',
    'Pending': '#F59E0B',
    'Complete': '#10B981',
    'Uncategorized': '#6B7280',
  };
  return colorMap[status] || '#6B7280';
};

// Calculate stock percentage
export const calculateStockPercentage = (current: number, received: number): number => {
  if (!received || received === 0) return 0;
  return Math.round((current / received) * 100);
};

// Format weight
export const formatWeight = (weight: number, unit: 'Kg' | 'Tons' = 'Kg'): string => {
  if (unit === 'Tons') {
    return `${(weight / 1000).toFixed(2)} Tons`;
  }
  return `${weight.toFixed(2)} Kg`;
};

// Get warehouse name from code
export const getWarehouseName = (warehouseCode: string): string => {
  const warehouseMap: Record<string, string> = {
    'WH-001': 'Main Warehouse',
    'WH-002': 'Secondary Warehouse',
    'WH-003': 'Storage Unit A',
    'Surat-Daskroi': 'Surat Daskroi',
    'newcategory-godavari': 'Godavari Warehouse',
  };
  return warehouseMap[warehouseCode] || warehouseCode;
};

// Validate movement quantity
export const validateMovementQuantity = (
  type: string,
  quantity: number,
  availableQuantity: number
): string | null => {
  const outgoingTypes = ['Issued', 'Damaged', 'Transferred', 'Reserved'];
  
  if (outgoingTypes.includes(type) && quantity > availableQuantity) {
    return `Insufficient stock. Available: ${availableQuantity}`;
  }
  
  if (quantity <= 0) {
    return 'Quantity must be greater than 0';
  }
  
  return null;
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
