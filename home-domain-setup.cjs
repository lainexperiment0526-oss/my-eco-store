#!/usr/bin/env node

const StellarSDK = require("@stellar/stellar-sdk");

// Pi Mainnet Configuration
const server = new StellarSDK.Horizon.Server("https://api.minepi.com");
const NETWORK_PASSPHRASE = "Pi Mainnet";

// Configuration
const HOME_DOMAIN = "droplink.space";

async function setHomeDomain(issuerSecret) {
  try {
    console.log("🌐 Setting Home Domain for DROP Token");
    console.log("=====================================");

    if (!issuerSecret) {
      throw new Error("Please provide ISSUER_SECRET as argument or environment variable");
    }

    // Create keypair from secret
    const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
    
    console.log(`📝 Issuer Public Key: ${issuerKeypair.publicKey()}`);
    console.log(`🌐 Home Domain: ${HOME_DOMAIN}`);

    // Load issuer account
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    
    // Check current home domain
    if (issuerAccount.home_domain) {
      console.log(`📋 Current Home Domain: ${issuerAccount.home_domain}`);
      
      if (issuerAccount.home_domain === HOME_DOMAIN) {
        console.log("✅ Home domain already correctly set!");
        return;
      }
    }

    // Get base fee
    const response = await server.ledgers().order("desc").limit(1).call();
    const baseFee = response.records[0].base_fee_in_stroops;

    // Create set options transaction
    const setOptionsTransaction = new StellarSDK.TransactionBuilder(issuerAccount, {
      fee: baseFee,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: await server.fetchTimebounds(90),
    })
      .addOperation(StellarSDK.Operation.setOptions({ 
        homeDomain: HOME_DOMAIN 
      }))
      .build();

    setOptionsTransaction.sign(issuerKeypair);

    // Submit transaction
    const result = await server.submitTransaction(setOptionsTransaction);
    
    console.log("✅ Home domain set successfully!");
    console.log(`   Transaction Hash: ${result.hash}`);
    console.log(`   TOML URL: https://${HOME_DOMAIN}/.well-known/pi.toml`);
    
    // Verify the change
    const updatedAccount = await server.loadAccount(issuerKeypair.publicKey());
    console.log(`📋 Updated Home Domain: ${updatedAccount.home_domain}`);
    
    console.log("\n🔗 Verification Links:");
    console.log(`   Account Info: https://api.minepi.com/accounts/${issuerKeypair.publicKey()}`);
    console.log(`   Token Info: https://api.minepi.com/assets?asset_code=DROP&asset_issuer=${issuerKeypair.publicKey()}`);

  } catch (error) {
    console.error("❌ Error setting home domain:", error.message);
    
    if (error.response && error.response.data) {
      console.error("📋 Error details:", JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Function to verify TOML file accessibility
async function verifyTomlFile() {
  try {
    console.log("🔍 Verifying TOML file accessibility");
    console.log("===================================");
    
    const tomlUrl = `https://${HOME_DOMAIN}/.well-known/pi.toml`;
    console.log(`📋 Checking: ${tomlUrl}`);
    
    // Note: In a real implementation, you would use fetch or axios to check this
    console.log("⚠️  Please manually verify that the TOML file is accessible at:");
    console.log(`   ${tomlUrl}`);
    console.log("\n📋 Required TOML content should include:");
    console.log("   - [[CURRENCIES]] section");
    console.log("   - code=\"DROP\"");
    console.log("   - issuer=\"SB4I6DX4Y6PS7SAJW2SFUQZP3DAW5HE7RBAKISOMTVACARMFCMRBH46I\"");
    console.log("   - name=\"MRWAIN ORGANIZATION\"");
    console.log("   - desc=\"Token description\"");
    console.log("   - image=\"https://i.ibb.co/HTfyRcwm/Untitled-design-8-1.png\"");
    
  } catch (error) {
    console.error("❌ Error verifying TOML file:", error.message);
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  const issuerSecret = process.argv[3] || process.env.ISSUER_SECRET;
  
  switch (command) {
    case 'set-domain':
      setHomeDomain(issuerSecret);
      break;
    case 'verify-toml':
      verifyTomlFile();
      break;
    default:
      console.log("Usage:");
      console.log("  node home-domain-setup.js set-domain <issuer_secret>");
      console.log("  node home-domain-setup.js verify-toml");
      console.log("");
      console.log("Environment variable option:");
      console.log("  ISSUER_SECRET=<your_secret> node home-domain-setup.js set-domain");
  }
}

module.exports = {
  setHomeDomain,
  verifyTomlFile,
  HOME_DOMAIN
};