// ============================================
// BACKEND CORS SETUP (Node.js/Express)
// ============================================
// Add this to your Node.js backend server
// to enable CORS for web testing
// ============================================

const express = require('express');
const cors = require('cors'); // npm install cors

const app = express();

// ============================================
// OPTION 1: Enable CORS for all origins (Development)
// ============================================
app.use(cors());

// ============================================
// OPTION 2: Enable CORS for specific origins (Recommended)
// ============================================
app.use(cors({
  origin: [
    'http://localhost:8081',   // Expo web default
    'http://localhost:8082',   // Expo web alternate
    'http://localhost:19006',  // Expo web
    'http://localhost:19000',  // Expo DevTools
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// Your other middleware
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Your routes
// ============================================
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/sales-challan', salesChallanRoutes);

// ============================================
// Start server
// ============================================
const PORT = process.env.PORT || 3050;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for web development`);
});

// ============================================
// INSTALLATION INSTRUCTIONS
// ============================================
/*

1. Install CORS package in your backend:
   cd path/to/your/backend
   npm install cors

2. Add the code above to your server.js or app.js

3. Restart your backend server:
   npm start

4. Test CORS is working:
   curl -H "Origin: http://localhost:8082" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        http://localhost:3050/api/dashboard/stats

5. You should see CORS headers in the response

*/
