// Mobile Connection Test Utility
// Run: node test-mobile-connection.js

const http = require('http');
const { execSync } = require('child_process');

const CONFIG = {
  IP: '192.168.205.1',
  PORT: 3050,
  ENDPOINTS: [
    '/api/dashboard/stats',
    '/api/health',
    '/'
  ]
};

console.log('🔍 MOBILE CONNECTION DIAGNOSTICS\n');
console.log('=' .repeat(50));

// Test 1: Check IP Address
console.log('\n📍 TEST 1: Checking IP Address');
try {
  const ipOutput = execSync('ipconfig', { encoding: 'utf8' });
  const ipMatches = [...ipOutput.matchAll(/IPv4 Address[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/g)];
  
  const validIPs = ipMatches
    .map(m => m[1])
    .filter(ip => !ip.startsWith('127.') && !ip.startsWith('169.254.'));
  
  console.log('✅ Available IP addresses:');
  validIPs.forEach(ip => {
    const isCurrent = ip === CONFIG.IP;
    console.log(`   ${isCurrent ? '→' : ' '} ${ip} ${isCurrent ? '(CONFIGURED)' : ''}`);
  });
  
  if (!validIPs.includes(CONFIG.IP)) {
    console.log(`\n⚠️  WARNING: Configured IP ${CONFIG.IP} not found!`);
    console.log(`💡 Update PHYSICAL_DEVICE_IP in services/common.js to one of:`);
    validIPs.forEach(ip => console.log(`   - ${ip}`));
  }
} catch (error) {
  console.log('❌ Could not detect IP address');
}

// Test 2: Check if backend is running
console.log('\n🔌 TEST 2: Checking Backend Server');
try {
  const portOutput = execSync(`netstat -ano | findstr :${CONFIG.PORT}`, { encoding: 'utf8' });
  if (portOutput.includes('LISTENING')) {
    console.log(`✅ Backend is running on port ${CONFIG.PORT}`);
    
    // Extract PID
    const pidMatch = portOutput.match(/LISTENING\s+(\d+)/);
    if (pidMatch) {
      console.log(`   Process ID: ${pidMatch[1]}`);
    }
  } else {
    console.log(`❌ Backend not running on port ${CONFIG.PORT}`);
  }
} catch (error) {
  console.log(`❌ Backend not running on port ${CONFIG.PORT}`);
  console.log('💡 Start your backend server first!');
}

// Test 3: Check Windows Firewall
console.log('\n🔥 TEST 3: Checking Windows Firewall');
try {
  const firewallOutput = execSync(`netsh advfirewall firewall show rule name="Node.js Port ${CONFIG.PORT}"`, { 
    encoding: 'utf8' 
  });
  
  if (firewallOutput.includes('Rule Name')) {
    console.log(`✅ Firewall rule exists for port ${CONFIG.PORT}`);
    
    if (firewallOutput.includes('Enabled:                              Yes')) {
      console.log('   Status: Enabled');
    } else {
      console.log('   ⚠️  Status: Disabled');
    }
  }
} catch (error) {
  console.log(`❌ No firewall rule found for port ${CONFIG.PORT}`);
  console.log('\n💡 FIX: Run as Administrator:');
  console.log(`   netsh advfirewall firewall add rule name="Node.js Port ${CONFIG.PORT}" dir=in action=allow protocol=TCP localport=${CONFIG.PORT}`);
}

// Test 4: Test HTTP Connections
console.log('\n🌐 TEST 4: Testing HTTP Connections');

const testConnection = (host, port, path) => {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data.substring(0, 100)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timeout'
      });
    });

    req.end();
  });
};

const runTests = async () => {
  // Test localhost
  console.log('\n   Testing localhost connections:');
  for (const endpoint of CONFIG.ENDPOINTS) {
    const result = await testConnection('localhost', CONFIG.PORT, endpoint);
    if (result.success) {
      console.log(`   ✅ localhost:${CONFIG.PORT}${endpoint} - HTTP ${result.status}`);
    } else {
      console.log(`   ❌ localhost:${CONFIG.PORT}${endpoint} - ${result.error}`);
    }
  }

  // Test network IP
  console.log(`\n   Testing network IP (${CONFIG.IP}) connections:`);
  for (const endpoint of CONFIG.ENDPOINTS) {
    const result = await testConnection(CONFIG.IP, CONFIG.PORT, endpoint);
    if (result.success) {
      console.log(`   ✅ ${CONFIG.IP}:${CONFIG.PORT}${endpoint} - HTTP ${result.status}`);
    } else {
      console.log(`   ❌ ${CONFIG.IP}:${CONFIG.PORT}${endpoint} - ${result.error}`);
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY & RECOMMENDATIONS\n');

  const testUrl = `http://${CONFIG.IP}:${CONFIG.PORT}/api/dashboard/stats`;
  
  console.log('🎯 Next Steps:');
  console.log('\n1. Test from your phone\'s browser:');
  console.log(`   ${testUrl}`);
  console.log('\n2. If phone browser works, restart Expo:');
  console.log('   npx expo start --clear');
  console.log('\n3. If phone browser fails:');
  console.log('   - Add firewall rule (see above)');
  console.log('   - Ensure phone and computer on same WiFi');
  console.log('   - Check backend is listening on 0.0.0.0');

  console.log('\n📱 Mobile App Configuration:');
  console.log(`   IP: ${CONFIG.IP}`);
  console.log(`   Port: ${CONFIG.PORT}`);
  console.log(`   Full URL: http://${CONFIG.IP}:${CONFIG.PORT}/api`);

  console.log('\n✅ Configuration File:');
  console.log('   File: services/common.js');
  console.log(`   PHYSICAL_DEVICE_IP = "${CONFIG.IP}"`);
  console.log(`   BACKEND_PORT = ${CONFIG.PORT}`);
  
  console.log('\n' + '='.repeat(50));
};

runTests().catch(console.error);
