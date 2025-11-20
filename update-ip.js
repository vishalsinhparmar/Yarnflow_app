// Automatic IP Address Updater for React Native
// Run this script when your IP changes: node update-ip.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Detecting current IP address...');

try {
  // Get current IP address
  const ipOutput = execSync('ipconfig', { encoding: 'utf8' });
  
  // Look for IPv4 addresses (prioritize WiFi adapter)
  const ipMatches = [...ipOutput.matchAll(/IPv4 Address[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/g)];
  
  if (ipMatches.length === 0) {
    console.log('❌ No IPv4 addresses found');
    process.exit(1);
  }
  
  // Filter out localhost and common internal IPs
  const validIPs = ipMatches
    .map(match => match[1])
    .filter(ip => !ip.startsWith('127.') && !ip.startsWith('169.254.'));
  
  if (validIPs.length === 0) {
    console.log('❌ No valid network IP addresses found');
    process.exit(1);
  }
  
  // Use the first valid IP (usually the main network adapter)
  const currentIP = validIPs[0];
  console.log(`✅ Current IP detected: ${currentIP}`);
  
  // Show all detected IPs for reference
  if (validIPs.length > 1) {
    console.log(`📋 All detected IPs: ${validIPs.join(', ')}`);
  }
  
  // Read current common.js file
  const commonPath = path.join(__dirname, 'services', 'common.js');
  
  if (!fs.existsSync(commonPath)) {
    console.log(`❌ File not found: ${commonPath}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(commonPath, 'utf8');
  
  // Extract current IP from file
  const currentIPMatch = content.match(/const PHYSICAL_DEVICE_IP = "([^"]*)"/);
  const oldIP = currentIPMatch ? currentIPMatch[1] : 'unknown';
  
  if (oldIP === currentIP) {
    console.log(`✅ IP address is already up to date: ${currentIP}`);
    console.log('🔄 Try restarting React Native: npx expo start --clear');
    process.exit(0);
  }
  
  console.log(`🔄 Updating IP from ${oldIP} to ${currentIP}`);
  
  // Update the IP address in the file
  content = content.replace(
    /const PHYSICAL_DEVICE_IP = "[^"]*"/,
    `const PHYSICAL_DEVICE_IP = "${currentIP}"`
  );
  
  // Write the updated content back
  fs.writeFileSync(commonPath, content);
  
  console.log('✅ Successfully updated services/common.js');
  console.log(`📱 Old IP: ${oldIP}`);
  console.log(`📱 New IP: ${currentIP}`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Restart React Native: npx expo start --clear');
  console.log('2. Make sure your backend is running');
  console.log(`3. Test backend: curl http://${currentIP}:3050/api/health`);
  
} catch (error) {
  console.error('❌ Error updating IP address:', error.message);
  console.log('');
  console.log('🔧 Manual steps:');
  console.log('1. Run "ipconfig" to get your IP');
  console.log('2. Update PHYSICAL_DEVICE_IP in services/common.js');
  console.log('3. Restart React Native with --clear');
}
