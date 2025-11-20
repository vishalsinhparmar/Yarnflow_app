// Quick Network Diagnostics for React Native Backend Connection
// Run: node diagnose.js

const { execSync } = require('child_process');

console.log('🔍 NETWORK DIAGNOSTICS - React Native Backend Connection\n');

// 1. Check current IP address
console.log('📍 STEP 1: Checking IP Address');
try {
  const ipOutput = execSync('ipconfig', { encoding: 'utf8' });
  const ipMatches = [...ipOutput.matchAll(/IPv4 Address[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/g)];
  
  if (ipMatches.length > 0) {
    console.log('✅ Found IP addresses:');
    ipMatches.forEach((match, index) => {
      const ip = match[1];
      if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
        console.log(`   ${index + 1}. ${ip} ${ip === '10.132.41.159' ? '← CURRENT CONFIG' : ''}`);
      }
    });
    
    const currentConfigIP = '10.132.41.159';
    const hasCurrentIP = ipMatches.some(match => match[1] === currentConfigIP);
    
    if (!hasCurrentIP) {
      console.log(`❌ WARNING: Current config IP (${currentConfigIP}) not found!`);
      console.log('💡 Update PHYSICAL_DEVICE_IP in services/common.js');
    }
  } else {
    console.log('❌ No IP addresses found');
  }
} catch (error) {
  console.log('❌ Could not get IP address:', error.message);
}

console.log('\n📡 STEP 2: Testing Backend Connectivity');

// 2. Test backend endpoints
const testEndpoints = async () => {
  const endpoints = [
    { url: 'http://localhost:3050/', name: 'Backend Root (localhost)' },
    { url: 'http://localhost:3050/api/health', name: 'Health Check (localhost)' },
    { url: 'http://10.132.41.159:3050/', name: 'Backend Root (network)' },
    { url: 'http://10.132.41.159:3050/api/health', name: 'Health Check (network)' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`);
      
      // Use curl for more reliable testing
      const result = execSync(`curl -s -w "HTTP_CODE:%{http_code}" "${endpoint.url}"`, { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      if (result.includes('HTTP_CODE:200')) {
        console.log(`✅ ${endpoint.name} - OK`);
      } else if (result.includes('HTTP_CODE:')) {
        const httpCode = result.match(/HTTP_CODE:(\d+)/)?.[1];
        console.log(`⚠️  ${endpoint.name} - HTTP ${httpCode}`);
      } else {
        console.log(`❌ ${endpoint.name} - No response`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Connection failed`);
    }
  }
};

// 3. Check Windows Firewall
console.log('\n🔥 STEP 3: Checking Windows Firewall');
try {
  const firewallResult = execSync('netsh advfirewall firewall show rule name="Node.js Port 3050"', { 
    encoding: 'utf8' 
  });
  
  if (firewallResult.includes('Rule Name')) {
    console.log('✅ Firewall rule exists for port 3050');
  } else {
    console.log('❌ No firewall rule found');
  }
} catch (error) {
  console.log('❌ No firewall rule found for port 3050');
  console.log('💡 Fix: Run as Administrator:');
  console.log('   netsh advfirewall firewall add rule name="Node.js Port 3050" dir=in action=allow protocol=TCP localport=3050');
}

// 4. Check if any process is using port 3050
console.log('\n🔌 STEP 4: Checking Port 3050 Usage');
try {
  const portResult = execSync('netstat -ano | findstr :3050', { encoding: 'utf8' });
  if (portResult.trim()) {
    console.log('✅ Port 3050 is in use (backend likely running)');
    console.log('   Active connections:');
    portResult.split('\n').forEach(line => {
      if (line.trim()) console.log(`   ${line.trim()}`);
    });
  } else {
    console.log('❌ Port 3050 is not in use (backend not running)');
  }
} catch (error) {
  console.log('❌ Port 3050 is not in use (backend not running)');
}

// Run async tests
testEndpoints().then(() => {
  console.log('\n🎯 DIAGNOSTIC SUMMARY:');
  console.log('=====================================');
  console.log('1. If IP address changed → Update services/common.js');
  console.log('2. If backend tests fail → Start your backend server');
  console.log('3. If firewall rule missing → Add firewall rule');
  console.log('4. If port not in use → Backend is not running');
  console.log('\n🚀 QUICK FIXES:');
  console.log('• Start backend: cd your-backend-folder && npm start');
  console.log('• Allow firewall: netsh advfirewall firewall add rule name="Node.js Port 3050" dir=in action=allow protocol=TCP localport=3050');
  console.log('• Update IP: Edit PHYSICAL_DEVICE_IP in services/common.js');
  console.log('• Restart React Native: npx expo start --clear');
});
