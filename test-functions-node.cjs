// Test deployed edge functions with curl equivalent 
const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testFunction(functionName, testData = {}) {
  const url = `https://jzzbmoopwnvgxxirulga.supabase.co/functions/v1/${functionName}`;
  
  console.log(`🧪 Testing ${functionName}...`);
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDMxMjUsImV4cCI6MjA3NDc3OTEyNX0.5DqetNG0bvN620X8t5QP-sGEInb17ZCgY0Jfp7_qZWU'
      },
      body: JSON.stringify(testData)
    });

    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`   ✅ ${functionName} is working correctly`);
      console.log(`   Response: ${response.body.substring(0, 100)}...`);
    } else if (response.status === 400 || response.status === 422) {
      console.log(`   ⚠️ ${functionName} is working (validation error expected)`);
      console.log(`   Response: ${response.body.substring(0, 200)}`);
    } else if (response.status === 404) {
      console.log(`   ❌ ${functionName} is not deployed`);
    } else {
      console.log(`   ❌ ${functionName} returned unexpected status`);
      console.log(`   Response: ${response.body.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
  }
  console.log('');
}

async function main() {
  console.log('🚀 Testing Edge Functions Status...\n');
  
  // Test critical functions
  await testFunction('pi-auth', { accessToken: 'test_token' });
  await testFunction('pi-payment-approve', { paymentId: 'test_payment' });
  await testFunction('pi-payment-complete', { paymentId: 'test_payment' });
  await testFunction('subscription', { plan: 'premium' });
  
  console.log('✅ Test complete!');
  console.log('Functions returning 400/422 are working (expected validation errors)');
  console.log('Functions returning 404 need to be deployed');
}

main().catch(console.error);