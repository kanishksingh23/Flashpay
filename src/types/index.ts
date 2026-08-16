export type MerchantPlan = 'free' | 'solo' | 'pro';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank' | 'card';

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  plan: MerchantPlan;
  soundbox_enabled: boolean;
  soundbox_volume: number;
  surcharge_enabled: boolean;
  state: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  emoji: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  merchant_id: string;
  invoice_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  amount: number;
  status: InvoiceStatus;
  payment_method: PaymentMethod | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  services: ServiceLineItem[];
  created_at: string;
  paid_at: string | null;
}

export interface ServiceLineItem {
  name: string;
  price: number;
  quantity: number;
}

export interface PushSubscription {
  id: string;
  merchant_id: string;
  subscription: PushSubscriptionJSON;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  pending_revenue: number;
  invoice_count: number;
  paid_count: number;
  savings_vs_card: number;
}
