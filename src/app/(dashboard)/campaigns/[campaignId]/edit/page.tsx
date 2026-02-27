import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { updateCampaign } from "../../actions";
import type { CampaignWithPrizes } from "@/types/database";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) notFound();

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("sort_order");

  const campaignWithPrizes: CampaignWithPrizes = {
    ...campaign,
    prizes: prizes || [],
  };

  async function handleUpdate(data: Parameters<typeof updateCampaign>[1]) {
    "use server";
    return updateCampaign(campaignId, data);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
        <p className="text-muted-foreground">
          Update your campaign settings and prizes
        </p>
      </div>
      <CampaignForm campaign={campaignWithPrizes} onSubmit={handleUpdate} />
    </div>
  );
}
