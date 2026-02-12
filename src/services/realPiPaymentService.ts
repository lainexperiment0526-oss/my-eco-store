/**
 * Real Pi Payment Service for DropLink
 * Implements 3-phase Pi payment flow per Pi Network documentation
 */

import { PI_CONFIG } from '@/config/piConfig';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentItem {
  id: string;
  name: string;
  type: 'subscription' | 'product' | 'coins';
  price: number;
  description: string;
  metadata?: any;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  txid?: string;
  error?: string;
}

export class RealPiPaymentService {
  private static instance: RealPiPaymentService;

  private constructor() {}

  public static getInstance(): RealPiPaymentService {
    if (!RealPiPaymentService.instance) {
      RealPiPaymentService.instance = new RealPiPaymentService();
    }
    return RealPiPaymentService.instance;
  }

  /**
   * Process a payment through Pi Network
   */
  async processPayment(item: PaymentItem, onProgress?: (phase: string, details: any) => void): Promise<PaymentResult> {
    try {
      console.log('🛒 Processing payment for:', item.name);
      onProgress?.('init', { amount: item.price, memo: item.name });

      // Check Pi SDK availability
      if (typeof window === 'undefined' || typeof window.Pi === 'undefined') {
        throw new Error('Pi SDK not available. Please open in Pi Browser.');
      }

      // Authenticate with Pi Network
      const currentUser = await this.authenticateUser();
      if (!currentUser) {
        throw new Error('Pi Network authentication required');
      }

      console.log('🔐 Authenticated user:', currentUser.username);
      onProgress?.('authenticated', { username: currentUser.username });

      // Get profileId from localStorage (Pi authentication stores it there)
      const storedProfile = localStorage.getItem('pi_user_profile');
      let profileId = '';
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          profileId = parsed.id || '';
        } catch (e) {
          console.warn('Failed to parse stored profile');
        }
      }

      // Build complete metadata including profileId
      const paymentMetadata = {
        itemId: item.id,
        itemType: item.type,
        itemName: item.name,
        userId: currentUser.uid,
        username: currentUser.username,
        profileId: profileId,
        timestamp: Date.now(),
        ...item.metadata
      };

      console.log('[PAYMENT] Full metadata:', paymentMetadata);

      // Create payment with 3-phase flow
      const payment = await this.createPaymentWithCallbacks({
        amount: item.price,
        memo: `${item.name} - DropLink`,
        metadata: paymentMetadata
      }, onProgress);

      console.log('✅ Payment completed successfully:', payment);
      
      return {
        success: true,
        paymentId: payment.identifier,
        txid: payment.transaction?.txid,
      };

    } catch (error) {
      console.error('❌ Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Authenticate user with Pi Network
   */
  private async authenticateUser() {
    try {
      const auth = await window.Pi.authenticate(['username', 'payments', 'wallet_address']);
      return auth.user;
    } catch (error) {
      console.error('[PAYMENT] Authentication failed:', error);
      throw new Error('Pi Network authentication required');
    }
  }

  /**
   * Create payment with 3-phase callback flow
   */
  private async createPaymentWithCallbacks(params: {
    amount: number;
    memo: string;
    metadata: any;
  }, onProgress?: (phase: string, details: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const paymentData: any = {
        amount: params.amount,
        memo: params.memo,
        metadata: params.metadata,
      };

      // Set receiver wallet address
      if (PI_CONFIG?.PAYMENT_RECEIVER_WALLET) {
        paymentData.to = PI_CONFIG.PAYMENT_RECEIVER_WALLET;
      }

      console.log('[PI PAYMENT] Creating payment with:', JSON.stringify(paymentData, null, 2));

      const callbacks = {
        // Phase I: Server-Side Approval
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('[PAYMENT] ⏳ Phase I - Server approval for:', paymentId);
          onProgress?.('approval', { paymentId });

          try {
            const approved = await this.approvePaymentOnServer(paymentId, params.metadata);
            
            if (!approved) {
              throw new Error('Payment approval failed on server');
            }
            
            console.log('[PAYMENT] ✅ Phase I - Payment approved');
            onProgress?.('approved', { paymentId });
          } catch (error) {
            console.error('[PAYMENT] ❌ Phase I - Approval failed:', error);
            reject(error);
          }
        },

        // Phase III: Server-Side Completion
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('[PAYMENT] ⏳ Phase III - Completing payment:', paymentId, 'TxID:', txid);
          onProgress?.('completion', { paymentId, txid });

          try {
            const completed = await this.completePaymentOnServer(paymentId, txid, params.metadata);
            
            if (!completed) {
              throw new Error('Payment completion failed on server');
            }
            
            console.log('[PAYMENT] ✅ Phase III - Payment completed');
            onProgress?.('completed', { paymentId, txid });
            
            resolve({
              identifier: paymentId,
              transaction: { txid }
            });
          } catch (error) {
            console.error('[PAYMENT] ❌ Phase III - Completion failed:', error);
            reject(error);
          }
        },

        // User cancelled
        onCancel: (paymentId: string) => {
          console.log('[PAYMENT] ⚠️ Payment cancelled by user:', paymentId);
          onProgress?.('cancelled', { paymentId });
          reject(new Error('Payment cancelled by user'));
        },

        // Error occurred
        onError: (error: Error, payment?: any) => {
          console.error('[PAYMENT] ❌ Payment error:', error, payment);
          onProgress?.('error', { error: error.message, payment });
          reject(error);
        },
      };

      console.log('[PAYMENT] 📝 Creating payment with Pi SDK...');
      window.Pi.createPayment(paymentData, callbacks);
    });
  }

  /**
   * Approve payment on server (calls Supabase edge function)
   */
  private async approvePaymentOnServer(paymentId: string, metadata: any): Promise<boolean> {
    try {
      console.log('[PAYMENT] 📡 Sending approval request to server...');
      
      // Use supabase.functions.invoke for proper edge function calls
      const { data, error } = await supabase.functions.invoke('pi-payment-approve', {
        body: { paymentId, metadata }
      });

      if (error) {
        console.error('[PAYMENT] ❌ Approval error:', error);
        const errorMsg = error.message || 'Approval failed';
        const details = (data as any)?.details || '';
        throw new Error(`${errorMsg}${details ? ' - ' + details : ''}`);
      }

      if (!data || data.success !== true) {
        console.error('[PAYMENT] ❌ Approval failed:', data);
        const errorMsg = (data as any)?.error || 'Approval failed';
        const details = (data as any)?.details || 'Edge Function returned unsuccessful response';
        throw new Error(`${errorMsg} - ${details}`);
      }

      console.log('[PAYMENT] Approval response:', data);
      return true;
      
    } catch (error) {
      console.error('[PAYMENT] ❌ Approval request failed:', error);
      throw error;
    }
  }

  /**
   * Complete payment on server (calls Supabase edge function)
   */
  private async completePaymentOnServer(paymentId: string, txid: string, metadata: any): Promise<boolean> {
    try {
      console.log('[PAYMENT] 📡 Sending completion request to server...');
      
      // Use supabase.functions.invoke for proper edge function calls
      const { data, error } = await supabase.functions.invoke('pi-payment-complete', {
        body: { paymentId, txid, metadata }
      });

      if (error) {
        console.error('[PAYMENT] ❌ Completion error:', error);
        const errorMsg = error.message || 'Completion failed';
        const details = (data as any)?.details || '';
        throw new Error(`${errorMsg}${details ? ' - ' + details : ''}`);
      }

      if (!data || data.success !== true) {
        console.error('[PAYMENT] ❌ Completion failed:', data);
        const errorMsg = (data as any)?.error || 'Completion failed';
        const details = (data as any)?.details || 'Edge Function returned unsuccessful response';
        throw new Error(`${errorMsg} - ${details}`);
      }

      console.log('[PAYMENT] Completion response:', data);
      return true;
      
    } catch (error) {
      console.error('[PAYMENT] ❌ Completion request failed:', error);
      throw error;
    }
  }
}

export const realPiPaymentService = RealPiPaymentService.getInstance();
