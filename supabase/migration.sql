-- ============================================================
-- QR Lottery SaaS - Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. BUSINESSES
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  board_headline TEXT NOT NULL DEFAULT 'Scan & Win!',
  board_subheadline TEXT NOT NULL DEFAULT 'Try your luck and win amazing prizes!',
  board_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
  board_text_color TEXT NOT NULL DEFAULT '#000000',
  board_accent_color TEXT NOT NULL DEFAULT '#FF6B00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX idx_campaigns_slug ON public.campaigns(slug);

-- 3. PRIZES
CREATE TABLE public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  probability REAL NOT NULL,
  color TEXT NOT NULL DEFAULT '#FF6B00',
  total_quantity INTEGER,
  awarded_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prizes_campaign_id ON public.prizes(campaign_id);

-- 4. PARTICIPANTS
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  prize_id UUID REFERENCES public.prizes(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, email)
);

CREATE INDEX idx_participants_campaign_id ON public.participants(campaign_id);
CREATE INDEX idx_participants_email ON public.participants(email);

-- ============================================================
-- RPC: Atomic increment for awarded_count
-- ============================================================
CREATE OR REPLACE FUNCTION increment_awarded_count(prize_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.prizes
  SET awarded_count = awarded_count + 1
  WHERE id = prize_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- BUSINESSES
CREATE POLICY "businesses_select_own" ON public.businesses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "businesses_insert_own" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "businesses_update_own" ON public.businesses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CAMPAIGNS (owner access)
CREATE POLICY "campaigns_select_own" ON public.campaigns
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "campaigns_insert_own" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "campaigns_update_own" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "campaigns_delete_own" ON public.campaigns
  FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- CAMPAIGNS (public read for active campaigns - customers need this)
CREATE POLICY "campaigns_select_public_active" ON public.campaigns
  FOR SELECT TO anon
  USING (is_active = true);

-- PRIZES (owner access)
CREATE POLICY "prizes_select_own" ON public.prizes
  FOR SELECT TO authenticated
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.businesses b ON c.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "prizes_insert_own" ON public.prizes
  FOR INSERT TO authenticated
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.businesses b ON c.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "prizes_update_own" ON public.prizes
  FOR UPDATE TO authenticated
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.businesses b ON c.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "prizes_delete_own" ON public.prizes
  FOR DELETE TO authenticated
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.businesses b ON c.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

-- PRIZES (public read for active campaigns - customers need to see wheel segments)
CREATE POLICY "prizes_select_public" ON public.prizes
  FOR SELECT TO anon
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE is_active = true));

-- PARTICIPANTS (owner can read)
CREATE POLICY "participants_select_own" ON public.participants
  FOR SELECT TO authenticated
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.businesses b ON c.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));

-- PARTICIPANTS (anon can insert for active campaigns)
CREATE POLICY "participants_insert_anon" ON public.participants
  FOR INSERT TO anon
  WITH CHECK (campaign_id IN (SELECT id FROM public.campaigns WHERE is_active = true));

-- ============================================================
-- WHEEL CUSTOMIZATION: Add play page colors & logo to campaigns
-- ============================================================
ALTER TABLE public.campaigns
  ADD COLUMN wheel_base_color TEXT,
  ADD COLUMN play_bg_color TEXT,
  ADD COLUMN logo_url TEXT;

-- ============================================================
-- STORAGE: Create logos bucket (run in Supabase dashboard or via API)
-- Note: Create a public bucket named "logos" in Supabase Storage settings
-- ============================================================

-- ============================================================
-- UNSUBSCRIBE: Add unsubscribed column to participants
-- ============================================================
ALTER TABLE public.participants
  ADD COLUMN unsubscribed BOOLEAN NOT NULL DEFAULT false;
