// Sales Challan (Delivery) API Service for YarnFlow Mobile
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_BASE_URL, apiRequest as baseRequest } from "./common.js";

// Prefix all sales challan endpoints (note: plural 'sales-challans')
const apiRequest = (endpoint, options = {}) =>
  baseRequest(`/sales-challans${endpoint}`, options);

// ============ SALES CHALLAN API ============
export const salesChallanAPI = {
  // Get all sales challans with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `?${queryString}` : "";
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
    return apiRequest("", {
      method: "POST",
      body: JSON.stringify(challanData),
    });
  },

  // Update sales challan
  update: async (id, challanData) => {
    return apiRequest(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(challanData),
    });
  },

  // Delete sales challan
  delete: async (id) => {
    return apiRequest(`/${id}`, {
      method: "DELETE",
    });
  },

  // Get challans by sales order (uses dedicated route /by-sales-order/:soId)
  getBySalesOrder: async (soId) => {
    return apiRequest(`/by-sales-order/${soId}`);
  },

  // Get dispatched quantities for a sales order
  getDispatchedQuantities: async (salesOrderId) => {
    return apiRequest(`/dispatched/${salesOrderId}`);
  },

  // Get challans by customer
  getByCustomer: async (customerId, params = {}) => {
    return salesChallanAPI.getAll({ customer: customerId, ...params });
  },

  // Get challans by status
  getByStatus: async (status, params = {}) => {
    return salesChallanAPI.getAll({ status, ...params });
  },

  // Update delivery status — valid values: Prepared | Dispatched | Delivered | Cancelled
  updateStatus: async (id, status, notes) => {
    return apiRequest(`/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  // Track challan (real-time tracking)
  track: async (challanNumber) => {
    return apiRequest(`/track/${challanNumber}`);
  },

  // Get challan statistics
  getStats: async () => {
    return apiRequest("/stats");
  },

  // Get active deliveries (dispatched)
  getActiveDeliveries: async () => {
    return salesChallanAPI.getByStatus("Dispatched");
  },

  // Download PDF for a single challan
  downloadPDF: async (id, challanNumber = "Challan", customerName = "") => {
    try {
      console.log("📥 Downloading PDF for challan:", id);

      const token = await AsyncStorage.getItem("authToken");
      const pdfUrl = `${API_BASE_URL}/sales-challans/${id}/pdf/download`;
      const safeCust = customerName
        ? customerName.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").slice(0, 40)
        : "";
      const filename = safeCust
        ? `Sales_Challan_${safeCust}_${challanNumber}.pdf`
        : `Sales_Challan_${challanNumber}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download the PDF file with auth token
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download PDF");
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          message: "Sharing is not available on this device",
          fileUri: downloadResult.uri,
        };
      }

      // Share/open the PDF
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: "application/pdf",
        dialogTitle: `Sales Challan - ${challanNumber}`,
      });

      return {
        success: true,
        message: "PDF downloaded successfully",
        fileUri: downloadResult.uri,
      };
    } catch (error) {
      console.error("❌ Error downloading PDF:", error);
      throw error;
    }
  },

  // Download consolidated PDF for SO (all challans)
  downloadConsolidatedPDF: async (soId, soNumber = "SO", customerName = "") => {
    try {
      console.log("📥 Downloading consolidated PDF for SO:", soId);

      const token = await AsyncStorage.getItem("authToken");
      const pdfUrl = `${API_BASE_URL}/sales-challans/so/${soId}/pdf/download`;
      const safeCust = customerName
        ? customerName.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").slice(0, 40)
        : "";
      const filename = safeCust
        ? `Consolidated_${safeCust}_${soNumber}.pdf`
        : `Consolidated_${soNumber}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download the PDF file with auth token
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download consolidated PDF");
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          message: "Sharing is not available on this device",
          fileUri: downloadResult.uri,
        };
      }

      // Share/open the PDF
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: "application/pdf",
        dialogTitle: `Consolidated Challan - ${soNumber}`,
      });

      return {
        success: true,
        message: "Consolidated PDF downloaded successfully",
        fileUri: downloadResult.uri,
      };
    } catch (error) {
      console.error("❌ Error downloading consolidated PDF:", error);
      throw error;
    }
  },
};

// ============ UTILITY FUNCTIONS ============
export const challanFormatters = {
  // Format challan number
  challanNumber: (number) => {
    return number || "N/A";
  },

  // Format challan status — matches server enum: Prepared | Dispatched | Delivered | Cancelled
  status: (status) => {
    const statusMap = {
      Prepared:  { label: "Prepared",  color: "#F59E0B", icon: "📝" },
      Dispatched:{ label: "Dispatched",color: "#3B82F6", icon: "🚚" },
      Delivered: { label: "Delivered", color: "#10B981", icon: "✅" },
      Cancelled: { label: "Cancelled", color: "#EF4444", icon: "❌" },
    };
    return statusMap[status] || { label: status, color: "#6B7280", icon: "📦" };
  },

  // Format vehicle number
  vehicleNumber: (number) => {
    if (!number) return "N/A";
    return number.toUpperCase();
  },

  // Format driver info
  driverInfo: (driver) => {
    if (!driver) return "N/A";
    const { name, phone } = driver;
    return name && phone ? `${name} (${phone})` : name || phone || "N/A";
  },

  // Calculate delivery time
  deliveryTime: (dispatchDate, deliveryDate) => {
    if (!dispatchDate || !deliveryDate) return "N/A";
    const dispatch = new Date(dispatchDate);
    const delivery = new Date(deliveryDate);
    const diffInHours = Math.floor((delivery - dispatch) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? "s" : ""}`;
    }
  },

  // Format destination
  destination: (address) => {
    if (!address) return "N/A";
    const { city, state } = address;
    return [city, state].filter(Boolean).join(", ") || "N/A";
  },
};

export default salesChallanAPI;
