const StellarSDK = require('@stellar/stellar-sdk');

// Pi Mainnet Configuration
const server = new StellarSDK.Horizon.Server('https://api.mainnet.minepi.com');
const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

console.log('🔍 Detecting Pi Blockchain Connection...');
console.log('=====================================');

async function detectPiBlockchain() {
  try {
    // Test connection to Pi Mainnet
    console.log('📡 Connecting to Pi Mainnet...');
    const response = await server.ledgers().order('desc').limit(1).call();
    const latestLedger = response.records[0];
    
    console.log('✅ Pi Blockchain Connection Successful!');
    console.log(`📊 Latest Ledger: #${latestLedger.sequence}`);
    console.log(`⏰ Ledger Time: ${new Date(latestLedger.closed_at).toLocaleString()}`);
    console.log(`💰 Base Fee: ${latestLedger.base_fee_in_stroops} stroops`);
    console.log(`🔗 Network: Pi Mainnet`);
    console.log(`🌐 API Endpoint: https://api.mainnet.minepi.com`);
    console.log(`🏗️ Network Passphrase: ${NETWORK_PASSPHRASE}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Pi Blockchain:', error.message);
    return false;
  }
}

async function checkDropToken() {
  console.log('\n🪙 Checking DROP Token Status...');
  console.log('=================================');
  
  const issuer = 'GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI';
  const distributor = 'GCTPMH43NGN7E4IXLQ27H2XWGGWWDY3I6UAPBFXYQSEUPEKNQE2BZXC2';
  
  try {
    // Check if token exists
    console.log('🔍 Checking for DROP token...');
    const tokenResponse = await fetch(`https://api.mainnet.minepi.com/assets?asset_code=DROP&asset_issuer=${issuer}`);
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData._embedded && tokenData._embedded.records.length > 0) {
        const token = tokenData._embedded.records[0];
        console.log('✅ DROP Token Found!');
        console.log(`   Code: ${token.asset_code}`);
        console.log(`   Issuer: ${token.asset_issuer}`);
        console.log(`   Accounts: ${token.accounts.authorized}`);
        console.log(`   Amount: ${token.amount}`);
        console.log(`   TOML: ${token._links.toml.href || 'Not set'}`);
      } else {
        console.log('❌ DROP Token not found on Pi Network');
        console.log('   Token needs to be minted first');
      }
    }
    
    // Check issuer account
    console.log('\n👤 Checking Issuer Account...');
    const issuerResponse = await server.loadAccount(issuer);
    console.log('✅ Issuer Account Active');
    console.log(`   Sequence: ${issuerResponse.sequence}`);
    console.log(`   Home Domain: ${issuerResponse.home_domain || 'Not set'}`);
    
    // Check distributor account
    console.log('\n💼 Checking Distributor Account...');
    const distributorResponse = await server.loadAccount(distributor);
    console.log('✅ Distributor Account Active');
    console.log(`   Sequence: ${distributorResponse.sequence}`);
    
    // Check distributor balances
    console.log('\n💰 Distributor Balances:');
    distributorResponse.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        console.log(`   Pi: ${balance.balance}`);
      } else {
        console.log(`   ${balance.asset_code}: ${balance.balance}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking token status:', error.message);
  }
}

async function main() {
  const connected = await detectPiBlockchain();
  
  if (connected) {
    await checkDropToken();
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. If DROP token not found, run: node pi-token-setup.js setup');
    console.log('2. Deploy pi.toml to: https://droplink.space/.well-known/pi.toml');
    console.log('3. Verify token appears in Pi Wallet');
    console.log('4. Test token distribution');
  }
}

main();