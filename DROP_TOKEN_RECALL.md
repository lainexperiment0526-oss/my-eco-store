# DROP Token Recall System

This system implements token recall capabilities for the DROP token on Pi Network mainnet, following the Pi Platform documentation guidelines.

## Overview

Token recall allows the token issuer to revoke tokens from specific accounts in emergency situations. This is implemented using Pi Network's authorization system and follows best practices for token governance.

## Components

### 1. Command Line Utility (`recall-drop-token.cjs`)

A Node.js script that provides command-line access to token recall operations:

```bash
# Check token status
node recall-drop-token.cjs status

# Enable authorization flags (one-time setup)
node recall-drop-token.cjs enable-auth [ISSUER_SECRET_KEY]

# Recall tokens from specific account
node recall-drop-token.cjs recall [ACCOUNT_ADDRESS] [AMOUNT] [ISSUER_SECRET_KEY]

# Emergency freeze all tokens
node recall-drop-token.cjs emergency-freeze [ISSUER_SECRET_KEY]
```

### 2. UI Component (DropTokenManager Admin Tab)

A React component that provides a user interface for token recall operations:

- **Admin Tab**: Token administration interface
- **Authorization Status**: Shows current token auth flags
- **Token Recall**: Interface to recall tokens from specific accounts
- **Setup Authorization**: Enable recall capabilities

## Prerequisites

### For Token Recall to Work:

1. **Authorization Flags Must Be Set**: The token issuer account must have both `AUTH_REQUIRED` and `AUTH_REVOCABLE` flags enabled.

2. **Issuer Private Key**: The token issuer's private key is required to sign recall transactions.

3. **Mainnet Connection**: Operations must be performed on Pi Network mainnet.

## Security Considerations

### 🚨 **CRITICAL SECURITY NOTES**

- **Irreversible Operations**: Token recalls cannot be undone
- **Private Key Security**: Issuer private key must be kept secure
- **Legal Compliance**: Recalls should only be used for legitimate purposes
- **Audit Trail**: All recall operations are recorded on the blockchain

### Best Practices:

1. **Test on Testnet First**: Always test recall operations on testnet before mainnet
2. **Multi-signature**: Consider using multi-signature accounts for issuer operations
3. **Documentation**: Keep detailed records of why recalls were necessary
4. **User Communication**: Notify affected users when possible

## Technical Implementation

### Authorization Setup

```javascript
// Enable authorization flags on issuer account
const transaction = new StellarSDK.TransactionBuilder(issuerAccount, {
  fee: baseFee,
  networkPassphrase: NETWORK_PASSPHRASE,
  timebounds: await server.fetchTimebounds(90),
})
.addOperation(StellarSDK.Operation.setOptions({
  setFlags: StellarSDK.AuthRevocableFlag | StellarSDK.AuthRequiredFlag
}))
.build();
```

### Token Recall Operation

```javascript
// Recall tokens using clawback operation
const transaction = new StellarSDK.TransactionBuilder(issuerAccount, {
  fee: baseFee,
  networkPassphrase: NETWORK_PASSPHRASE,
  timebounds: await server.fetchTimebounds(90),
})
.addOperation(StellarSDK.Operation.allowTrust({
  trustor: accountAddress,
  assetCode: 'DROP',
  authorize: false
}))
.addOperation(StellarSDK.Operation.clawback({
  asset: dropAsset,
  from: accountAddress,
  amount: amount
}))
.build();
```

## Usage Scenarios

### 1. Emergency Response
- Compromised accounts
- Suspicious activity
- Regulatory compliance

### 2. Token Management
- Correcting distribution errors
- Implementing governance decisions
- Managing token supply

### 3. Legal Requirements
- Court orders
- Regulatory requests
- Compliance actions

## Error Handling

The system includes comprehensive error handling for:

- Invalid private keys
- Network connectivity issues
- Insufficient authorization
- Invalid account addresses
- Blockchain transaction errors

## Monitoring and Logging

All operations are logged with:

- Timestamp
- Operation type
- Account involved
- Amount recalled
- Transaction hash
- Error details (if any)

## Integration with DropLink Platform

The recall system is integrated into the DropLink platform through:

- **Dashboard UI**: Admin tab in DropTokenManager component
- **API Endpoints**: Backend integration for automated recalls
- **Notification System**: User notifications for recall events
- **Analytics**: Tracking and reporting of recall operations

## Future Enhancements

- **Multi-signature Support**: Require multiple signatures for recalls
- **Time Locks**: Delay recall operations for transparency
- **Governance Integration**: Community voting on recall decisions
- **Automated Compliance**: Trigger recalls based on predefined rules

## Support and Documentation

For additional support:

- Pi Platform Documentation: https://github.com/pi-apps/pi-platform-docs/blob/master/tokens.md
- Stellar Documentation: https://developers.stellar.org/
- DropLink Support: support@droplink.space

---

⚠️ **WARNING**: Token recall is a powerful feature that should be used responsibly. Always ensure proper authorization and legal justification before recalling tokens.