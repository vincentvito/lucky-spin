export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  board_headline: string;
  board_subheadline: string;
  board_bg_color: string;
  board_text_color: string;
  board_accent_color: string;
  wheel_base_color: string | null;
  play_bg_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prize {
  id: string;
  campaign_id: string;
  name: string;
  probability: number;
  color: string;
  total_quantity: number | null;
  awarded_count: number;
  sort_order: number;
  created_at: string;
}

export interface Participant {
  id: string;
  campaign_id: string;
  email: string;
  prize_id: string | null;
  played_at: string;
}

export interface CampaignWithPrizes extends Campaign {
  prizes: Prize[];
}

export interface ParticipantWithPrize extends Participant {
  prizes: { name: string } | null;
}
