/**
 * Pi SDK Initialization for DropLink
 * Based on official Pi Platform documentation
 * Tutorial: FlappyPi implementation
 */

import { PI_CONFIG } from './pi-config';

// Initialize Pi SDK
let Pi: any = null;

// Load Pi SDK asynchronously
const initializePiSDKAsync = async () => {
  try {
    // Pi SDK is loaded via script tag in index.html
    // Just check if window.Pi exists
    if (typeof window !== 'undefined' && window.Pi) {
      Pi = window.Pi;
      console.log('✅ Pi SDK loaded successfully');
    } else {
      console.warn('⚠️ Pi SDK not available');
      Pi = null;
    }
  } catch (error) {
    console.warn('⚠️ Pi SDK not available');
    Pi = null;
  }
};

// Initialize Pi SDK
export const initializePiSDK = async () => {
  console.log('🔧 Starting Pi SDK initialization...');

  if (!Pi) {
    await initializePiSDKAsync();
  }

  try {
    if (!Pi) {
      console.warn('Pi SDK not available');
      return false;
    }

    // Initialize Pi SDK
    await Pi.init({
      version: PI_CONFIG.SDK.version,
      sandbox: PI_CONFIG.SDK.sandbox,
    });
    console.log('✅ Pi SDK initialized');
    return true;
  } catch (error) {
    console.error('❌ Pi SDK initialization failed:', error);
    return false;
  }
};

// Pi Browser detection
export function isPiBrowser() {
  // Pi Browser detection is handled elsewhere or can be implemented here if needed
  return typeof window !== 'undefined' && (window.Pi !== undefined);
}

// Authentication functions
export const piAuth = {
  authenticate: async () => {
    try {
      if (!Pi) {
        throw new Error('Pi SDK not available');
      }

      // Optionally, add Pi Browser detection here if needed

      console.log('🔐 Starting authentication...');

      const auth = await Pi.authenticate(['username', 'payments', 'wallet_address'], onIncompletePaymentFound);

      if (!auth || !auth.user || !auth.user.username) {
        throw new Error('Authentication failed');
      }

      console.log('✅ Authentication successful');
      return auth;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  },

  currentUser: () => {
    // Pi SDK doesn't have currentUser method, return from localStorage
    try {
      const storedAuth = localStorage.getItem('pi-auth-state');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        return authData.user;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  },

  isAuthenticated: () => {
    // Check if we have stored auth state
    try {
      const storedAuth = localStorage.getItem('pi-auth-state');
      return !!storedAuth;
    } catch (error) {
      return false;
    }
  },

  signOut: () => {
    // Clear stored auth state
    try {
      localStorage.removeItem('pi-auth-state');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
};

// Payment functions
export const piPayment = {
  createPayment: async (amount: number, memo: string, metadata?: any) => {
    try {
      if (!Pi) {
        throw new Error('Pi SDK not available');
      }
      const payment = await Pi.createPayment({
        amount: amount,
        memo: memo,
        metadata: metadata || {},
      });
      console.log('💳 Payment created:', payment);
      return payment;
    } catch (error) {
      console.error('❌ Payment creation failed:', error);
      throw error;
    }
  },
  completePayment: async (paymentId: string, txid: string) => {
    try {
      if (!Pi) {
        throw new Error('Pi SDK not available');
      }
      const result = await Pi.completePayment(paymentId, txid);
      console.log('✅ Payment completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Payment completion failed:', error);
      throw error;
    }
  },
  getPaymentStatus: async (paymentId: string) => {
    try {
      if (!Pi) {
        throw new Error('Pi SDK not available');
      }
      return await Pi.getPaymentStatus(paymentId);
    } catch (error) {
      console.error('❌ Get payment status failed:', error);
      throw error;
    }
  }
};

// Handle incomplete payments
const onIncompletePaymentFound = (payment: any) => {
  console.log('🔄 Incomplete payment found:', payment);
  if (Pi) {
    return Pi.completePayment(payment.identifier, payment.transaction.txid);
  }
  return Promise.reject(new Error('Pi SDK not available'));
};

export { Pi };

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  initializePiSDK();
}
