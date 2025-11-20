// Production Setup Helper
// Run: node setup-production.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   React Native Production Setup Helper            ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const updateAppJson = (apiUrl) => {
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  appJson.expo.extra = appJson.expo.extra || {};
  appJson.expo.extra.apiUrl = apiUrl;
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Updated app.json');
};

const main = async () => {
  console.log('Choose your setup approach:\n');
  console.log('1. Quick Fix - Clear Metro cache (Local IP)');
  console.log('2. Ngrok - Tunnel to local backend (Recommended for dev)');
  console.log('3. Production URL - Use deployed backend');
  console.log('4. Auto-detect - Use local IP (default)\n');

  const choice = await question('Enter your choice (1-4): ');

  switch (choice.trim()) {
    case '1':
      console.log('\n📦 Quick Fix - Clear Metro Cache\n');
      console.log('Your configuration is already correct!');
      console.log('The issue is Metro bundler cache.\n');
      console.log('Run these commands:\n');
      console.log('  1. Press Ctrl+C to stop Expo');
      console.log('  2. Run: npx expo start --clear\n');
      console.log('If still not working, also add firewall rule:');
      console.log('  - Right-click ADD_FIREWALL_RULE.bat');
      console.log('  - Run as Administrator\n');
      updateAppJson(null); // Use auto-detection
      break;

    case '2':
      console.log('\n🌐 Ngrok Setup\n');
      console.log('Steps to use ngrok:\n');
      console.log('1. Install ngrok:');
      console.log('   npm install -g ngrok\n');
      console.log('2. Start ngrok (in a new terminal):');
      console.log('   ngrok http 3050\n');
      console.log('3. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)\n');
      
      const ngrokUrl = await question('Enter your ngrok URL (or press Enter to skip): ');
      
      if (ngrokUrl.trim()) {
        const apiUrl = ngrokUrl.trim().replace(/\/$/, '') + '/api';
        updateAppJson(apiUrl);
        console.log(`\n✅ Configured to use: ${apiUrl}`);
        console.log('\nNow run: npx expo start --clear\n');
      } else {
        console.log('\nSkipped. Run this script again when you have the ngrok URL.\n');
      }
      break;

    case '3':
      console.log('\n🚀 Production URL Setup\n');
      console.log('Enter your production backend URL');
      console.log('Examples:');
      console.log('  - https://your-app.railway.app');
      console.log('  - https://your-app.onrender.com');
      console.log('  - https://api.yourdomain.com\n');
      
      const prodUrl = await question('Enter production URL: ');
      
      if (prodUrl.trim()) {
        const apiUrl = prodUrl.trim().replace(/\/$/, '') + '/api';
        updateAppJson(apiUrl);
        console.log(`\n✅ Configured to use: ${apiUrl}`);
        console.log('\nNow run: npx expo start --clear\n');
      } else {
        console.log('\nNo URL provided. Cancelled.\n');
      }
      break;

    case '4':
    default:
      console.log('\n🔧 Auto-detect Mode\n');
      console.log('Using local IP address: 192.168.205.1:3050');
      console.log('\nRequirements:');
      console.log('  ✅ Backend running on port 3050');
      console.log('  ✅ Phone and computer on same WiFi');
      console.log('  ⚠️  Firewall rule needed (run ADD_FIREWALL_RULE.bat)\n');
      updateAppJson(null); // Use auto-detection
      console.log('Run: npx expo start --clear\n');
      break;
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('📚 Additional Resources:\n');
  console.log('• PRODUCTION_SOLUTION.md - Detailed guide');
  console.log('• QUICK_FIX_STEPS.md - Quick troubleshooting');
  console.log('• test-mobile-connection.js - Test your setup');
  console.log('═══════════════════════════════════════════════════\n');

  rl.close();
};

main().catch(console.error);
