import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify campaign ownership via RLS (the query will return null if not owned)
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: participants } = await supabase
    .from("participants")
    .select("email, played_at, prizes(name)")
    .eq("campaign_id", campaignId)
    .order("played_at", { ascending: false });

  const csvData = (participants || []).map((p: any) => ({
    email: p.email,
    result: p.prizes?.name || "No win",
    played_at: new Date(p.played_at).toISOString(),
  }));

  const csv = Papa.unparse(csvData);

  const safeName = campaign.name.replace(/[^a-zA-Z0-9-_]/g, "_");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}-emails.csv"`,
    },
  });
}
