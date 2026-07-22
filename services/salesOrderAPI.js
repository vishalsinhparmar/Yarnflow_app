// Sales Order API Service for YarnFlow Mobile
import { apiRequest as baseRequest } from './common.js';

// Prefix all sales order endpoints
const apiRequest = (endpoint, options = {}) => baseRequest(`/sales-orders${endpoint}`, options);

// ============ SALES ORDER API ============
export const salesOrderAPI = {
  // Get all sales orders with pagination and filters
  getAll: async (params = {}) => {
    // Always populate customer and category for list views
    const defaultParams = { populate: 'customer,category', ...params };
    const queryString = new URLSearchParams(defaultParams).toString();
    const endpoint = queryString ? `?${queryString}` : '';
    return apiRequest(endpoint);
  },

  // Get sales order by ID
  getById: async (id) => {
    // Request populated fields for customer, category, and products
    return apiRequest(`/${id}?populate=customer,category,items.product`);
  },

  // Create new sales order
  create: async (soData) => {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify(soData),
    });
  },

  // Update sales order
  update: async (id, soData) => {
    return apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(soData),
    });
  },

  // Delete sales order
  delete: async (id) => {
    return apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Get sales orders by customer
  getByCustomer: async (customerId, params = {}) => {
    return salesOrderAPI.getAll({ customer: customerId, ...params });
  },

  // Get sales orders by status
  getByStatus: async (status, params = {}) => {
    return salesOrderAPI.getAll({ status, ...params });
  },

  // Update sales order status — valid values: Draft | Pending | Processing | Delivered | Cancelled
  updateStatus: async (id, status) => {
    return apiRequest(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Cancel sales order
  cancel: async (id, reason) => {
    return apiRequest(`/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // Recalculate all SO statuses (admin utility)
  recalculateStatuses: async () => {
    return apiRequest('/recalculate-statuses', {
      method: 'POST',
    });
  },

  // Get sales order statistics
  getStats: async () => {
    return apiRequest('/stats');
  },
};

// ============ UTILITY FUNCTIONS ============
export const soFormatters = {
  // Format SO number
  soNumber: (number) => {
    return number || 'N/A';
  },

  // Format SO status — matches server enum: Draft | Pending | Processing | Delivered | Cancelled
  status: (status) => {
    const statusMap = {
      Draft:      { label: 'Draft',      color: '#6B7280' },
      Pending:    { label: 'Pending',    color: '#F59E0B' },
      Processing: { label: 'Processing', color: '#3B82F6' },
      Delivered:  { label: 'Delivered',  color: '#059669' },
      Cancelled:  { label: 'Cancelled',  color: '#EF4444' },
    };
    return statusMap[status] || { label: status, color: '#6B7280' };
  },

  // Calculate SO totals
  calculateTotals: (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    return { subtotal, tax, total };
  },

  // Payment status
  paymentStatus: (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: '#F59E0B' },
      partial: { label: 'Partial', color: '#3B82F6' },
      paid: { label: 'Paid', color: '#10B981' },
      overdue: { label: 'Overdue', color: '#EF4444' },
    };
    return statusMap[status] || { label: status, color: '#6B7280' };
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

  // Check if SO is overdue
  isOverdue: (expectedDeliveryDate, status) => {
    if (!expectedDeliveryDate) return false;
    const today = new Date();
    const deliveryDate = new Date(expectedDeliveryDate);
    const completedStatuses = ['delivered', 'cancelled'];
    return deliveryDate < today && !completedStatuses.includes(status);
  },

  // Calculate completion percentage
  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const dispatchedQuantity = items.reduce((sum, item) => sum + (item.dispatchedQuantity || 0), 0);
    return totalQuantity > 0 ? Math.round((dispatchedQuantity / totalQuantity) * 100) : 0;
  },

  // Get next possible statuses — matches server enum flow
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft':      ['Pending', 'Cancelled'],
      'Pending':    ['Processing', 'Cancelled'],
      'Processing': ['Delivered', 'Cancelled'],
      'Delivered':  [],
      'Cancelled':  []
    };
    return statusFlow[currentStatus] || [];
  },
};

export default salesOrderAPI;
