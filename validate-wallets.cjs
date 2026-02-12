const StellarSDK = require('@stellar/stellar-sdk');

console.log('🔍 Validating Wallet Addresses...');
console.log('=================================');

// Your provided addresses (these appear to be secret keys, not public keys)
const issuerSecret = 'SB4I6DX4Y6PS7SAJW2SFUQZP3DAW5HE7RBAKISOMTVACARMFCMRBH46I';
const distributorSecret = 'SBS4OY37QMZ67U2WLWZQUUFUV2JOBKWCBFS7IZDOJV3NZPYC3OOZ4OIM';

try {
  // Validate and get public keys
  console.log('📝 Issuer Wallet:');
  if (issuerSecret.startsWith('S') && issuerSecret.length === 56) {
    try {
      const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
      console.log('✅ Valid secret key format');
      console.log(`📊 Public Key: ${issuerKeypair.publicKey()}`);
      console.log(`🔒 Secret Key: ${issuerSecret}`);
    } catch (e) {
      console.log(`❌ Invalid secret key: ${e.message}`);
    }
  } else {
    console.log('❌ Invalid format - should start with S and be 56 characters');
  }
  
  console.log('\n📝 Distributor Wallet:');
  if (distributorSecret.startsWith('S') && distributorSecret.length === 56) {
    try {
      const distributorKeypair = StellarSDK.Keypair.fromSecret(distributorSecret);
      console.log('✅ Valid secret key format');
      console.log(`📊 Public Key: ${distributorKeypair.publicKey()}`);
      console.log(`🔒 Secret Key: ${distributorSecret}`);
    } catch (e) {
      console.log(`❌ Invalid secret key: ${e.message}`);
    }
  } else {
    console.log('❌ Invalid format - should start with S and be 56 characters');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Fund both accounts with Test-Pi from the Pi Testnet faucet');
  console.log('2. Activate accounts on Pi Testnet');
  console.log('3. Run the DROP token setup script');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}