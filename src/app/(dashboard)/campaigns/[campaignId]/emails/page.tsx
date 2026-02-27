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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";

export default async function EmailsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", campaignId)
    .single();

  if (!campaign) notFound();

  const { data: participants } = await supabase
    .from("participants")
    .select("id, email, played_at, prize_id, prizes(name)")
    .eq("campaign_id", campaignId)
    .order("played_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/campaigns/${campaignId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Collected Emails</h1>
            <p className="text-muted-foreground">{campaign.name}</p>
          </div>
        </div>
        {participants && participants.length > 0 && (
          <Button variant="outline" asChild>
            <a href={`/api/campaigns/${campaignId}/emails`} download>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {participants?.length || 0} Participants
          </CardTitle>
          <CardDescription>
            All email addresses collected from this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!participants || participants.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No participants yet. Share your QR code to start collecting
              emails!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell>
                      {p.prizes?.name ? (
                        <Badge variant="default">{p.prizes.name}</Badge>
                      ) : (
                        <Badge variant="secondary">No win</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.played_at).toLocaleDateString()}{" "}
                      {new Date(p.played_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
