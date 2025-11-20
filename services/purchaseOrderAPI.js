// Purchase Order API Service for YarnFlow Mobile
import { apiRequest as baseRequest } from './common.js';

// Prefix all purchase order endpoints
const apiRequest = (endpoint, options = {}) => baseRequest(`/purchase-orders${endpoint}`, options);

// ============ PURCHASE ORDER API ============
export const purchaseOrderAPI = {
  // Get all purchase orders with pagination and filters
  getAll: async (params = {}) => {
    // Always populate supplier and category for list views
    const defaultParams = { populate: 'supplier,category', ...params };
    const queryString = new URLSearchParams(defaultParams).toString();
    const endpoint = queryString ? `?${queryString}` : '';
    return apiRequest(endpoint);
  },

  // Get purchase order by ID
  getById: async (id) => {
    // Request populated fields for supplier, category, and products
    return apiRequest(`/${id}?populate=supplier,category,items.product`);
  },

  // Create new purchase order
  create: async (poData) => {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  },

  // Update purchase order
  update: async (id, poData) => {
    return apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(poData),
    });
  },

  // Delete purchase order
  delete: async (id) => {
    return apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Get purchase orders by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return purchaseOrderAPI.getAll({ supplier: supplierId, ...params });
  },

  // Get purchase orders by status
  getByStatus: async (status, params = {}) => {
    return purchaseOrderAPI.getAll({ status, ...params });
  },

  // Approve purchase order
  approve: async (id) => {
    return apiRequest(`/${id}/approve`, {
      method: 'PATCH',
    });
  },

  // Cancel purchase order
  cancel: async (id, data = {}) => {
    return apiRequest(`/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Get purchase order statistics
  getStats: async () => {
    return apiRequest('/stats');
  },

  // Update purchase order status
  updateStatus: async (id, status, notes = '') => {
    return apiRequest(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Search purchase orders
  search: async (searchTerm, filters = {}) => {
    return purchaseOrderAPI.getAll({ search: searchTerm, ...filters });
  },

  // Get overdue purchase orders
  getOverdue: async () => {
    return purchaseOrderAPI.getAll({ overdue: 'true' });
  },

  // Get purchase orders by date range
  getByDateRange: async (dateFrom, dateTo, params = {}) => {
    return purchaseOrderAPI.getAll({ dateFrom, dateTo, ...params });
  },
};

// ============ UTILITY FUNCTIONS ============
export const poFormatters = {
  // Format PO number
  poNumber: (number) => {
    return number || 'N/A';
  },

  // Format PO status
  status: (status) => {
    const statusMap = {
      'Draft': { label: 'Draft', color: '#6B7280' },
      'Sent': { label: 'Sent', color: '#3B82F6' },
      'Acknowledged': { label: 'Acknowledged', color: '#F59E0B' },
      'Approved': { label: 'Approved', color: '#10B981' },
      'Partially_Received': { label: 'Partially Received', color: '#F97316' },
      'Fully_Received': { label: 'Fully Received', color: '#10B981' },
      'Cancelled': { label: 'Cancelled', color: '#EF4444' },
      'Closed': { label: 'Closed', color: '#6B7280' },
    };
    return statusMap[status] || { label: status, color: '#6B7280' };
  },

  // Calculate PO totals
  calculateTotals: (items) => {
    if (!items || items.length === 0) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    return { subtotal, tax, total };
  },

  // Format currency
  currency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  },

  // Format date
  date: (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Check if PO is overdue
  isOverdue: (expectedDeliveryDate, status) => {
    if (!expectedDeliveryDate) return false;
    const today = new Date();
    const deliveryDate = new Date(expectedDeliveryDate);
    const completedStatuses = ['Fully_Received', 'Cancelled', 'Closed'];
    return deliveryDate < today && !completedStatuses.includes(status);
  },

  // Calculate completion percentage
  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQuantity = items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
  },

  // Get next possible statuses
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft': ['Sent', 'Cancelled'],
      'Sent': ['Acknowledged', 'Cancelled'],
      'Acknowledged': ['Approved', 'Cancelled'],
      'Approved': ['Partially_Received', 'Fully_Received', 'Cancelled'],
      'Partially_Received': ['Fully_Received', 'Cancelled'],
      'Fully_Received': ['Closed'],
      'Cancelled': [],
      'Closed': []
    };
    return statusFlow[currentStatus] || [];
  },
};

export default purchaseOrderAPI;
