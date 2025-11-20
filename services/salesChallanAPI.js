// Sales Challan (Delivery) API Service for YarnFlow Mobile
import { apiRequest as baseRequest } from './common.js';

// Prefix all sales challan endpoints (note: plural 'sales-challans')
const apiRequest = (endpoint, options = {}) => baseRequest(`/sales-challans${endpoint}`, options);

// ============ SALES CHALLAN API ============
export const salesChallanAPI = {
  // Get all sales challans with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `?${queryString}` : '';
    return apiRequest(endpoint);
  },

  // Get sales challan by ID
  getById: async (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/${id}?${queryString}` : `/${id}`;
    return apiRequest(endpoint);
  },

  // Create new sales challan
  create: async (challanData) => {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify(challanData),
    });
  },

  // Update sales challan
  update: async (id, challanData) => {
    return apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(challanData),
    });
  },

  // Delete sales challan
  delete: async (id) => {
    return apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Get challans by sales order
  getBySalesOrder: async (soId, params = {}) => {
    return salesChallanAPI.getAll({ salesOrder: soId, ...params });
  },

  // Get challans by customer
  getByCustomer: async (customerId, params = {}) => {
    return salesChallanAPI.getAll({ customer: customerId, ...params });
  },

  // Get challans by status
  getByStatus: async (status, params = {}) => {
    return salesChallanAPI.getAll({ status, ...params });
  },

  // Update delivery status
  updateStatus: async (id, status, notes) => {
    return apiRequest(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Mark as in transit
  markInTransit: async (id, vehicleDetails) => {
    return apiRequest(`/${id}/in-transit`, {
      method: 'PATCH',
      body: JSON.stringify(vehicleDetails),
    });
  },

  // Mark as delivered
  markDelivered: async (id, deliveryDetails) => {
    return apiRequest(`/${id}/delivered`, {
      method: 'PATCH',
      body: JSON.stringify(deliveryDetails),
    });
  },

  // Track challan (real-time tracking)
  track: async (challanNumber) => {
    return apiRequest(`/track/${challanNumber}`);
  },

  // Get challan statistics
  getStats: async () => {
    return apiRequest('/stats');
  },

  // Get active deliveries (in transit)
  getActiveDeliveries: async () => {
    return salesChallanAPI.getByStatus('in_transit');
  },
};

// ============ UTILITY FUNCTIONS ============
export const challanFormatters = {
  // Format challan number
  challanNumber: (number) => {
    return number || 'N/A';
  },

  // Format challan status
  status: (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: '#6B7280', icon: '📝' },
      pending: { label: 'Pending', color: '#F59E0B', icon: '⏳' },
      in_transit: { label: 'In Transit', color: '#3B82F6', icon: '🚚' },
      delivered: { label: 'Delivered', color: '#10B981', icon: '✅' },
      cancelled: { label: 'Cancelled', color: '#EF4444', icon: '❌' },
      returned: { label: 'Returned', color: '#8B5CF6', icon: '↩️' },
    };
    return statusMap[status] || { label: status, color: '#6B7280', icon: '📦' };
  },

  // Format vehicle number
  vehicleNumber: (number) => {
    if (!number) return 'N/A';
    return number.toUpperCase();
  },

  // Format driver info
  driverInfo: (driver) => {
    if (!driver) return 'N/A';
    const { name, phone } = driver;
    return name && phone ? `${name} (${phone})` : name || phone || 'N/A';
  },

  // Calculate delivery time
  deliveryTime: (dispatchDate, deliveryDate) => {
    if (!dispatchDate || !deliveryDate) return 'N/A';
    const dispatch = new Date(dispatchDate);
    const delivery = new Date(deliveryDate);
    const diffInHours = Math.floor((delivery - dispatch) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  },

  // Format destination
  destination: (address) => {
    if (!address) return 'N/A';
    const { city, state } = address;
    return [city, state].filter(Boolean).join(', ') || 'N/A';
  },
};

export default salesChallanAPI;
