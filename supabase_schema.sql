-- FlashPay US: Supabase Database Schema
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'solo', -- free, solo, pro
  soundbox_enabled BOOLEAN DEFAULT TRUE,
  soundbox_volume INTEGER DEFAULT 80,
  surcharge_enabled BOOLEAN DEFAULT FALSE,
  state TEXT DEFAULT 'TX',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quick-select services catalog
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  emoji TEXT DEFAULT '⭐',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_method TEXT, -- bank, card
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 5. Web Push Subscriptions for Soundbox
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Merchants can read and update their own profile
CREATE POLICY "Merchants own access" ON public.merchants
  FOR ALL USING (auth.uid() = user_id);

-- Invoices are readable by their merchant, and public read for checkout
CREATE POLICY "Merchant invoice access" ON public.invoices
  FOR ALL USING (auth.uid() = merchant_id);

CREATE POLICY "Public invoice checkout view" ON public.invoices
  FOR SELECT USING (true);

-- Services access
CREATE POLICY "Merchant service catalog access" ON public.services
  FOR ALL USING (auth.uid() = merchant_id);

-- Push subscriptions access
CREATE POLICY "Merchant push subscriptions access" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = merchant_id);

-- 8. Enable Realtime for Invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
