/**
 * FIXED generateSONumber Method for Sales Order Schema
 * 
 * Replace the existing generateSONumber method in your schema with this:
 */

// ❌ BROKEN CODE (Current)
salesOrderSchema.statics.generateSONumber = async function() {
  // Count total SOs to get next number
  const count = await this.countDocuments({});
  
  // Generate SO number: PKRK/SO/01, PKRK/SO/02, etc.
  return `PKRK/SO/${String(count + 1).padStart(2, '0')}`;
};

// Problem: If you have 14 orders but one was deleted, count = 14
// It generates PKRK/SO/15, but PKRK/SO/15 might already exist!


// ✅ FIXED CODE (Use this)
salesOrderSchema.statics.generateSONumber = async function() {
  // Find the last sales order by sorting by soNumber descending
  const lastOrder = await this.findOne({})
    .sort({ soNumber: -1 })
    .select('soNumber')
    .lean();
  
  if (!lastOrder || !lastOrder.soNumber) {
    // First order
    return 'PKRK/SO/01';
  }
  
  // Extract number from "PKRK/SO/15" -> 15
  const parts = lastOrder.soNumber.split('/');
  const lastNumber = parseInt(parts[parts.length - 1]);
  
  // Increment: 15 + 1 = 16
  const newNumber = lastNumber + 1;
  
  // Return: "PKRK/SO/16" with padding
  return `PKRK/SO/${String(newNumber).padStart(2, '0')}`;
};

// This works correctly even if orders are deleted!
// Example:
// Last order: PKRK/SO/15
// Next order: PKRK/SO/16 ✅


// Alternative: Even more robust with retry logic
salesOrderSchema.statics.generateSONumber = async function() {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Find the last sales order
    const lastOrder = await this.findOne({})
      .sort({ soNumber: -1 })
      .select('soNumber')
      .lean();
    
    let newNumber;
    if (!lastOrder || !lastOrder.soNumber) {
      newNumber = 1;
    } else {
      const parts = lastOrder.soNumber.split('/');
      const lastNumber = parseInt(parts[parts.length - 1]);
      newNumber = lastNumber + 1;
    }
    
    const soNumber = `PKRK/SO/${String(newNumber).padStart(2, '0')}`;
    
    // Check if this number already exists
    const exists = await this.findOne({ soNumber }).lean();
    
    if (!exists) {
      return soNumber;
    }
    
    // If exists, try next number
    attempts++;
    console.log(`⚠️ SO Number ${soNumber} already exists, trying next...`);
  }
  
  throw new Error('Failed to generate unique SO number after multiple attempts');
};
