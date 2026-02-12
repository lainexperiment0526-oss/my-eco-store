# Pi SDK CORS Fix Guide 🔧

This guide helps you resolve Pi SDK CORS errors when developing on localhost.

## 🐛 Common Errors Fixed

- ❌ `Access-Control-Allow-Origin` header missing
- ❌ `Failed to execute 'postMessage' on 'DOMWindow'`
- ❌ `The target origin provided does not match the recipient window's origin`
- ❌ Pi Browser requires HTTPS for validation

## 🚀 Quick Solutions

### Option 1: HTTPS Development (Recommended)
```bash
# Setup HTTPS certificates for development
npm run setup:https

# Start development with HTTPS
npm run dev:https

# Access your app at: https://localhost:8080
```

### Option 2: CORS Proxy (Alternative)
```bash
# Start with CORS proxy
npm run dev:proxy

# This starts both the proxy server and your app
# Pi SDK requests are proxied to avoid CORS issues
```

### Option 3: Standard Development with Fallbacks
```bash
# Regular development (HTTP) with fallback Pi SDK
npm run dev

# The app includes automatic CORS handling and Pi SDK fallbacks
```

## 🔍 What Was Fixed

### 1. Vite Configuration (`vite.config.ts`)
- ✅ Added CORS headers for Pi SDK domains
- ✅ Added HTTPS support for development
- ✅ Configured proper headers for origin handling

### 2. Pi SDK Loading (`index.html`)
- ✅ Enhanced error handling for SDK loading failures
- ✅ Fallback Pi SDK implementation for development
- ✅ Better validation for localhost vs production

### 3. CORS Fix Script (`public/pi-cors-fix.js`)
- ✅ Intercepts `postMessage` calls to handle origin mismatches
- ✅ Provides development fallbacks for Pi SDK methods
- ✅ Patches fetch requests to Pi domains

## 🌐 Production Deployment

For production, ensure your app is served over HTTPS:
- ✅ Pi SDK requires HTTPS for proper validation
- ✅ No CORS issues on production domains
- ✅ Full Pi SDK functionality available

## 🛠️ Troubleshooting

### If you still see CORS errors:

1. **Check your URL**: Make sure you're using `https://localhost:8080` if using HTTPS
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Try incognito mode**: To avoid cached CORS policies
4. **Check console**: Look for detailed error messages

### If certificates don't work:

1. **Install mkcert** (alternative):
   ```bash
   # Windows (with chocolatey)
   choco install mkcert
   
   # Then create certificates
   mkcert localhost 127.0.0.1 ::1
   ```

2. **Use Ngrok** (cloud tunnel):
   ```bash
   npx ngrok http 8080
   # Use the provided HTTPS URL
   ```

## ✅ Success Indicators

You'll know it's working when you see:
- 🟢 `[PI SDK] ✅ Pi SDK script loaded successfully`
- 🟢 `[PI VALIDATION] ✅ HTTPS detected - Pi SDK validation enabled`
- 🟢 No CORS errors in the browser console

## 📞 Need Help?

If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify you're using the latest version of the Pi Browser
3. Test with a simple HTTPS setup first