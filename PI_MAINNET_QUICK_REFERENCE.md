# Pi Network Mainnet - Quick Reference Card

## 🔑 Credentials

**API Key:** `ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw`  
**Validation Key:** `7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a`

---

## 🚀 Deploy to Supabase

```bash
# Automated
.\deploy-mainnet-config.ps1

# Manual
supabase secrets set PI_API_KEY="ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw"
supabase secrets set PI_VALIDATION_KEY="7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a"
```

---

## 📚 Documentation Links

| Resource | URL |
|----------|-----|
| **Pi Developer Guide** | https://pi-apps.github.io/community-developer-guide/ |
| **Pi Platform Docs** | https://github.com/pi-apps/pi-platform-docs/tree/master |
| **Payments API** | https://pi-apps.github.io/community-developer-guide/ |
| **Ad Network Docs** | https://github.com/pi-apps/pi-platform-docs/tree/master |

---

## 🔧 Configuration Status

✅ Frontend `.env` - Updated  
✅ `.env.production` - Updated  
✅ `.env.example` - Updated  
✅ `DROPLINK_MAINNET_CONFIG.md` - Updated  
✅ Validation key files - Present  
✅ Backend functions - Configured  

---

## 📦 Build & Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy Supabase secrets
.\deploy-mainnet-config.ps1

# Deploy to hosting (Vercel, Netlify, etc.)
# Upload contents of dist/ folder
```

---

## 🧪 Testing Checklist

- [ ] Build succeeds without errors
- [ ] Supabase secrets are deployed
- [ ] Validation key accessible at URLs
- [ ] Test auth in Pi Browser
- [ ] Test payment (small amount first!)
- [ ] Verify transaction completion
- [ ] Check ad network (if enabled)

---

## ⚠️ Critical Reminders

- 🔴 **MAINNET = REAL Pi COINS**
- 🔴 **Transactions are IRREVERSIBLE**
- 🔴 **Test in sandbox first if possible**
- 🔴 **Always confirm with users before payments**
- 🔴 **Never commit API keys to Git**

---

## 🎯 Key Endpoints

| Endpoint | URL |
|----------|-----|
| Pi API Base | `https://api.minepi.com` |
| Pi Horizon | `https://api.minepi.com` |
| Pi SDK | `https://sdk.minepi.com/pi-sdk.js` |
| Network | `mainnet` |
| Passphrase | `Pi Mainnet` |

---

## 🔍 Validation Key Locations

- `public/.well-known/validation-key.txt`
- `public/validation-key.txt`
- `validation-key.txt`

All three files contain the same validation key for redundancy.

---

## 💰 Payment Limits

- **Minimum:** 0.01 π
- **Maximum:** 10,000 π
- **Timeout:** 60 seconds
- **Currency:** PI

---

## 🎨 Scopes Requested

1. `username` - Access to Pi username
2. `payments` - Ability to initiate payments
3. `wallet_address` - Access to user's wallet address

---

## 📞 Support

- **Pi Developer Portal:** https://developers.pi/
- **Droplink Support:** support@droplink.space

---

**Last Updated:** December 13, 2025  
**Configuration:** Mainnet v1.0
