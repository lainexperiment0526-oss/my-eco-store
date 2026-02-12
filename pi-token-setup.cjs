const StellarSDK = require("@stellar/stellar-sdk");

// Pi Mainnet Configuration
const server = new StellarSDK.Horizon.Server("https://api.minepi.com");
const NETWORK_PASSPHRASE = "Pi Mainnet";

// Your wallet information
const ISSUER_SECRET = "SB4I6DX4Y6PS7SAJW2SFUQZP3DAW5HE7RBAKISOMTVACARMFCMRBH46I"; // Add your issuer private key here
const DISTRIBUTOR_SECRET = "SBS4OY37QMZ67U2WLWZQUUFUV2JOBKWCBFS7IZDOJV3NZPYC3OOZ4OIM"; // Add your distributor private key here

// Token configuration
const TOKEN_CODE = "DROP";
const TOKEN_AMOUNT = "100000000"; // 100 million tokens
const HOME_DOMAIN = "droplink.space";

async function setupDropToken() {
  try {
    console.log("🚀 Starting DROP Token Setup on Pi Mainnet");
    console.log("=====================================");

    // Validate that secrets are provided
    if (!ISSUER_SECRET || !DISTRIBUTOR_SECRET) {
      throw new Error("Please provide both ISSUER_SECRET and DISTRIBUTOR_SECRET");
    }

    // Create keypairs from secrets
    const issuerKeypair = StellarSDK.Keypair.fromSecret(ISSUER_SECRET);
    const distributorKeypair = StellarSDK.Keypair.fromSecret(DISTRIBUTOR_SECRET);

    console.log(`📝 Issuer Public Key: ${issuerKeypair.publicKey()}`);
    console.log(`📝 Distributor Public Key: ${distributorKeypair.publicKey()}`);

    // Verify these match your provided keys
    if (issuerKeypair.publicKey() !== "GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI") {
      console.warn("⚠️  Warning: Issuer public key doesn't match expected key");
    }
    if (distributorKeypair.publicKey() !== "GCTPMH43NGN7E4IXLQ27H2XWGGWWDY3I6UAPBFXYQSEUPEKNQE2BZXC2") {
      console.warn("⚠️  Warning: Distributor public key doesn't match expected key");
    }

    // Define DROP token
    const dropToken = new StellarSDK.Asset(TOKEN_CODE, issuerKeypair.publicKey());

    // Get base fee
    const response = await server.ledgers().order("desc").limit(1).call();
    const baseFee = response.records[0].base_fee_in_stroops;

    console.log("\n📋 STEP 1: Creating Trustline");
    console.log("==============================");

    // Load distributor account
    const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());

    // Check if trustline already exists
    const existingTrustline = distributorAccount.balances.find(
      balance => balance.asset_code === TOKEN_CODE && 
                balance.asset_issuer === issuerKeypair.publicKey()
    );

    if (existingTrustline) {
      console.log("✅ Trustline already exists for DROP token");
      console.log(`   Current balance: ${existingTrustline.balance} DROP`);
    } else {
      // Create trustline transaction
      const trustlineTransaction = new StellarSDK.TransactionBuilder(distributorAccount, {
        fee: baseFee,
        networkPassphrase: NETWORK_PASSPHRASE,
        timebounds: await server.fetchTimebounds(90),
      })
        .addOperation(StellarSDK.Operation.changeTrust({ 
          asset: dropToken, 
          limit: undefined // Unlimited trust
        }))
        .build();

      trustlineTransaction.sign(distributorKeypair);

      // Submit trustline transaction
      const trustlineResult = await server.submitTransaction(trustlineTransaction);
      console.log("✅ Trustline created successfully");
      console.log(`   Transaction Hash: ${trustlineResult.hash}`);
    }

    console.log("\n💰 STEP 2: Minting DROP Tokens");
    console.log("===============================");

    // Load issuer account
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

    // Check current distributor balance
    const updatedDistributorAccount = await server.loadAccount(distributorKeypair.publicKey());
    const currentBalance = updatedDistributorAccount.balances.find(
      balance => balance.asset_code === TOKEN_CODE && 
                balance.asset_issuer === issuerKeypair.publicKey()
    );

    if (currentBalance && parseFloat(currentBalance.balance) > 0) {
      console.log(`✅ DROP tokens already minted: ${currentBalance.balance} DROP`);
    } else {
      // Create payment transaction (minting)
      const paymentTransaction = new StellarSDK.TransactionBuilder(issuerAccount, {
        fee: baseFee,
        networkPassphrase: NETWORK_PASSPHRASE,
        timebounds: await server.fetchTimebounds(90),
      })
        .addOperation(
          StellarSDK.Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: dropToken,
            amount: TOKEN_AMOUNT,
          })
        )
        .build();

      paymentTransaction.sign(issuerKeypair);

      // Submit payment transaction
      const paymentResult = await server.submitTransaction(paymentTransaction);
      console.log("✅ DROP tokens minted successfully");
      console.log(`   Amount: ${TOKEN_AMOUNT} DROP`);
      console.log(`   Transaction Hash: ${paymentResult.hash}`);
    }

    console.log("\n🌐 STEP 3: Setting Home Domain");
    console.log("==============================");

    // Check if home domain is already set
    const currentIssuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    
    if (currentIssuerAccount.home_domain === HOME_DOMAIN) {
      console.log(`✅ Home domain already set: ${HOME_DOMAIN}`);
    } else {
      // Set home domain transaction
      const setOptionsTransaction = new StellarSDK.TransactionBuilder(currentIssuerAccount, {
        fee: baseFee,
        networkPassphrase: NETWORK_PASSPHRASE,
        timebounds: await server.fetchTimebounds(90),
      })
        .addOperation(StellarSDK.Operation.setOptions({ 
          homeDomain: HOME_DOMAIN 
        }))
        .build();

      setOptionsTransaction.sign(issuerKeypair);

      // Submit set options transaction
      const setOptionsResult = await server.submitTransaction(setOptionsTransaction);
      console.log("✅ Home domain set successfully");
      console.log(`   Domain: ${HOME_DOMAIN}`);
      console.log(`   Transaction Hash: ${setOptionsResult.hash}`);
    }

    console.log("\n📊 STEP 4: Final Balance Check");
    console.log("==============================");

    // Check final balances
    const finalDistributorAccount = await server.loadAccount(distributorKeypair.publicKey());
    
    finalDistributorAccount.balances.forEach((balance) => {
      if (balance.asset_type === "native") {
        console.log(`💎 Test-Pi Balance: ${balance.balance}`);
      } else if (balance.asset_code === TOKEN_CODE) {
        console.log(`🪙 DROP Balance: ${balance.balance}`);
      }
    });

    console.log("\n🎉 DROP Token Setup Complete!");
    console.log("=============================");
    console.log(`✅ Token Code: ${TOKEN_CODE}`);
    console.log(`✅ Issuer: ${issuerKeypair.publicKey()}`);
    console.log(`✅ Total Supply: ${TOKEN_AMOUNT}`);
    console.log(`✅ Home Domain: ${HOME_DOMAIN}`);
    console.log(`✅ TOML URL: https://${HOME_DOMAIN}/.well-known/pi.toml`);
    
    console.log("\n📝 Next Steps:");
    console.log("1. Deploy the pi.toml file to https://droplink.space/.well-known/pi.toml");
    console.log("2. Wait for Pi Server to scan and verify your token");
    console.log("3. Your DROP token will appear in Pi Wallet for users to add");
    console.log("4. Users can create trustlines and receive DROP tokens");

  } catch (error) {
    console.error("❌ Error setting up DROP token:", error.message);
    
    if (error.response && error.response.data) {
      console.error("📋 Error details:", JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Function to check token status
async function checkTokenStatus() {
  try {
    const issuerKeypair = StellarSDK.Keypair.fromSecret(ISSUER_SECRET);
    const tokenUrl = `https://api.minepi.com/assets?asset_code=${TOKEN_CODE}&asset_issuer=${issuerKeypair.publicKey()}`;
    
    console.log(`🔍 Checking token status: ${tokenUrl}`);
    
    // Note: You would need to use fetch or axios to check this URL
    // This is just showing where to check your token status
    
  } catch (error) {
    console.error("Error checking token status:", error.message);
  }
}

// Function to distribute tokens to a recipient
async function distributeTokens(recipientPublicKey, amount) {
  try {
    console.log(`💸 Distributing ${amount} DROP to ${recipientPublicKey}`);
    
    const distributorKeypair = StellarSDK.Keypair.fromSecret(DISTRIBUTOR_SECRET);
    const issuerKeypair = StellarSDK.Keypair.fromSecret(ISSUER_SECRET);
    const dropToken = new StellarSDK.Asset(TOKEN_CODE, issuerKeypair.publicKey());
    
    // Get base fee
    const response = await server.ledgers().order("desc").limit(1).call();
    const baseFee = response.records[0].base_fee_in_stroops;
    
    // Load distributor account
    const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
    
    // Create distribution transaction
    const distributionTransaction = new StellarSDK.TransactionBuilder(distributorAccount, {
      fee: baseFee,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: await server.fetchTimebounds(90),
    })
      .addOperation(
        StellarSDK.Operation.payment({
          destination: recipientPublicKey,
          asset: dropToken,
          amount: amount.toString(),
        })
      )
      .build();

    distributionTransaction.sign(distributorKeypair);

    // Submit distribution transaction
    const distributionResult = await server.submitTransaction(distributionTransaction);
    console.log("✅ Tokens distributed successfully");
    console.log(`   Transaction Hash: ${distributionResult.hash}`);
    
    return distributionResult.hash;
    
  } catch (error) {
    console.error("❌ Error distributing tokens:", error.message);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupDropToken();
      break;
    case 'status':
      checkTokenStatus();
      break;
    case 'distribute':
      const recipient = process.argv[3];
      const amount = process.argv[4];
      if (!recipient || !amount) {
        console.error("Usage: node pi-token-setup.js distribute <recipient_public_key> <amount>");
        process.exit(1);
      }
      distributeTokens(recipient, amount);
      break;
    default:
      console.log("Usage:");
      console.log("  node pi-token-setup.js setup     - Set up DROP token");
      console.log("  node pi-token-setup.js status    - Check token status");
      console.log("  node pi-token-setup.js distribute <recipient> <amount> - Distribute tokens");
  }
}

module.exports = {
  setupDropToken,
  distributeTokens,
  checkTokenStatus,
  TOKEN_CODE,
  HOME_DOMAIN
};