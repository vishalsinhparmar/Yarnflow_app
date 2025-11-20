// TypeScript declarations for YarnFlow API services

export const API_BASE_URL: string;
export function apiRequest(endpoint: string, options?: any): Promise<any>;

// Dashboard API
export const dashboardAPI: {
  getStats: (retryCount?: number) => Promise<any>;
  getRealtimeMetrics: (retryCount?: number) => Promise<any>;
  getConfig: () => any;
};

export const dashboardUtils: {
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  getRelativeTime: (timestamp: string | Date) => string;
  getActivityStatusColor: (status: string) => string;
  getTrendIcon: (trend: string) => string;
  getTrendColor: (trend: string) => string;
};

export function handleDashboardError(error: any, fallbackMessage?: string): string;

// Master Data API
export const masterDataAPI: any;
export const customerAPI: any;
export const supplierAPI: any;
export const categoryAPI: any;
export const productAPI: any;
export function getMasterDataStats(): Promise<any>;
export function getDropdownOptions(): Promise<any>;
export const formatters: any;
export function handleAPIError(error: any, defaultMessage?: string): string;

// Purchase Order API
export const purchaseOrderAPI: any;
export const poFormatters: any;

// GRN API
export const grnAPI: any;
export const grnFormatters: any;

// Inventory API
export const inventoryAPI: any;
export const inventoryFormatters: any;

// Sales Order API
export const salesOrderAPI: any;
export const soFormatters: any;

// Sales Challan API
export const salesChallanAPI: any;
export const challanFormatters: any;
