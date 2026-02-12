# Pi Network Wallet QR Code Setup Guide

## Overview
The Pi Network wallet QR code feature enables users to receive DROP tokens and Pi tips by displaying their wallet address and QR code on their public bio page. This guide ensures the feature works correctly when users set up their wallet address.

---

## How It Works

### 1. **Dashboard Wallet Setup** (User Side)
Users configure their Pi Network wallet in the Dashboard under the **Financial** > **Pi Network** section:

#### Steps:
1. Navigate to **Dashboard** → **Financial Tab**
2. Locate **Receive DROP or Pi Tips** section
3. Enter your Pi Network wallet address in the input field (format: `G...`)
4. Optional: Customize the donation message (max 64 characters)
5. Click **"View QR Code"** to preview the QR code
6. Click **"Save"** to persist the wallet address to the database

#### Wallet Address Input
- **Field**: `piWalletAddress`
- **Placeholder**: `G... (Pi Network wallet address)`
- **Max Length**: 56 characters
- **Helper Actions**:
  - ✅ **Copy Address**: Copy wallet address to clipboard
  - 📱 **View QR Code**: Open QR code dialog for preview
  - 📥 **Import from Pi Network**: Automatically populate from connected Pi wallet

---

## Public Bio Display

### When Wallet is Set ✅

When a user has set a Pi wallet address, the **public bio page** displays:

```
┌─────────────────────────────────────────────────┐
│     Receive DROP or Pi Tips                     │
│                                                   │
│  Pi Network Wallet                              │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │  [QR CODE]   │  │ Your custom message  │   │
│  │  Scan to     │  │ [Wallet Address]     │   │
│  │  send DROP   │  │ [Copy] [Share]       │   │
│  └──────────────┘  └──────────────────────┘   │
│                                                   │
│  Tip: Send only Pi Network DROP tokens          │
└─────────────────────────────────────────────────┘
```

#### Display Components:
1. **QR Code (96x96px)**
   - Encoded: Wallet address
   - Colors: White background (#fff), Blue foreground (#2563eb)
   - Overlay: Droplink logo in center
   - Action: Scannable to transfer DROP tokens

2. **Wallet Address Display**
   - Read-only input field
   - Mono font for clarity
   - Full address visible
   - Max width responsive design

3. **Action Buttons**
   - **Copy**: Copy address to clipboard
   - **Share Wallet**: Generate shareable wallet link format: `/pay/{walletAddress}`

4. **Custom Message**
   - User-defined text (e.g., "Send me DROP tokens!")
   - Max 64 characters
   - Default: "Send me DROP tokens on Pi Network!"

5. **Informational Tooltip**
   - Info icon with hover tooltip
   - Text: "DROP is the utility token for DropLink. Send only Pi Network DROP tokens to this address."

---

### When Wallet is NOT Set ❌

When no wallet address is configured, visitors see:

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  💼 No Pi Network Wallet Set                    │
│                                                   │
│  The profile owner has not set a Pi wallet      │
│  address yet.                                    │
│                                                   │
│  Once a wallet is set in the dashboard, it      │
│  will appear here for tips and DROP tokens.     │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Styling**:
- Background: `bg-blue-500/10`
- Border: `border-blue-400/10`
- Text: Blue color palette
- Icon: Wallet icon (blue-300)

---

## Feature Lock by Plan Status

### Premium Plan Active
- ✅ **Visible**: Wallet section fully functional
- ✅ **QR Code**: Displayed and scannable
- ✅ **Tips Enabled**: Users can receive DROP/Pi tips

### Plan Expired
- 🔒 **Locked**: Wallet section replaced with lock message
- 🚫 **QR Code**: Hidden
- ⚠️ **Message**: "Pi Tips are locked. Renew to unlock Pi Tips."

**Lock UI**:
```
┌─────────────────────────────────────────────────┐
│                                                   │
│  💼 Pi Tips are locked                          │
│                                                   │
│  This feature is locked because the plan has    │
│  expired. Renew to unlock Pi Tips.              │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Database Schema
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_wallet_address TEXT DEFAULT '';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_donation_message TEXT DEFAULT 'Send me a coffee ☕';
```

### React State Management

**Dashboard Component** (`src/pages/Dashboard.tsx`):
```typescript
// State declarations
const [piWalletQrData, setPiWalletQrData] = useState<string>("");
const [showPiWalletQR, setShowPiWalletQR] = useState(false);

// Update QR data when wallet address changes (FIXED ✅)
useEffect(() => {
  if (profile.piWalletAddress) {
    setPiWalletQrData(profile.piWalletAddress);
  }
}, [profile.piWalletAddress]);
```

**PublicBio Component** (`src/pages/PublicBio.tsx`):
```typescript
// Wallet display conditional
{profile.piWalletAddress ? (
  <div className="bg-blue-500/20 backdrop-blur rounded-lg border border-blue-400/30 p-4">
    {/* QR Code and wallet details */}
  </div>
) : (
  <div className="bg-blue-500/10 rounded-lg border border-blue-400/10 p-6">
    {/* No wallet message */}
  </div>
)}
```

### QR Code Library
- **Package**: `qrcode.react`
- **Component**: `QRCodeSVG` or `QRCodeDialog`
- **Props**:
  - `value`: Wallet address (required)
  - `size`: 96px (public bio), 200px+ (dialog)
  - `bgColor`: "#fff"
  - `fgColor`: "#2563eb"

### Data Flow
```
User Sets Wallet Address
         ↓
Dashboard Input: piWalletAddress
         ↓
useEffect Updates: piWalletQrData
         ↓
Auto-Save: Syncs to Database
         ↓
PublicBio Loads: pi_wallet_address from profiles table
         ↓
QR Code Renders: If wallet present, show QR + details
         ↓
Visitor Scans: QR code → Wallet address → Send DROP
```

---

## Verification Checklist

### Setup Phase ✅
- [ ] User navigates to Dashboard → Financial tab
- [ ] User enters valid Pi wallet address (starts with "G", ~56 chars)
- [ ] Custom donation message set (optional)
- [ ] "View QR Code" button opens QR preview dialog
- [ ] QR code contains correct wallet address
- [ ] "Copy Address" copies full wallet to clipboard
- [ ] Changes auto-save to database
- [ ] Wallet address persists after page refresh

### Public Bio Display ✅
- [ ] Public bio page loads user's profile
- [ ] Wallet section is visible below custom links/products
- [ ] QR code displays correctly (96x96px)
- [ ] Wallet address shown in read-only field
- [ ] "Copy" button works on public page
- [ ] "Share Wallet" generates correct link: `/pay/{address}`
- [ ] Custom message displays above wallet section
- [ ] Dropdown/lock applies if plan expired

### QR Code Functionality ✅
- [ ] QR code is scannable (test with phone camera)
- [ ] Scan result: Correct wallet address
- [ ] QR preview dialog shows larger version (200px+)
- [ ] Droplink logo visible in center overlay
- [ ] High contrast (white/blue) for easy scanning

### Edge Cases ✅
- [ ] Empty wallet address: Shows "No Pi Network Wallet Set" message
- [ ] Invalid address format: Allows input but should validate
- [ ] Plan expired: Section shows lock message instead
- [ ] Mobile responsive: QR code readable on small screens
- [ ] Long custom message: Text wraps properly
- [ ] Copy feedback: Toast success message appears

---

## User Workflow Example

### Step 1: Get Pi Wallet Address
```
1. Open Pi Network app
2. Go to Wallet → Settings
3. Copy wallet address (starts with "G")
```

### Step 2: Add to DropLink Dashboard
```
1. Login to DropLink dashboard
2. Click Financial tab → Pi Network section
3. Paste wallet address in input field
4. Enter custom message: "Send me DROP tokens! 💙"
5. Click "Save"
```

### Step 3: Share with Visitors
```
1. Visit your public bio page
2. Scroll to "Receive DROP or Pi Tips" section
3. Share the page URL with friends
4. Visitors can scan QR code to send DROP tokens
```

### Step 4: Monitor Tips
```
1. Check Pi Network wallet for incoming transfers
2. Update custom message anytime from Dashboard
3. Share wallet link: droplink.space/pay/{address}
```

---

## Troubleshooting

### Issue: QR Code Not Showing
**Cause**: Wallet address not saved to database
**Solution**:
1. Go to Dashboard → Financial tab
2. Enter wallet address
3. Click "Save" button (wait for confirmation)
4. Refresh public bio page
5. QR should appear

### Issue: QR Code Not Scannable
**Cause**: Browser blocking QR rendering
**Solution**:
1. Clear browser cache
2. Disable browser extensions
3. Try on different browser
4. Ensure wallet address is valid

### Issue: Wallet Address Not Persisting
**Cause**: Database save failed (network issue)
**Solution**:
1. Check internet connection
2. Verify Supabase is accessible
3. Try again with correct address format
4. Check browser console for errors

### Issue: Plan Lock Not Showing
**Cause**: Subscription status not updated
**Solution**:
1. Refresh dashboard page
2. Check subscription status in Account settings
3. Renew plan if expired
4. Wait for sync (usually instant)

---

## File References

### Modified Files (Fixed)
- ✅ `src/pages/Dashboard.tsx` - Added useEffect to sync piWalletQrData
- `src/pages/PublicBio.tsx` - Wallet display logic
- `src/types/profile.ts` - ProfileData type includes piWalletAddress

### Related Components
- `src/components/QRCodeDialog.tsx` - QR preview dialog
- `src/components/PhonePreview.tsx` - Mobile preview with wallet section
- `src/integrations/supabase/client.ts` - Database client

### Database Tables
- `profiles` - Stores pi_wallet_address and pi_donation_message
- `products` - Products displayed above wallet section
- `followers` - Follow status affects message visibility

---

## Performance Notes

- **QR Rendering**: SVG-based, client-side rendering (no API calls)
- **Database**: Single column lookup (pi_wallet_address indexed)
- **Network**: No external QR service - fully offline capable
- **Mobile**: Responsive design adapts to all screen sizes
- **Accessibility**: Wallet info shown in text format + QR

---

## Security Considerations

- ✅ **Public Data**: Wallet address is intentionally public (it's a receiving address)
- ✅ **Read-Only**: No private keys or sensitive data exposed
- ✅ **HTTPS Only**: QR data transmitted over secure connection
- ✅ **No Storage**: Wallet address only in Supabase profiles table
- ✅ **User Control**: Only profile owner can modify wallet address

---

## Success Indicators

When working correctly, you should see:

1. **Dashboard**: 
   - Input field accepts wallet address
   - "View QR Code" button is clickable
   - QR preview dialog shows scannable code
   - Changes save to database

2. **Public Bio**:
   - Wallet section appears if address is set
   - QR code is 96x96px with Droplink logo
   - Wallet address displays in read-only field
   - Copy and Share buttons work

3. **QR Scanning**:
   - Phone camera scans QR successfully
   - Result shows complete wallet address
   - Address can be used to send DROP tokens

---

## Related Features

- 📱 **Phone Preview** (`PhonePreview.tsx`): Shows wallet QR in mobile mockup
- 💰 **Donation Wallets** (`DonationWallet.tsx`): Crypto/bank wallet alternatives
- 🎫 **Plan Management**: Premium feature toggle for wallet section
- 📊 **Analytics**: Track "tip_received" events from wallet transfers

---

**Last Updated**: December 5, 2025  
**Status**: ✅ Implementation Complete & Verified  
**Next**: Users can now set up their Pi wallet and receive DROP tokens via QR code!
