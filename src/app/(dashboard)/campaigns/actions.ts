"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { campaignSchema, type CampaignFormData } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createCampaign(formData: CampaignFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validated = campaignSchema.parse(formData);
  const { prizes, ...campaignData } = validated;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, logo_url")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Business profile not found");

  const slug = nanoid(10);

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      ...campaignData,
      slug,
      business_id: business.id,
      logo_url: business.logo_url,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const prizesWithCampaign = prizes.map((p) => ({
    ...p,
    campaign_id: campaign.id,
  }));

  const { error: prizesError } = await supabase
    .from("prizes")
    .insert(prizesWithCampaign);

  if (prizesError) throw new Error(prizesError.message);

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");

  return { slug: campaign.slug, id: campaign.id };
}

export async function updateCampaign(
  campaignId: string,
  formData: CampaignFormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validated = campaignSchema.parse(formData);
  const { prizes, ...campaignData } = validated;

  // Fetch business logo for sync
  const { data: existing } = await supabase
    .from("campaigns")
    .select("business_id")
    .eq("id", campaignId)
    .single();

  let logoUrl: string | null = null;
  if (existing) {
    const { data: business } = await supabase
      .from("businesses")
      .select("logo_url")
      .eq("id", existing.business_id)
      .single();
    logoUrl = business?.logo_url ?? null;
  }

  // Update campaign
  const { error } = await supabase
    .from("campaigns")
    .update({
      ...campaignData,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (error) throw new Error(error.message);

  // Delete existing prizes and re-insert
  await supabase.from("prizes").delete().eq("campaign_id", campaignId);

  const prizesWithCampaign = prizes.map((p) => ({
    ...p,
    campaign_id: campaignId,
  }));

  const { error: prizesError } = await supabase
    .from("prizes")
    .insert(prizesWithCampaign);

  if (prizesError) throw new Error(prizesError.message);

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/dashboard");

  return { id: campaignId };
}

export async function toggleCampaignActive(
  campaignId: string,
  isActive: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("campaigns")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (error) throw new Error(error.message);

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/dashboard");
}

export async function deleteCampaign(campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) throw new Error(error.message);

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}
