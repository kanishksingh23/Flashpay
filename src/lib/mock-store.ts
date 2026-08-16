import type { Invoice, Merchant, Service } from '@/types';

const INITIAL_MERCHANT: Merchant = {
  id: 'demo-merchant-1',
  user_id: 'demo-user-1',
  business_name: "Apex Auto Care & Detailing",
  stripe_account_id: 'acct_demo123',
  stripe_onboarding_complete: true,
  plan: 'solo',
  soundbox_enabled: true,
  soundbox_volume: 85,
  surcharge_enabled: false,
  state: 'TX',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    merchant_id: 'demo-merchant-1',
    invoice_number: 'FP-8K9L-201',
    customer_name: 'Sarah Miller',
    customer_phone: '(512) 555-0143',
    amount: 250,
    status: 'paid',
    payment_method: 'bank',
    stripe_payment_intent_id: 'pi_demo_101',
    stripe_checkout_session_id: 'cs_demo_101',
    services: [
      { name: 'Full Interior & Exterior Detail', price: 200, quantity: 1 },
      { name: 'Ceramic Glass Treatment', price: 50, quantity: 1 },
    ],
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    paid_at: new Date(Date.now() - 1.5 * 3600000).toISOString(),
  },
  {
    id: 'inv-102',
    merchant_id: 'demo-merchant-1',
    invoice_number: 'FP-8K9L-202',
    customer_name: 'Marcus Vance',
    customer_phone: '(512) 555-0188',
    amount: 175,
    status: 'paid',
    payment_method: 'bank',
    stripe_payment_intent_id: 'pi_demo_102',
    stripe_checkout_session_id: 'cs_demo_102',
    services: [
      { name: 'Paint Decontamination & Wash', price: 175, quantity: 1 },
    ],
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    paid_at: new Date(Date.now() - 5.5 * 3600000).toISOString(),
  },
  {
    id: 'inv-103',
    merchant_id: 'demo-merchant-1',
    invoice_number: 'FP-8K9L-203',
    customer_name: 'David Reynolds',
    customer_phone: '(512) 555-0199',
    amount: 320,
    status: 'pending',
    payment_method: null,
    stripe_payment_intent_id: null,
    stripe_checkout_session_id: null,
    services: [
      { name: 'Full Service Detail + Engine Bay', price: 320, quantity: 1 },
    ],
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    paid_at: null,
  },
];

export class MockStore {
  private static STORAGE_KEY = 'flashpay_mock_data_v1';

  private static getStore() {
    if (typeof window === 'undefined') {
      return { merchant: INITIAL_MERCHANT, invoices: INITIAL_INVOICES };
    }
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const initial = { merchant: INITIAL_MERCHANT, invoices: INITIAL_INVOICES };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return { merchant: INITIAL_MERCHANT, invoices: INITIAL_INVOICES };
    }
  }

  private static saveStore(store: { merchant: Merchant; invoices: Invoice[] }) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event('flashpay_store_updated'));
  }

  static getMerchant(): Merchant {
    return this.getStore().merchant;
  }

  static updateMerchant(updates: Partial<Merchant>): Merchant {
    const store = this.getStore();
    store.merchant = { ...store.merchant, ...updates };
    this.saveStore(store);
    return store.merchant;
  }

  static getInvoices(): Invoice[] {
    return this.getStore().invoices;
  }

  static getInvoice(id: string): Invoice | undefined {
    return this.getStore().invoices.find((i: Invoice) => i.id === id);
  }

  static createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'paid_at' | 'status' | 'payment_method' | 'stripe_payment_intent_id' | 'stripe_checkout_session_id'>): Invoice {
    const store = this.getStore();
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now().toString(36)}`,
      status: 'pending',
      payment_method: null,
      stripe_payment_intent_id: null,
      stripe_checkout_session_id: null,
      created_at: new Date().toISOString(),
      paid_at: null,
    };
    store.invoices.unshift(newInvoice);
    this.saveStore(store);
    return newInvoice;
  }

  static markInvoicePaid(id: string, paymentMethod: 'bank' | 'card' = 'bank'): Invoice | undefined {
    const store = this.getStore();
    const invoice = store.invoices.find((i: Invoice) => i.id === id);
    if (invoice) {
      invoice.status = 'paid';
      invoice.payment_method = paymentMethod;
      invoice.paid_at = new Date().toISOString();
      this.saveStore(store);
    }
    return invoice;
  }

  static resetToDemo(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
    this.getStore();
  }
}
