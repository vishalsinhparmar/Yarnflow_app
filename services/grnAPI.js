// Goods Receipt Note (GRN) API Service for YarnFlow Mobile
import { apiRequest as baseRequest } from './common.js';

// Prefix all GRN endpoints
const apiRequest = (endpoint, options = {}) => baseRequest(`/grn${endpoint}`, options);

// ============ GRN API ============
export const grnAPI = {
  // Get all GRNs with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `?${queryString}` : '';
    return apiRequest(endpoint);
  },

  // Get GRN by ID
  getById: async (id) => {
    return apiRequest(`/${id}`);
  },

  // Create new GRN
  create: async (grnData) => {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify(grnData),
    });
  },

  // Update GRN
  update: async (id, grnData) => {
    return apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grnData),
    });
  },

  // Delete GRN
  delete: async (id) => {
    return apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Get GRNs by purchase order
  getByPurchaseOrder: async (poId, params = {}) => {
    return grnAPI.getAll({ purchaseOrder: poId, ...params });
  },

  // Get GRNs by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return grnAPI.getAll({ supplier: supplierId, ...params });
  },

  // Approve GRN
  approve: async (id) => {
    return apiRequest(`/${id}/approve`, {
      method: 'PATCH',
    });
  },

  // Get GRN statistics
  getStats: async () => {
    return apiRequest('/stats');
  },

  // Approve GRN and create inventory lots
  approve: async (id, approvedBy = 'Mobile User', notes = '') => {
    return apiRequest(`/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approvedBy, notes }),
    });
  },

  // Update GRN status
  updateStatus: async (id, status, notes = '') => {
    return apiRequest(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },
};

// ============ UTILITY FUNCTIONS ============
export const grnUtils = {
  // Format GRN status for display
  formatStatus: (status) => {
    const statusMap = {
      'Draft': 'Draft',
      'Received': 'Received',
      'Under_Review': 'Under Review',
      'Approved': 'Approved',
      'Rejected': 'Rejected',
      'Completed': 'Completed',
      'Complete': 'Complete',
      'Partial': 'Partial',
      'Pending': 'Pending'
    };
    return statusMap[status] || status;
  },

  // Get status color for UI
  getStatusColor: (status) => {
    const colorMap = {
      'Draft': '#6B7280',
      'Received': '#3B82F6',
      'Under_Review': '#F59E0B',
      'Approved': '#10B981',
      'Rejected': '#EF4444',
      'Completed': '#10B981',
      'Complete': '#10B981',
      'Partial': '#F59E0B',
      'Pending': '#F59E0B'
    };
    return colorMap[status] || '#6B7280';
  },

  // Format date
  formatDate: (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format quantity with unit
  formatQuantity: (quantity, unit) => {
    return `${quantity || 0} ${unit || ''}`;
  },

  // Calculate completion percentage
  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    
    const totalItems = items.length;
    const completedItems = items.filter(item => {
      const ordered = item.orderedQuantity || 0;
      const received = (item.previouslyReceived || 0) + (item.receivedQuantity || 0);
      return received >= ordered || item.manuallyCompleted;
    }).length;
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  },

  // Calculate total received quantity
  calculateTotalQuantity: (items) => {
    return items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  },

  // Calculate total weight
  calculateTotalWeight: (items) => {
    return items.reduce((sum, item) => sum + (item.receivedWeight || 0), 0);
  },

  // Calculate weight per unit
  calculateWeightPerUnit: (orderedWeight, orderedQuantity) => {
    if (!orderedQuantity || orderedQuantity === 0) return 0;
    return orderedWeight / orderedQuantity;
  },

  // Check if GRN can be edited
  canEdit: (status) => {
    return ['Draft', 'Received', 'Pending'].includes(status);
  },

  // Check if GRN can be deleted
  canDelete: (status) => {
    return status === 'Draft';
  }
};

export const grnFormatters = grnUtils;

export default grnAPI;
