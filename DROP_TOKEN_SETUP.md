# DROP Token Setup Guide

Complete setup guide for DropLink's DROP token on Pi Network testnet.

## 📋 Prerequisites

1. **Two Pi Testnet Wallets**
   - Create wallets in Pi Wallet app
   - Activate them on Pi Testnet  
   - Get private keys from wallet settings
   - Save private keys securely

2. **Your Wallet Information**
   - Issuer: `SB4I6DX4Y6PS7SAJW2SFUQZP3DAW5HE7RBAKISOMTVACARMFCMRBH46I`
   - Distributor: `SBS4OY37QMZ67U2WLWZQUUFUV2JOBKWCBFS7IZDOJV3NZPYC3OOZ4OIM`

3. **Domain Setup**
   - Domain: `droplink.space`
   - TOML URL: `https://droplink.space/.well-known/pi.toml`

## 🛠️ Setup Steps

### Step 1: Install Dependencies

```bash
# Install Stellar SDK for token operations
npm install @stellar/stellar-sdk

# Or if using the token package file
npm install --prefix . --package-lock-only
```

### Step 2: Configure Private Keys

```bash
# Method 1: Edit the script files directly
# Add your private keys to pi-token-setup.js:
# const ISSUER_SECRET = "YOUR_ISSUER_PRIVATE_KEY";
# const DISTRIBUTOR_SECRET = "YOUR_DISTRIBUTOR_PRIVATE_KEY";

# Method 2: Use environment variables (recommended)
export ISSUER_SECRET="YOUR_ISSUER_PRIVATE_KEY"
export DISTRIBUTOR_SECRET="YOUR_DISTRIBUTOR_PRIVATE_KEY"
```

### Step 3: Deploy pi.toml File

The `pi.toml` file has been created in the `public` folder. Deploy it to:
```
https://droplink.space/.well-known/pi.toml
```

**Important**: 
- File must be accessible via HTTPS
- Content-Type should be `text/plain`
- File must be publicly accessible
- No authentication required

### Step 4: Run Token Setup

```bash
# Complete token setup (creates trustline, mints tokens, sets home domain)
node pi-token-setup.js setup

# Or run individual steps:
node pi-token-setup.js status       # Check current status
node home-domain-setup.js set-domain
node home-domain-setup.js verify-toml
```

### Step 5: Verify Setup

1. **Check Token on Pi Explorer**:
   ```
   https://api.testnet.minepi.com/assets?asset_code=DROP&asset_issuer=SB4I6DX4Y6PS7SAJW2SFUQZP3DAW5HE7RBAKISOMTVACARMFCMRBH46I
   ```

2. **Check Issuer Account**:
   ```
   https://api.testnet.minepi.com/accounts/SB4I6DX4Y6PS7SAJW2SFUQZP3DAW5HE7RBAKISOMTVACARMFCMRBH46I
   ```

3. **Verify TOML File**:
   ```
   https://droplink.space/.well-known/pi.toml
   ```

## 🎯 Token Distribution

### Distribute to Users

```bash
# Distribute tokens to a specific user
node pi-token-setup.js distribute <recipient_public_key> <amount>

# Example:
node pi-token-setup.js distribute GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX 100
```

### Backend Integration

Create a Supabase function for token distribution:

```sql
-- Create function in Supabase SQL Editor
CREATE OR REPLACE FUNCTION distribute_drop_tokens()
RETURNS void AS $$
BEGIN
  -- Add your token distribution logic here
  -- This would call your token distribution script
  RAISE NOTICE 'DROP tokens distribution requested';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔧 Integration with DropLink App

### 1. User Authentication
- Users authenticate with Pi Network
- Wallet addresses are captured and stored
- DROP token balance is checked automatically

### 2. Token Operations
- **Check Balance**: Automatic balance checking
- **Create Trustline**: Guided user flow in app
- **Receive Tokens**: Request tokens from distributor
- **Send Tokens**: Transfer tokens between users

### 3. Earning DROP Tokens
Users can earn DROP tokens through:
- Creating bio pages
- Sharing content  
- Engaging with platform
- Completing achievements
- Watching ads (when available)

## 📱 User Experience

### For New Users:
1. Authenticate with Pi Network
2. App detects no DROP trustline
3. Guide user to create trustline
4. Offer welcome bonus of DROP tokens
5. Show balance and earning opportunities

### For Existing Users:
1. Automatic balance checking
2. Display current DROP balance
3. Show earning opportunities
4. Enable token transfers

## 🛡️ Security Considerations

1. **Private Key Management**
   - Store private keys in secure environment variables
   - Never commit private keys to version control
   - Use separate staging/production keys

2. **Rate Limiting**
   - Implement rate limiting for token distribution
   - Monitor for abuse and spam requests
   - Set daily/weekly limits per user

3. **Transaction Verification**
   - Verify all transactions on Pi Network
   - Implement proper error handling
   - Log all token operations

## 🧪 Testing

### Testnet Testing:
```bash
# Test token setup
node pi-token-setup.js setup

# Test distribution
node pi-token-setup.js distribute <test_wallet> 10

# Test status checking
node pi-token-setup.js status
```

### Frontend Testing:
1. Test with Pi Browser on testnet
2. Verify token balance display
3. Test trustline creation flow
4. Test token distribution requests

## 🚀 Production Deployment

### Before Going Live:
1. ✅ Deploy pi.toml to production domain
2. ✅ Test all token operations on testnet
3. ✅ Verify home domain is set correctly
4. ✅ Test user flows in Pi Browser
5. ✅ Set up monitoring and logging
6. ✅ Configure rate limiting
7. ✅ Implement proper error handling

### Production Checklist:
- [ ] Update network from testnet to mainnet
- [ ] Generate new production wallets
- [ ] Update issuer/distributor addresses
- [ ] Deploy to production domain
- [ ] Test with real Pi Network users
- [ ] Monitor token metrics and usage

## 📊 Monitoring

Track these metrics:
- Total tokens distributed
- Number of users with trustlines
- Transaction volume
- Error rates
- User engagement with token features

## 🆘 Troubleshooting

### Common Issues:

**TOML File Not Found (404)**
- Verify file is at exact URL: `https://droplink.space/.well-known/pi.toml`
- Check file permissions and accessibility
- Ensure HTTPS is working

**Trustline Creation Fails**
- Verify user has Test-Pi for transaction fees
- Check if user's wallet is activated on testnet
- Ensure token is properly configured

**Token Not Appearing in Pi Wallet**
- Wait for Pi Server to scan (can take time)
- Verify TOML file is accessible
- Check all required fields are present
- Ensure image URL is accessible

**Distribution Fails**
- Verify distributor has sufficient token balance
- Check recipient has created trustline
- Ensure private keys are correct
- Verify network connectivity

## 📚 Additional Resources

- [Pi Platform Documentation](https://github.com/pi-apps/pi-platform-docs)
- [Stellar Development Guide](https://developers.stellar.org/)
- [Pi SDK Documentation](https://github.com/pi-apps/pi-platform-docs/tree/master/SDK_Reference)

---

## 🎉 Success!

Once setup is complete, your DROP token will be:
✅ Minted on Pi Testnet with 100M total supply  
✅ Linked to droplink.space domain  
✅ Available for users to add in Pi Wallet  
✅ Ready for distribution and transactions  
✅ Integrated into DropLink platform  

Users can now earn and trade DROP tokens within the Drop ecosystem!