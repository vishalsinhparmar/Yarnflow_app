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
};

// ============ UTILITY FUNCTIONS ============
export const grnFormatters = {
  // Format GRN number
  grnNumber: (number) => {
    return number || 'N/A';
  },

  // Format GRN status
  status: (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: '#6B7280' },
      pending: { label: 'Pending', color: '#F59E0B' },
      approved: { label: 'Approved', color: '#10B981' },
      rejected: { label: 'Rejected', color: '#EF4444' },
    };
    return statusMap[status] || { label: status, color: '#6B7280' };
  },

  // Calculate total received quantity
  calculateTotalQuantity: (items) => {
    return items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  },

  // Calculate total weight
  calculateTotalWeight: (items) => {
    return items.reduce((sum, item) => sum + (item.actualWeight || 0), 0);
  },

  // Quality check status
  qualityStatus: (status) => {
    const statusMap = {
      passed: { label: 'Passed', color: '#10B981' },
      failed: { label: 'Failed', color: '#EF4444' },
      pending: { label: 'Pending', color: '#F59E0B' },
    };
    return statusMap[status] || { label: status, color: '#6B7280' };
  },
};

export default grnAPI;
