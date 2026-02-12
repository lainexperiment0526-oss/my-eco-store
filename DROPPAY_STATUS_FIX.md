# DropPay Status Fix - Complete

## Changes Made

### 1. Fixed Frontend Environment Variables
- **[src/pages/Subscription.tsx](src/pages/Subscription.tsx)** (line 120)
  - Changed: `import.meta.env.DROPPAY_API_KEY`
  - To: `import.meta.env.VITE_DROPPAY_API_KEY`
  - **Why**: Vite only exposes env vars with `VITE_` prefix to the frontend

### 2. Updated .env Files with VITE_ Prefix
- **[.env](.env)** (lines 58-63)
  - `VITE_DROPPAY_BASE_URL`
  - `VITE_DROPPAY_API_KEY`
  - `VITE_DROPPAY_AUTH_SCHEME`
  - `DROPPAY_WEBHOOK_SECRET` (kept as-is, server-side only)

- **[.env.production](.env.production)** (lines 110-115)
  - `VITE_DROPPAY_BASE_URL`
  - `VITE_DROPPAY_API_KEY`
  - `VITE_DROPPAY_AUTH_SCHEME`
  - `DROPPAY_WEBHOOK_SECRET` (kept as-is, server-side only)

## Environment Variables Explained

### Frontend Variables (with VITE_ prefix)
These are exposed to the browser at build time:
- `VITE_DROPPAY_API_KEY` - DropPay live API key (used for status checking)
- `VITE_DROPPAY_BASE_URL` - DropPay API endpoint
- `VITE_DROPPAY_AUTH_SCHEME` - Authorization method

### Server Variables (without VITE_ prefix)
These are only available on the server:
- `DROPPAY_API_KEY` - DropPay API key (for production builds)
- `DROPPAY_BASE_URL` - DropPay API endpoint
- `DROPPAY_AUTH_SCHEME` - Authorization method
- `DROPPAY_WEBHOOK_SECRET` - For signature verification (optional)

## What This Fixes

❌ **Before**: 
```
DropPay: Not configured
```
(Status check was looking for undefined variable)

✅ **After**: 
```
DropPay: Online
```
(Status check now finds the VITE_ prefixed variable)

## Testing

1. **Clear browser cache** (or restart dev server)
2. Go to `/subscription`
3. Look for status badge
4. Should now show: `DropPay: Online` ✅

## Backend Remains Unchanged

Server-side environment variables (used in API routes) still work:
- `api/droppay-create.ts` - Uses `process.env.DROPPAY_API_KEY`
- `api/droppay-webhook.ts` - Uses `process.env.DROPPAY_API_KEY`
- `server.js` - Uses `process.env.DROPPAY_API_KEY`

These are only loaded by Node.js on the server, so they don't need VITE_ prefix.

## Summary
**Status**: ✅ Fixed
**Impact**: DropPay gateway will now show as "Online" on subscription page
**Breaking Changes**: None
**Requires Rebuild**: Yes (dev server needs restart or `npm run dev`)
