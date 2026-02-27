import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/settings");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, slug, is_active, created_at, description")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your QR code campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No campaigns yet.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/campaigns/new">Create your first campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <Badge
                    variant={campaign.is_active ? "default" : "secondary"}
                  >
                    {campaign.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {campaign.description && (
                    <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    /{campaign.slug} &middot;{" "}
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
