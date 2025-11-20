/**
 * Script to Delete Duplicate Sales Order
 * 
 * This script will find and delete the sales order with soNumber "PKRK/SO/15"
 * that is causing the duplicate key error.
 * 
 * Run this script: node delete-duplicate-order.js
 */

const API_BASE_URL = 'https://yarnflow-production.up.railway.app/api';

async function deleteDuplicateOrder() {
  try {
    console.log('🔍 Finding sales order with soNumber: PKRK/SO/15...');
    
    // Get all sales orders
    const response = await fetch(`${API_BASE_URL}/sales-orders?limit=100`);
    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ Failed to fetch sales orders:', data.message);
      return;
    }
    
    // Find the order with soNumber "PKRK/SO/15"
    const duplicateOrder = data.data.find(order => order.soNumber === 'PKRK/SO/15');
    
    if (!duplicateOrder) {
      console.log('✅ No duplicate order found. The issue might be resolved!');
      return;
    }
    
    console.log('📋 Found duplicate order:');
    console.log(`   ID: ${duplicateOrder._id}`);
    console.log(`   SO Number: ${duplicateOrder.soNumber}`);
    console.log(`   Customer: ${duplicateOrder.customer?.companyName || 'Unknown'}`);
    console.log(`   Status: ${duplicateOrder.status}`);
    console.log(`   Created: ${new Date(duplicateOrder.createdAt).toLocaleString()}`);
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete the order!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete the order
    console.log('🗑️  Deleting order...');
    const deleteResponse = await fetch(`${API_BASE_URL}/sales-orders/${duplicateOrder._id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const deleteData = await deleteResponse.json();
    
    if (deleteData.success) {
      console.log('✅ Successfully deleted duplicate order!');
      console.log('   You can now create new sales orders.');
      console.log('   Next SO number will be: PKRK/SO/16');
    } else {
      console.error('❌ Failed to delete order:', deleteData.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
deleteDuplicateOrder();
