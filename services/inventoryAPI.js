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

  // Get inventory by product (filter via getAll)
  getByProduct: async (productId, params = {}) => {
    return inventoryAPI.getAll({ product: productId, ...params });
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

  // Format lot status — matches server enum: Active | Reserved | Consumed
  status: (status) => {
    const statusMap = {
      Active:   { label: 'Active',   color: '#10B981' },
      Reserved: { label: 'Reserved', color: '#F59E0B' },
      Consumed: { label: 'Consumed', color: '#6B7280' },
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
