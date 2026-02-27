import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
import { Megaphone, Users, Trophy, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/settings");

  // Get campaigns with participant counts
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, slug, is_active, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Get total stats
  let totalParticipants = 0;
  let totalWinners = 0;

  if (campaigns && campaigns.length > 0) {
    const campaignIds = campaigns.map((c) => c.id);

    const { count: participantCount } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .in("campaign_id", campaignIds);

    const { count: winnerCount } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .in("campaign_id", campaignIds)
      .not("prize_id", "is", null);

    totalParticipants = participantCount || 0;
    totalWinners = winnerCount || 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {business.business_name}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Participants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Winners</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWinners}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>Your latest campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No campaigns yet.</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/campaigns/new">Create your first campaign</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      /{campaign.slug}
                    </p>
                  </div>
                  <Badge variant={campaign.is_active ? "default" : "secondary"}>
                    {campaign.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
