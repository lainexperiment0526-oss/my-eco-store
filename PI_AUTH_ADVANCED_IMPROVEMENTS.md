# Pi Network Authentication - Advanced Troubleshooting & Improvements

## 🔬 Advanced Debugging Techniques

### 1. Browser Network Inspection

Open Pi Browser DevTools (F12) → Network Tab

**Expected Requests on Sign In:**
```
1. GET https://sdk.minepi.com/pi-sdk.js (200 OK)
2. POST to Pi Wallet (internal, user approval)
3. GET https://api.minepi.com/v2/me (200 OK with user data)
4. POST to Supabase (RPC authenticate_pi_user)
```

**If any fail:**
- Click request to see response body
- Check status code and error message
- Share screenshot with developer team

### 2. Console Variable Inspection

Run in browser console:
```javascript
// Check SDK availability
console.log({
  piAvailable: typeof window.Pi !== 'undefined',
  piVersion: window.Pi?.version || 'not loaded',
  userAgent: navigator.userAgent,
  isPiBrowser: /PiBrowser|Pi Browser/i.test(navigator.userAgent)
});

// Check stored auth
console.log({
  accessToken: localStorage.getItem('pi_access_token')?.substring(0, 50) + '...',
  user: JSON.parse(localStorage.getItem('pi_user') || '{}'),
  expiryTime: localStorage.getItem('pi_token_expiry')
});

// Check session
const session = await fetch('https://api.minepi.com/v2/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('pi_access_token')}`
  }
}).then(r => r.json());
console.log('Session valid:', session);
```

### 3. Enable Verbose Logging Mode

Add to PiContext.tsx:
```typescript
// At the top of signIn function
const VERBOSE_MODE = true;

const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(logEntry, data || '');
  
  // Store last 100 log entries
  const logs = JSON.parse(sessionStorage.getItem('pi_auth_logs') || '[]');
  logs.push({ timestamp, level, message, data });
  sessionStorage.setItem('pi_auth_logs', JSON.stringify(logs.slice(-100)));
};

// Then use throughout:
log('INFO', 'Starting authentication', { scopes });
// ...
log('SUCCESS', 'Authentication complete', { user: piUser.username });

// Retrieve logs later
const logs = JSON.parse(sessionStorage.getItem('pi_auth_logs') || '[]');
console.table(logs);
```

---

## 🛡️ Robustness Improvements

### 1. Add Token Refresh Logic

```typescript
// Add to PiContext.tsx
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const storedToken = localStorage.getItem('pi_access_token');
    if (!storedToken) return false;

    console.log('🔄 Checking token validity...');
    
    // Verify with Pi API
    const response = await fetch(PI_CONFIG.ENDPOINTS.ME, {
      headers: PI_CONFIG.getAuthHeaders(storedToken),
    });

    if (response.ok) {
      console.log('✅ Token still valid');
      return true;
    } else if (response.status === 401) {
      console.warn('⚠️ Token expired');
      // Token expired, need to re-authenticate
      localStorage.removeItem('pi_access_token');
      localStorage.removeItem('pi_user');
      return false;
    }
  } catch (error) {
    console.error('❌ Token check failed:', error);
    return false;
  }
};

// Use in useEffect to auto-refresh
useEffect(() => {
  const checkTokenValidity = async () => {
    if (localStorage.getItem('pi_access_token')) {
      const isValid = await refreshAccessToken();
      if (!isValid) {
        // Force re-authentication
        setPiUser(null);
        setAccessToken(null);
      }
    }
  };

  const interval = setInterval(checkTokenValidity, 5 * 60 * 1000); // Check every 5 minutes
  return () => clearInterval(interval);
}, []);
```

### 2. Add Error Recovery Strategies

```typescript
// Add to signIn function for better error handling
const signIn = async (scopes: string[] = PI_CONFIG.scopes) => {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Authentication attempt ${attempt}/${MAX_RETRIES}...`);
      
      // ... existing authentication code ...
      
      console.log('✅ Authentication succeeded');
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted
  throw new Error(
    `Authentication failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
};
```

### 3. Add Network Connectivity Detection

```typescript
// Add to PiContext.tsx
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => {
    console.log('📡 Network connection restored');
    setIsOnline(true);
    toast.success('Connection restored', { duration: 2000 });
  };

  const handleOffline = () => {
    console.log('📡 Network connection lost');
    setIsOnline(false);
    toast.error('No internet connection', { duration: 5000 });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Check in signIn
if (!isOnline) {
  throw new Error('No internet connection. Please check your connection.');
}
```

---

## 📊 Monitoring & Analytics

### 1. Add Authentication Events Tracking

```typescript
// Add event tracking for analytics
const trackAuthEvent = (event: string, details?: Record<string, any>) => {
  const authEvent = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Send to analytics service
  if (typeof gtag !== 'undefined') {
    gtag('event', `pi_auth_${event}`, details || {});
  }

  // Or log to Supabase
  console.log('📊 Auth Event:', authEvent);
};

// Use in signIn
trackAuthEvent('signin_started', { scopes });
// ...
trackAuthEvent('signin_success', { username: piUser.username });
// ...
trackAuthEvent('signin_error', { error: errorMessage });
```

### 2. Add Error Rate Monitoring

```typescript
// Track authentication errors for dashboard monitoring
const recordAuthError = async (errorType: string, errorMessage: string) => {
  try {
    await supabase
      .from('auth_error_logs')
      .insert({
        error_type: errorType,
        error_message: errorMessage,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
};

// Use in error handlers
trackAuthEvent('signin_error', { 
  errorType: 'pi_api_verification_failed',
  errorCode: piApiResp.status 
});
```

---

## 🔐 Security Considerations

### 1. Validate Token Format

```typescript
// Validate JWT token structure
const isValidToken = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode header and payload (don't verify signature client-side)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('⚠️ Token is expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Invalid token format:', error);
    return false;
  }
};

// Use before storing
if (!isValidToken(accessToken)) {
  throw new Error('Invalid access token format');
}
```

### 2. Secure Token Storage

```typescript
// Use sessionStorage for more security (cleared on tab close)
// But Pi Browser may require localStorage for persistence

const storeToken = (token: string) => {
  try {
    localStorage.setItem('pi_access_token', token);
    
    // Optional: Store token expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    localStorage.setItem('pi_token_expiry', expiresAt.toString());
  } catch (error) {
    console.error('Failed to store token:', error);
  }
};

const getToken = (): string | null => {
  try {
    const token = localStorage.getItem('pi_access_token');
    const expiry = localStorage.getItem('pi_token_expiry');

    // Check expiry
    if (token && expiry && parseInt(expiry) < Date.now()) {
      localStorage.removeItem('pi_access_token');
      localStorage.removeItem('pi_token_expiry');
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
};
```

---

## 🎯 Performance Optimizations

### 1. Lazy Load Pi SDK

```typescript
// Load Pi SDK only when needed
const loadPiSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Pi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.minepi.com/pi-sdk.js';
    script.async = true;
    script.onload = () => {
      if (window.Pi) {
        resolve();
      } else {
        reject(new Error('Pi SDK failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Pi SDK script'));
    document.head.appendChild(script);
  });
};
```

### 2. Cache User Profile

```typescript
// Add profile caching to reduce API calls
const [profileCache, setProfileCache] = useState<Record<string, any>>({});

const getUserProfile = async (identifier: string) => {
  // Check cache first
  if (profileCache[identifier]) {
    console.log('📦 Returning cached profile');
    return profileCache[identifier];
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('pi_username', identifier)
    .single();

  if (data) {
    // Cache for 5 minutes
    setProfileCache(prev => ({
      ...prev,
      [identifier]: { ...data, cacheTime: Date.now() }
    }));
  }

  return data;
};
```

---

## 📝 Testing Checklist

### Unit Tests
```typescript
describe('Pi Authentication', () => {
  test('isPiBrowserEnv detects Pi Browser', () => {
    // Mock navigator.userAgent
    expect(isPiBrowserEnv()).toBe(false); // In test environment
  });

  test('signIn throws error when not in Pi Browser', async () => {
    // Should throw with helpful message
  });

  test('signIn handles scope fallback', async () => {
    // Should retry with ['username'] if payments fails
  });

  test('signIn validates access token', async () => {
    // Should call Pi API to verify token
  });
});
```

### Integration Tests
```typescript
describe('Pi Authentication Flow', () => {
  test('Complete authentication flow succeeds', async () => {
    // 1. Call Pi.authenticate()
    // 2. Verify with Pi API
    // 3. Save to Supabase
    // 4. Check user state updated
  });

  test('Auth persists after page reload', async () => {
    // 1. Sign in
    // 2. Reload page
    // 3. User should still be logged in
  });

  test('Invalid token is cleared on reload', async () => {
    // 1. Set invalid token in localStorage
    // 2. Reload page
    // 3. User should be logged out
  });
});
```

---

## 🚀 Deployment Checklist

- [ ] All API keys match Pi Developer Portal
- [ ] Validation key is accessible at https://droplink.space/validation-key.txt
- [ ] manifest.json is correct and accessible
- [ ] HTTPS is enabled (required by Pi API)
- [ ] Content Security Policy allows Pi SDK domains
- [ ] Error logging is configured (Supabase or Sentry)
- [ ] Analytics tracking is set up
- [ ] Rate limiting is configured on backend
- [ ] Token validation is implemented on backend
- [ ] Test in sandbox environment first
- [ ] Get approval from Pi Developer Portal
- [ ] Deploy to mainnet with confidence

---

## 🎓 Educational Resources

**Official Docs:**
- https://pi-apps.github.io/community-developer-guide/
- https://github.com/pi-apps/pi-platform-docs

**Demo Applications:**
- Pi Demo App: https://github.com/pi-apps/demo
- Community Examples: https://github.com/pi-apps/

**Community Support:**
- Discord: https://pi.community
- Reddit: r/PiNetwork
- Developer Forum: https://pi-apps.github.io/community-developer-guide/docs/communitySupport/

---

## 💬 Getting Help

If you encounter issues:

1. **Check Browser Console** - Look for detailed error messages
2. **Review This Document** - Common issues are covered above
3. **Check Official Docs** - https://github.com/pi-apps/pi-platform-docs
4. **Test in Sandbox First** - Before troubleshooting in mainnet
5. **Ask Community** - Pi Network Discord has active developers

Your implementation is solid. These are advanced improvements for production robustness!
