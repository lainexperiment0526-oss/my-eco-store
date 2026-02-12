// New feature types for monetization, memberships, analytics

export interface MembershipTier {
  id: string;
  profile_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  perks: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipAccess {
  id: string;
  profile_id: string;
  member_user_id?: string;
  tier_id: string;
  status: 'active' | 'expired' | 'canceled';
  started_at: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

export interface Product {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  type: 'digital' | 'tip' | 'one_time';
  file_url?: string;
  status: 'active' | 'hidden' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  profile_id: string;
  product_id?: string;
  buyer_wallet?: string;
  buyer_email?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled';
  source_link_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LinkEvent {
  id: number;
  profile_id: string;
  link_id: string;
  event_type: 'click' | 'view';
  referrer?: string;
  device?: string;
  country?: string;
  utm: Record<string, string>;
  created_at: string;
}

export interface PurchaseEvent {
  id: number;
  profile_id: string;
  order_id?: string;
  source_link_id?: string;
  amount?: number;
  currency: string;
  created_at: string;
}

export interface EmailLead {
  id: string;
  profile_id: string;
  email: string;
  source_link_id?: string;
  source: 'capture_block' | 'popup' | 'checkout' | 'public_bio';
  metadata: Record<string, any>;
  created_at: string;
}

// Email capture block config for profile
export interface EmailCaptureBlock {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
  button_text?: string;
  success_message?: string;
  is_active: boolean;
  sort_order: number;
}

// Analytics summary
export interface AnalyticsSummary {
  total_clicks: number;
  total_views: number;
  total_revenue: number;
  total_leads: number;
  top_links: Array<{
    link_id: string;
    clicks: number;
    revenue: number;
  }>;
  devices: Record<string, number>;
  countries: Record<string, number>;
}
