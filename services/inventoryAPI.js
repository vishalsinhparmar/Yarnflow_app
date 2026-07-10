// Inventory Lots API Service for YarnFlow Mobile
import { apiRequest as baseRequest } from './common.js';

// Prefix all inventory endpoints
const apiRequest = (endpoint, options = {}) => baseRequest(`/inventory${endpoint}`, options);

// ============ INVENTORY LOT API ============
export const inventoryAPI = {
  // Get all inventory lots with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `?${queryString}` : '';
    return apiRequest(endpoint);
  },

  // Get inventory lot by ID
  getById: async (id) => {
    return apiRequest(`/${id}`);
  },

  // Create new inventory lot
  create: async (lotData) => {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify(lotData),
    });
  },

  // Update inventory lot
  update: async (id, lotData) => {
    return apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lotData),
    });
  },

  // Delete inventory lot
  delete: async (id) => {
    return apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Get inventory by product
  getByProduct: async (productId, params = {}) => {
    return inventoryAPI.getAll({ product: productId, ...params });
  },

  // Get inventory by location
  getByLocation: async (location, params = {}) => {
    return inventoryAPI.getAll({ location, ...params });
  },

  // Get low stock items
  getLowStock: async () => {
    return apiRequest('/low-stock');
  },

  // Get available stock for sales
  getAvailableStock: async (productId) => {
    return apiRequest(`/available/${productId}`);
  },

  // Reserve stock for sales order
  reserveStock: async (lotId, quantity) => {
    return apiRequest(`/${lotId}/reserve`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  // Release reserved stock
  releaseStock: async (lotId, quantity) => {
    return apiRequest(`/${lotId}/release`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  // Get inventory statistics
  getStats: async () => {
    return apiRequest('/stats');
  },

  // Get inventory products list with stock in/out breakdown (grouped by product)
  getProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `?${queryString}` : '';
    return apiRequest(endpoint);
  },

  // Get product inventory detail with sub-product breakdown and per-unit weights
  getProductDetail: async (productId) => {
    return apiRequest(`/product/${productId}`);
  },

  // Get all inventory lots with filtering
  getAllLots: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/lots?${queryString}` : '/lots';
    return apiRequest(endpoint);
  },

  // Get single inventory lot details
  getLotById: async (id) => {
    return apiRequest(`/lots/${id}`);
  },

  // Get movement history for a lot
  getMovementHistory: async (id) => {
    return apiRequest(`/lots/${id}/movements`);
  },
};

// ============ UTILITY FUNCTIONS ============
export const inventoryFormatters = {
  // Format lot number
  lotNumber: (number) => {
    return number || 'N/A';
  },

  // Format lot status
  status: (status) => {
    const statusMap = {
      available: { label: 'Available', color: '#10B981' },
      reserved: { label: 'Reserved', color: '#F59E0B' },
      sold: { label: 'Sold', color: '#3B82F6' },
      damaged: { label: 'Damaged', color: '#EF4444' },
      expired: { label: 'Expired', color: '#6B7280' },
    };
    return statusMap[status] || { label: status, color: '#6B7280' };
  },

  // Calculate available quantity
  availableQuantity: (lot) => {
    const { totalQuantity = 0, reservedQuantity = 0, soldQuantity = 0 } = lot;
    return totalQuantity - reservedQuantity - soldQuantity;
  },

  // Check if lot is low stock
  isLowStock: (lot) => {
    const available = inventoryFormatters.availableQuantity(lot);
    const reorderLevel = lot.reorderLevel || 0;
    return available <= reorderLevel;
  },

  // Format storage location
  location: (location) => {
    if (!location) return 'N/A';
    const { warehouse, rack, bin } = location;
    return [warehouse, rack, bin].filter(Boolean).join(' - ') || 'N/A';
  },
};

export default inventoryAPI;
