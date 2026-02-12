// Database sync utilities for DropLink features
import { supabase } from '@/integrations/supabase/client';

export interface PaymentLink {
  id: string;
  amount: number;
  description: string;
  type: 'product' | 'donation' | 'tip' | 'subscription' | 'group';
  url: string;
  created: Date;
  active: boolean;
  totalReceived: number;
  transactionCount: number;
}

export interface DatabaseSyncResult {
  success: boolean;
  message: string;
  syncedItems?: number;
  totalItems?: number;
  error?: Error;
}

/**
 * Check if payment_links table exists (after migration)
 */
export const checkPaymentLinksTableExists = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('payment_links' as any)
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Sync payment links to dedicated database table
 */
export const syncPaymentLinksToDatabase = async (
  profileId: string,
  piUserId: string,
  paymentLinks: PaymentLink[]
): Promise<DatabaseSyncResult> => {
  try {
    // Check if the table exists
    const tableExists = await checkPaymentLinksTableExists();
    if (!tableExists) {
      return {
        success: false,
        message: 'Payment links table not available. Data saved to profile settings.',
      };
    }

    // Try to use the sync function if available (fallback to manual sync)
    try {
      const { data, error } = await supabase.rpc('sync_user_payment_links' as any, {
        p_profile_id: profileId,
        p_pi_user_id: piUserId,
        p_payment_links: JSON.stringify(paymentLinks.map(link => ({
          id: link.id,
          amount: link.amount,
          description: link.description,
          type: link.type,
          url: link.url,
          created: link.created.toISOString(),
          active: link.active,
          totalReceived: link.totalReceived,
          transactionCount: link.transactionCount
        })))
      });

      if (error) throw error;

      const result = data?.[0] as any;
      return {
        success: true,
        message: `Successfully synced ${result?.synced_links || paymentLinks.length} payment links to database`,
        syncedItems: result?.synced_links || paymentLinks.length,
        totalItems: result?.total_links || paymentLinks.length
      };
    } catch (rpcError) {
      // Fallback to direct table operations
      console.warn('RPC function not available, using direct sync');
      
      // Delete existing links
      await supabase.from('payment_links' as any).delete().eq('pi_user_id', piUserId);
      
      // Insert new links
      const linksToInsert = paymentLinks.map(link => ({
        profile_id: profileId,
        pi_user_id: piUserId,
        link_id: link.id,
        amount: link.amount,
        description: link.description,
        payment_type: link.type,
        is_active: link.active,
        payment_url: link.url,
        total_received: link.totalReceived,
        transaction_count: link.transactionCount,
        created_at: link.created.toISOString()
      }));
      
      if (linksToInsert.length > 0) {
        const { error: insertError } = await supabase.from('payment_links' as any).insert(linksToInsert);
        if (insertError) throw insertError;
      }
      
      return {
        success: true,
        message: `Successfully synced ${paymentLinks.length} payment links to database`,
        syncedItems: paymentLinks.length,
        totalItems: paymentLinks.length
      };
    }

  } catch (error) {
    console.error('Payment links database sync error:', error);
    return {
      success: false,
      message: 'Failed to sync payment links to database',
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
};

/**
 * Load payment links from database
 */
export const loadPaymentLinksFromDatabase = async (
  piUserId: string
): Promise<PaymentLink[]> => {
  try {
    const tableExists = await checkPaymentLinksTableExists();
    if (!tableExists) {
      return [];
    }

    // Try RPC function first, fallback to direct query
    try {
      const { data, error } = await supabase.rpc('get_user_payment_links' as any, {
        p_pi_user_id: piUserId
      });

      if (error) throw error;

      return (data || []).map((link: any) => ({
        id: link.link_id,
        amount: parseFloat(link.amount),
        description: link.description,
        type: link.payment_type,
        url: link.payment_url,
        created: new Date(link.created_at),
        active: link.is_active,
        totalReceived: parseFloat(link.total_received) || 0,
        transactionCount: link.transaction_count || 0
      }));
    } catch (rpcError) {
      // Fallback to direct query
      const { data, error } = await supabase
        .from('payment_links' as any)
        .select('*')
        .eq('pi_user_id', piUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((link: any) => ({
        id: link.link_id,
        amount: parseFloat(link.amount),
        description: link.description,
        type: link.payment_type,
        url: link.payment_url,
        created: new Date(link.created_at),
        active: link.is_active,
        totalReceived: parseFloat(link.total_received) || 0,
        transactionCount: link.transaction_count || 0
      }));
    }

  } catch (error) {
    console.error('Failed to load payment links from database:', error);
    return [];
  }
};

/**
 * Track feature usage in database
 */
export const trackFeatureUsage = async (
  profileId: string,
  featureName: string,
  usageType: string,
  usageData: Record<string, any> = {}
): Promise<void> => {
  try {
    await supabase.from('analytics').insert({
      profile_id: profileId,
      event_type: 'feature_usage',
      event_data: {
        feature_name: featureName,
        usage_type: usageType,
        ...usageData,
        timestamp: new Date().toISOString()
      },
      user_agent: navigator.userAgent,
      session_id: sessionStorage.getItem('session_id') || `session_${Date.now()}`
    });
  } catch (error) {
    console.warn('Feature tracking failed:', error);
  }
};

/**
 * Sync all profile features to database
 */
export const syncAllFeaturesToDatabase = async (
  profileId: string,
  piUserId: string | undefined,
  profileData: any
): Promise<DatabaseSyncResult> => {
  try {
    let syncResults: string[] = [];

    // 1. Sync payment links if available
    if (piUserId && profileData.paymentLinks?.length > 0) {
      const paymentResult = await syncPaymentLinksToDatabase(
        profileId,
        piUserId,
        profileData.paymentLinks
      );
      if (paymentResult.success) {
        syncResults.push(`Payment links: ${paymentResult.syncedItems}/${paymentResult.totalItems}`);
      }
    }

    // 2. Track usage
    await trackFeatureUsage(profileId, 'full_sync', 'auto_save', {
      has_payment_links: (profileData.paymentLinks?.length || 0) > 0,
      has_custom_links: (profileData.customLinks?.length || 0) > 0,
      has_products: (profileData.products?.length || 0) > 0,
      sync_timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: `Database sync completed: ${syncResults.join(', ')}`,
      syncedItems: syncResults.length
    };

  } catch (error) {
    console.error('Full database sync error:', error);
    return {
      success: false,
      message: 'Failed to sync all features to database',
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
};

/**
 * Backup data to localStorage with enhanced metadata
 */
export const backupDataToLocalStorage = (
  userKey: string,
  profileData: any,
  syncResult?: DatabaseSyncResult
): void => {
  try {
    const backup = {
      ...profileData,
      lastBackup: new Date().toISOString(),
      databaseSync: syncResult || null,
      version: '2.0.0'
    };

    localStorage.setItem(userKey, JSON.stringify(backup));
    localStorage.setItem(`${userKey}_metadata`, JSON.stringify({
      lastBackup: backup.lastBackup,
      databaseSyncStatus: syncResult?.success || false,
      version: backup.version
    }));

  } catch (error) {
    console.error('LocalStorage backup failed:', error);
  }
};

/**
 * Get comprehensive sync status
 */
export const getSyncStatus = async (piUserId?: string) => {
  const paymentLinksTableExists = await checkPaymentLinksTableExists();
  
  return {
    databaseAvailable: true,
    paymentLinksTableExists,
    featuresSupported: {
      paymentLinks: paymentLinksTableExists,
      customLinks: true,
      products: true,
      analytics: true
    },
    canMigrate: paymentLinksTableExists,
    piUserConnected: !!piUserId
  };
};

export default {
  syncPaymentLinksToDatabase,
  loadPaymentLinksFromDatabase,
  trackFeatureUsage,
  syncAllFeaturesToDatabase,
  backupDataToLocalStorage,
  getSyncStatus,
  checkPaymentLinksTableExists
};