/**
 * Pi Payment Integration
 * Complete 3-phase payment flow implementation
 * Based on official Pi Platform documentation
 */

import axios from 'axios';
import { PI_CONFIG } from '@/config/pi-config';

export interface PaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
}

export interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: any) => void;
}

export interface PaymentDTO {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  from_address: string;
  to_address: string;
  direction: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentId?: string;
  txid?: string;
  error?: string;
}

export class PiPaymentService {
  /**
   * Phase I: Create Payment and get Server Approval
   */
  static async createPayment(
    paymentData: PaymentData,
    accessToken: string,
    onProgress?: (phase: string, details: any) => void
  ): Promise<CreatePaymentResult> {
    console.log('[PI PAYMENT] 🚀 Starting payment creation...');
    onProgress?.('init', { amount: paymentData.amount, memo: paymentData.memo });
    
    try {
      // Validate Pi SDK availability
      if (typeof window === 'undefined' || !window.Pi) {
        throw new Error('Pi SDK not available');
      }
      
      let paymentId = '';
      let transactionId = '';
      
      // Create payment with callbacks
      const paymentPromise = new Promise<CreatePaymentResult>((resolve, reject) => {
        const callbacks: PaymentCallbacks = {
          // Phase I: Server-Side Approval
          onReadyForServerApproval: async (pId: string) => {
            console.log('[PI PAYMENT] ⏳ Phase I - Server approval needed for payment:', pId);
            paymentId = pId;
            onProgress?.('approval', { paymentId: pId });
            
            try {
              // Send to your server for approval
              const approved = await this.approvePayment(pId, accessToken);
              
              if (!approved) {
                throw new Error('Payment approval failed on server');
              }
              
              console.log('[PI PAYMENT] ✅ Phase I - Payment approved by server');
              onProgress?.('approved', { paymentId: pId });
            } catch (error) {
              console.error('[PI PAYMENT] ❌ Phase I - Approval failed:', error);
              reject(error);
            }
          },
          
          // Phase III: Server-Side Completion
          onReadyForServerCompletion: async (pId: string, txid: string) => {
            console.log('[PI PAYMENT] ⏳ Phase III - Completing payment:', pId, 'Transaction:', txid);
            paymentId = pId;
            transactionId = txid;
            onProgress?.('completion', { paymentId: pId, txid });
            
            try {
              // Verify transaction on blockchain and complete
              const completed = await this.completePayment(pId, txid, accessToken);
              
              if (!completed) {
                throw new Error('Payment completion failed on server');
              }
              
              console.log('[PI PAYMENT] ✅ Phase III - Payment completed successfully');
              onProgress?.('completed', { paymentId: pId, txid });
              
              resolve({
                success: true,
                paymentId: pId,
                txid: txid,
              });
            } catch (error) {
              console.error('[PI PAYMENT] ❌ Phase III - Completion failed:', error);
              reject(error);
            }
          },
          
          // User cancelled
          onCancel: (pId: string) => {
            console.log('[PI PAYMENT] ⚠️ Payment cancelled by user:', pId);
            onProgress?.('cancelled', { paymentId: pId });
            resolve({
              success: false,
              paymentId: pId,
              error: 'User cancelled payment',
            });
          },
          
          // Error occurred
          onError: (error: Error, payment?: any) => {
            console.error('[PI PAYMENT] ❌ Payment error:', error, payment);
            onProgress?.('error', { error: error.message, payment });
            reject(error);
          },
        };
        
        // Create the payment
        console.log('[PI PAYMENT] 📝 Calling Pi.createPayment()...');
        window.Pi.createPayment(paymentData, callbacks);
      });
      
      return await paymentPromise;
      
    } catch (error) {
      console.error('[PI PAYMENT] ❌ Payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Approve payment on server (Phase I)
   * Call your backend API to approve with Pi Servers
   */
  private static async approvePayment(paymentId: string, accessToken: string): Promise<boolean> {
    try {
      console.log('[PI PAYMENT] 📡 Sending approval request to server...');
      
      // Get Supabase URL from environment or config
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oeisqfvwqutfmdjcrfyh.supabase.co';
      
      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/pi-payment-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Approval failed: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      return result.success === true;
      
    } catch (error) {
      console.error('[PI PAYMENT] ❌ Approval request failed:', error);
      
      // Fallback: Direct Pi API call (requires API key on client - not recommended)
      // Only use if you don't have a backend endpoint yet
      console.warn('[PI PAYMENT] ⚠️ Using direct Pi API approval (not recommended for production)');
      return await this.approvePaymentDirect(paymentId);
    }
  }
  
  /**
   * Direct Pi API approval (fallback, not recommended for production)
   */
  private static async approvePaymentDirect(paymentId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${PI_CONFIG.BASE_URL}/v2/payments/${paymentId}/approve`,
        null,
        {
          headers: {
            'Authorization': `key ${PI_CONFIG.API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error('[PI PAYMENT] ❌ Direct approval failed:', error);
      return false;
    }
  }
  
  /**
   * Complete payment on server (Phase III)
   * Verify blockchain transaction and complete payment
   */
  private static async completePayment(
    paymentId: string,
    txid: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      console.log('[PI PAYMENT] 📡 Sending completion request to server...');
      
      // Get Supabase URL from environment or config
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oeisqfvwqutfmdjcrfyh.supabase.co';
      
      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/pi-payment-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentId, txid }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Completion failed: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      // CRITICAL: Only mark as complete if transaction verified
      if (!result.success) {
        console.error('[PI PAYMENT] ⚠️ Transaction not verified on blockchain!');
        return false;
      }
      
      return result.success === true;
      
    } catch (error) {
      console.error('[PI PAYMENT] ❌ Completion request failed:', error);
      
      // Fallback: Direct Pi API call
      console.warn('[PI PAYMENT] ⚠️ Using direct Pi API completion (not recommended for production)');
      return await this.completePaymentDirect(paymentId, txid);
    }
  }
  
  /**
   * Direct Pi API completion (fallback, not recommended for production)
   */
  private static async completePaymentDirect(paymentId: string, txid: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${PI_CONFIG.BASE_URL}/v2/payments/${paymentId}/complete`,
        { txid },
        {
          headers: {
            'Authorization': `key ${PI_CONFIG.API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // CRITICAL: Check if transaction was verified
      const payment: PaymentDTO = response.data;
      
      if (!payment.transaction?.verified) {
        console.error('[PI PAYMENT] ⚠️ SECURITY WARNING: Transaction not verified!');
        return false;
      }
      
      return payment.status.developer_completed;
    } catch (error) {
      console.error('[PI PAYMENT] ❌ Direct completion failed:', error);
      return false;
    }
  }
  
  /**
   * Get payment details from Pi API
   */
  static async getPayment(paymentId: string, accessToken: string): Promise<PaymentDTO | null> {
    try {
      const response = await axios.get(
        `${PI_CONFIG.BASE_URL}/v2/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[PI PAYMENT] ❌ Failed to get payment:', error);
      return null;
    }
  }
  
  /**
   * Check for incomplete payments on app launch
   */
  static handleIncompletePayment(payment: any) {
    console.log('[PI PAYMENT] ⚠️ Incomplete payment found:', payment);
    
    // Show UI to let user know they have an incomplete payment
    // They can either complete it or cancel it
    
    return payment;
  }
}

/**
 * Helper: Format Pi amount for display
 */
export function formatPiAmount(amount: number): string {
  return `${amount.toFixed(2)} π`;
}

/**
 * Helper: Validate payment amount
 */
export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum (1,000,000 π)' };
  }
  
  // Check precision (Pi supports up to 7 decimal places)
  const decimals = amount.toString().split('.')[1]?.length || 0;
  if (decimals > 7) {
    return { valid: false, error: 'Amount has too many decimal places (max 7)' };
  }
  
  return { valid: true };
}
