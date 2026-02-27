import { CampaignForm } from "@/components/campaigns/campaign-form";
import { createCampaign } from "../actions";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">
          Set up a new QR code lottery campaign
        </p>
      </div>
      <CampaignForm onSubmit={createCampaign} />
    </div>
  );
}
