# Dev Mode - Pi Auth Bypass

## Overview

Dev Mode allows you to bypass Pi Network authentication and access the dashboard with a mock development account. This is useful for testing the dashboard UI and features without requiring Pi Browser or a valid Pi Network account.

## Enabling Dev Mode

### Option 1: Environment Variable (Recommended for development)

Set `VITE_DEV_MODE=true` in your `.env` file:

```
VITE_DEV_MODE=true
```

Then restart your development server:
```bash
npm run dev
# or
bun run dev
```

### Option 2: Runtime Toggle (Quick Testing)

Click the **Dev Mode** button in the bottom-right corner of the application:

- **Yellow button = Dev Mode is OFF** - Pi auth is required
- **Yellow toggle button = Dev Mode is ON** - Pi auth is bypassed

The button automatically appears when dev mode is available.

### Option 3: localStorage Override

Open browser console and run:
```javascript
localStorage.setItem('droplink-dev-mode', 'true');
window.location.reload();
```

To disable:
```javascript
localStorage.removeItem('droplink-dev-mode');
window.location.reload();
```

## Mock Account Details

When Dev Mode is enabled, you'll automatically be logged in as:

- **Username**: `devtest`
- **Display Name**: `Dev Test User`
- **Wallet Address**: `GBXYZ123456789DEVWALLET456789DEVWALLET4567`
- **Profile ID**: `dev-profile-12345`
- **Business Name**: `Dev Store`

## Checking Dev Mode Status

Check the browser console for dev mode status:

```javascript
import { logDevModeStatus } from '@/lib/dev-auth';
logDevModeStatus();
```

Or programmatically:

```javascript
import { getDevModeStatus } from '@/lib/dev-auth';
const status = getDevModeStatus();
console.log(status);
// Output: { enabled: true, envEnabled: true, localStorageEnabled: false }
```

## Features Available in Dev Mode

✅ Full dashboard access
✅ Profile editing
✅ Link management
✅ Store/merchant setup
✅ All UI components
✅ Settings and preferences
✅ Ad network testing (with mock ads)
✅ Payment testing (mock wallet)

## Features NOT Available in Dev Mode

❌ Real Pi Network wallet connectivity
❌ Real DROP token balance
❌ Real payment processing
❌ Real Pi Network authentication
❌ Real user profile from Pi Network

## Development Workflow

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Enable Dev Mode** (if not already in `.env`)
   - Use the toggle button in bottom-right
   - Or set `VITE_DEV_MODE=true` in `.env`

3. **Access Dashboard**
   - Navigate to `http://localhost:5173/`
   - Dashboard loads without Pi auth requirement

4. **Test Features**
   - Test all UI/UX flows
   - Test dashboard layouts
   - Test profile customization
   - Test different subscription states

5. **Disable Dev Mode Before Production**
   - Set `VITE_DEV_MODE=false` in `.env`
   - Or ensure `localStorage.droplink-dev-mode` is not set

## Building with Dev Mode

Dev mode should only be used in development. To ensure it doesn't make it to production:

```bash
# Production build - Dev Mode will be disabled
VITE_DEV_MODE=false npm run build

# Or just build normally (defaults to env value)
npm run build
```

The env variable is embedded at build time, so double-check before deploying!

## Security Notes

- Dev mode should **NEVER** be enabled in production (`VITE_DEV_MODE=false`)
- The mock account bypasses all authentication checks
- The DevModeToggle button is hidden in production builds
- All dev auth code is stripped out in production if `VITE_DEV_MODE=false`

## Troubleshooting

### Dev Mode Button Not Showing

If the yellow toggle button isn't visible:
1. Check that `VITE_DEV_MODE` is set to `true` in `.env`
2. Ensure development server was restarted after changing `.env`
3. Clear browser cache and refresh

### Still Seeing Auth Modal

If the auth modal still appears:
1. Check console for dev mode status:
   ```javascript
   import { logDevModeStatus } from '@/lib/dev-auth';
   logDevModeStatus();
   ```
2. Verify `VITE_DEV_MODE` is actually set to `true`
3. Try the localStorage override: `localStorage.setItem('droplink-dev-mode', 'true');`

### Profile Data Not Loading

Dev mode provides a mock profile. To test with real data:
1. Disable dev mode
2. Authenticate with Pi Network
3. Real profile data from Supabase will load

## Code Architecture

### Key Files

- `/src/lib/dev-auth.ts` - Dev mode utilities and mock data
- `/src/components/DevModeToggle.tsx` - Toggle button component
- `/src/pages/Dashboard.tsx` - Dashboard with dev mode integration
- `/src/contexts/PiContext.tsx` - Pi authentication context

### How It Works

1. `isDevModeEnabled()` checks if dev mode is active
2. Dashboard checks dev mode before requiring Pi auth
3. When enabled, user is treated as authenticated
4. Mock profile and user data are provided
5. All protected features work with mock data

## Examples

### Access Dashboard in Dev Mode

```
1. Set VITE_DEV_MODE=true in .env
2. npm run dev
3. Navigate to http://localhost:5173/
4. Dashboard loads immediately (no auth required)
```

### Quick Toggle for Testing

```
1. Click the yellow "Dev Mode" button in bottom-right
2. Page reloads with dev mode toggled
3. Auth requirement is immediately applied/removed
```

### Check If Dev Mode is Active

```javascript
// In browser console
import { isDevModeEnabled } from '@/lib/dev-auth';
console.log('Dev Mode:', isDevModeEnabled());
```

## Support

For issues with dev mode:
1. Check the console for detailed logging
2. Verify environment variable is set correctly
3. Clear localStorage and browser cache
4. Restart dev server
