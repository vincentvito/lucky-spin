import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeDisplay } from "@/components/campaigns/qr-code-display";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import {
  Users,
  Trophy,
  Edit,
  Mail,
  FileImage,
} from "lucide-react";

export default async function CampaignDetailPage({
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

  const { count: participantCount } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  const { count: winnerCount } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .not("prize_id", "is", null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant={campaign.is_active ? "default" : "secondary"}>
              {campaign.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {campaign.description && (
            <p className="mt-1 text-muted-foreground">
              {campaign.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/campaigns/${campaignId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <CampaignActions
            campaignId={campaignId}
            isActive={campaign.is_active}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participantCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Winners</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winnerCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>
            Print this QR code or display it in your establishment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QRCodeDisplay slug={campaign.slug} />
        </CardContent>
      </Card>

      {/* Prizes */}
      <Card>
        <CardHeader>
          <CardTitle>Prizes</CardTitle>
          <CardDescription>
            Prizes configured for this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {prizes?.map((prize) => (
              <div
                key={prize.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: prize.color }}
                  />
                  <span className="font-medium">{prize.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{Math.round(prize.probability * 100)}% chance</span>
                  <span>
                    {prize.awarded_count}
                    {prize.total_quantity
                      ? ` / ${prize.total_quantity}`
                      : ""}{" "}
                    awarded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/campaigns/${campaignId}/emails`}>
            <Mail className="mr-2 h-4 w-4" />
            View Emails
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/campaigns/${campaignId}/board`}>
            <FileImage className="mr-2 h-4 w-4" />
            Printable Board
          </Link>
        </Button>
      </div>
    </div>
  );
}
