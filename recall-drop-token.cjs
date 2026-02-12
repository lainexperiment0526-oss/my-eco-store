/**
 * DROP Token Recall Utility
 * Implements token recall functionality for Pi Network
 * Based on Pi Platform documentation: https://github.com/pi-apps/pi-platform-docs/blob/master/tokens.md
 */

const StellarSDK = require('@stellar/stellar-sdk');

// Pi Mainnet Configuration
const server = new StellarSDK.Horizon.Server('https://api.mainnet.minepi.com');
const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

// DROP Token Configuration
const DROP_TOKEN = {
  code: "DROP",
  issuer: "GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI",
  distributor: "GCTPMH43NGN7E4IXLQ27H2XWGGWWDY3I6UAPBFXYQSEUPEKNQE2BZXC2"
};

console.log('🔄 DROP Token Recall Utility');
console.log('============================');
console.log(`Token Code: ${DROP_TOKEN.code}`);
console.log(`Issuer: ${DROP_TOKEN.issuer}`);
console.log(`Distributor: ${DROP_TOKEN.distributor}`);
console.log('');

/**
 * Check current DROP token status
 */
async function checkTokenStatus() {
  console.log('📊 Checking Current Token Status...');
  console.log('-----------------------------------');
  
  try {
    // Check issuer account
    const issuerAccount = await server.loadAccount(DROP_TOKEN.issuer);
    console.log('✅ Issuer Account Status: Active');
    console.log(`   Sequence: ${issuerAccount.sequence}`);
    console.log(`   Home Domain: ${issuerAccount.home_domain || 'Not set'}`);
    
    // Check if token is authorized
    const authFlags = issuerAccount.flags;
    console.log(`   Authorization Required: ${authFlags.auth_required || false}`);
    console.log(`   Authorization Revocable: ${authFlags.auth_revocable || false}`);
    
    // Check distributor account
    const distributorAccount = await server.loadAccount(DROP_TOKEN.distributor);
    console.log('\n✅ Distributor Account Status: Active');
    console.log(`   Sequence: ${distributorAccount.sequence}`);
    
    // Check distributor's DROP balance
    const dropBalance = distributorAccount.balances.find(balance => 
      balance.asset_code === DROP_TOKEN.code && 
      balance.asset_issuer === DROP_TOKEN.issuer
    );
    
    if (dropBalance) {
      console.log(`   DROP Balance: ${dropBalance.balance}`);
      console.log(`   Is Authorized: ${dropBalance.is_authorized !== false}`);
    } else {
      console.log('   No DROP trustline found');
    }
    
    // Check token on blockchain
    const assetResponse = await fetch(
      `https://api.mainnet.minepi.com/assets?asset_code=${DROP_TOKEN.code}&asset_issuer=${DROP_TOKEN.issuer}`
    );
    
    if (assetResponse.ok) {
      const assetData = await assetResponse.json();
      if (assetData._embedded?.records?.length > 0) {
        const token = assetData._embedded.records[0];
        console.log('\n📈 Token Statistics:');
        console.log(`   Total Supply: ${token.amount}`);
        console.log(`   Authorized Accounts: ${token.accounts.authorized}`);
        console.log(`   Total Accounts: ${token.accounts.authorized + token.accounts.unauthorized}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking token status:', error.message);
    return false;
  }
}

/**
 * Recall tokens from specific account
 */
async function recallTokensFromAccount(accountAddress, amount, issuerSecret) {
  if (!issuerSecret) {
    console.error('❌ Issuer secret key required for token recall');
    return false;
  }
  
  try {
    console.log(`\n🔄 Recalling ${amount} DROP tokens from ${accountAddress}...`);
    
    const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    
    // Get base fee
    const response = await server.ledgers().order('desc').limit(1).call();
    const baseFee = response.records[0].base_fee_in_stroops;
    
    // Create DROP asset
    const dropAsset = new StellarSDK.Asset(DROP_TOKEN.code, DROP_TOKEN.issuer);
    
    // Build transaction to recall tokens
    const transaction = new StellarSDK.TransactionBuilder(issuerAccount, {
      fee: baseFee,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: await server.fetchTimebounds(90),
    })
    // Revoke authorization for the account
    .addOperation(StellarSDK.Operation.allowTrust({
      trustor: accountAddress,
      assetCode: DROP_TOKEN.code,
      authorize: false // Revoke authorization
    }))
    // Recall the tokens by setting account balance to 0
    .addOperation(StellarSDK.Operation.clawback({
      asset: dropAsset,
      from: accountAddress,
      amount: amount
    }))
    .build();
    
    transaction.sign(issuerKeypair);
    
    const result = await server.submitTransaction(transaction);
    console.log('✅ Token recall successful!');
    console.log(`   Transaction Hash: ${result.hash}`);
    console.log(`   Recalled ${amount} DROP from ${accountAddress}`);
    
    return true;
  } catch (error) {
    console.error('❌ Token recall failed:', error.message);
    return false;
  }
}

/**
 * Enable authorization required for token
 */
async function enableAuthorizationRequired(issuerSecret) {
  if (!issuerSecret) {
    console.error('❌ Issuer secret key required');
    return false;
  }
  
  try {
    console.log('\n🔐 Enabling Authorization Required for DROP token...');
    
    const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    
    // Get base fee
    const response = await server.ledgers().order('desc').limit(1).call();
    const baseFee = response.records[0].base_fee_in_stroops;
    
    // Build transaction to set authorization flags
    const transaction = new StellarSDK.TransactionBuilder(issuerAccount, {
      fee: baseFee,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: await server.fetchTimebounds(90),
    })
    .addOperation(StellarSDK.Operation.setOptions({
      setFlags: StellarSDK.AuthRevocableFlag | StellarSDK.AuthRequiredFlag
    }))
    .build();
    
    transaction.sign(issuerKeypair);
    
    const result = await server.submitTransaction(transaction);
    console.log('✅ Authorization flags set successfully!');
    console.log(`   Transaction Hash: ${result.hash}`);
    console.log('   DROP token now requires authorization for new trustlines');
    console.log('   Existing tokens can be recalled if needed');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to set authorization flags:', error.message);
    return false;
  }
}

/**
 * Freeze all DROP tokens (emergency recall)
 */
async function emergencyFreezeAllTokens(issuerSecret) {
  if (!issuerSecret) {
    console.error('❌ Issuer secret key required');
    return false;
  }
  
  try {
    console.log('\n🚨 EMERGENCY: Freezing all DROP tokens...');
    console.log('This will disable all existing DROP trustlines!');
    
    // Get all accounts with DROP trustlines
    const assetResponse = await fetch(
      `https://api.mainnet.minepi.com/assets?asset_code=${DROP_TOKEN.code}&asset_issuer=${DROP_TOKEN.issuer}`
    );
    
    if (!assetResponse.ok) {
      throw new Error('Failed to fetch asset data');
    }
    
    const assetData = await assetResponse.json();
    const token = assetData._embedded?.records?.[0];
    
    if (!token) {
      throw new Error('DROP token not found');
    }
    
    // Get accounts holding the token
    const holdersResponse = await fetch(
      `https://api.mainnet.minepi.com/assets/${token.asset_type}/${token.asset_code}/${token.asset_issuer}/accounts`
    );
    
    if (holdersResponse.ok) {
      const holdersData = await holdersResponse.json();
      const holders = holdersData._embedded?.records || [];
      
      console.log(`Found ${holders.length} accounts with DROP tokens`);
      
      const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
      
      // Revoke authorization for all accounts
      for (const holder of holders) {
        try {
          await recallTokensFromAccount(holder.account_id, holder.balance, issuerSecret);
          console.log(`✅ Recalled tokens from ${holder.account_id}`);
        } catch (error) {
          console.error(`❌ Failed to recall from ${holder.account_id}: ${error.message}`);
        }
      }
      
      console.log('🔒 Emergency freeze completed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Emergency freeze failed:', error.message);
    return false;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log('📖 DROP Token Recall Commands:');
  console.log('==============================');
  console.log('');
  console.log('Check token status:');
  console.log('  node recall-drop-token.cjs status');
  console.log('');
  console.log('Enable authorization required (setup for recalls):');
  console.log('  node recall-drop-token.cjs enable-auth [ISSUER_SECRET_KEY]');
  console.log('');
  console.log('Recall tokens from specific account:');
  console.log('  node recall-drop-token.cjs recall [ACCOUNT_ADDRESS] [AMOUNT] [ISSUER_SECRET_KEY]');
  console.log('');
  console.log('Emergency freeze all tokens:');
  console.log('  node recall-drop-token.cjs emergency-freeze [ISSUER_SECRET_KEY]');
  console.log('');
  console.log('⚠️  IMPORTANT NOTES:');
  console.log('- Token recall requires AUTH_REVOCABLE flag to be set');
  console.log('- Only the token issuer can recall tokens');
  console.log('- Emergency freeze affects ALL token holders');
  console.log('- These operations are irreversible');
  console.log('- Always test on testnet first');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'status':
      await checkTokenStatus();
      break;
      
    case 'enable-auth':
      const issuerSecret1 = args[1];
      if (!issuerSecret1) {
        console.error('❌ Issuer secret key required');
        console.log('Usage: node recall-drop-token.cjs enable-auth [ISSUER_SECRET_KEY]');
        break;
      }
      await enableAuthorizationRequired(issuerSecret1);
      break;
      
    case 'recall':
      const accountAddress = args[1];
      const amount = args[2];
      const issuerSecret2 = args[3];
      
      if (!accountAddress || !amount || !issuerSecret2) {
        console.error('❌ Missing required parameters');
        console.log('Usage: node recall-drop-token.cjs recall [ACCOUNT_ADDRESS] [AMOUNT] [ISSUER_SECRET_KEY]');
        break;
      }
      
      await recallTokensFromAccount(accountAddress, amount, issuerSecret2);
      break;
      
    case 'emergency-freeze':
      const issuerSecret3 = args[1];
      if (!issuerSecret3) {
        console.error('❌ Issuer secret key required');
        console.log('Usage: node recall-drop-token.cjs emergency-freeze [ISSUER_SECRET_KEY]');
        break;
      }
      
      console.log('⚠️  WARNING: This will freeze ALL DROP tokens!');
      console.log('Type "CONFIRM" to proceed:');
      
      // Wait for user confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', async (answer) => {
        if (answer === 'CONFIRM') {
          await emergencyFreezeAllTokens(issuerSecret3);
        } else {
          console.log('❌ Emergency freeze cancelled');
        }
        rl.close();
      });
      break;
      
    default:
      showHelp();
      break;
  }
}

main().catch(console.error);