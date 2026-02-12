// Quick Edge Functions Test
const SUPABASE_URL = "https://kvqfnmdkxaclsnyuzkyp.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIwMzEyNSwiZXhwIjoyMDc0Nzc5MTI1fQ.BGsSUMxHQPHTNtrbKyPyRRx26CL2Qw3smDDOFYrjtTk";

async function testEdgeFunction(functionName, testData = {}) {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    
    console.log(`🧪 Testing ${functionName}...`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const status = response.status;
        const responseText = await response.text();
        
        console.log(`   Status: ${status}`);
        if (status === 200) {
            console.log(`   ✅ ${functionName} is responding correctly`);
        } else if (status === 400 || status === 422) {
            console.log(`   ⚠️ ${functionName} is working (expected validation error for test data)`);
        } else {
            console.log(`   ❌ ${functionName} may have issues`);
            console.log(`   Response: ${responseText.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ ${functionName} connection failed: ${error.message}`);
    }
    console.log('');
}

async function testAllFunctions() {
    console.log('🚀 Testing Edge Functions...\n');
    
    // Test key functions for payment flow
    await testEdgeFunction('pi-auth', { accessToken: 'test' });
    await testEdgeFunction('pi-payment-approve', { paymentId: 'test' });
    await testEdgeFunction('pi-payment-complete', { paymentId: 'test' });
    await testEdgeFunction('subscription', { plan: 'test' });
    
    console.log('✅ Edge Functions Test Complete!');
    console.log('If functions return 400/422 errors, they are working correctly');
    console.log('(Those are expected validation errors for test data)');
}

testAllFunctions().catch(console.error);