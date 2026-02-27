import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";
import { z } from "zod";

const broadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const supabase = await createClient();

    // Verify authenticated user owns this campaign
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("id", campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const parsed = broadcastSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subject, body } = parsed.data;

    // Fetch all participant emails (exclude unsubscribed)
    const { data: participants } = await supabase
      .from("participants")
      .select("email")
      .eq("campaign_id", campaignId)
      .neq("unsubscribed", true);

    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { error: "No participants to email" },
        { status: 400 }
      );
    }

    const emails = participants.map((p) => p.email);

    // Send in batches of 100 (Resend batch limit)
    const BATCH_SIZE = 100;
    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getcontacts.app";
      const messages = batch.map((to) => ({
        from: "GetContactsApp <noreply@getcontacts.app>",
        to,
        subject,
        html: broadcastHtml({
          body,
          campaignName: campaign.name,
          unsubscribeUrl: `${appUrl}/api/unsubscribe?email=${encodeURIComponent(to)}&campaign=${campaignId}`,
        }),
      }));

      try {
        await resend.batch.send(messages);
        sentCount += batch.length;
      } catch {
        errorCount += batch.length;
      }
    }

    return NextResponse.json({ sentCount, errorCount, total: emails.length });
  } catch (err) {
    console.error("Broadcast error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function broadcastHtml({
  body,
  campaignName,
  unsubscribeUrl,
}: {
  body: string;
  campaignName: string;
  unsubscribeUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px">${campaignName}</p>
          <div style="font-size:15px;line-height:1.6;color:#18181b">${body}</div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center">
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px">Powered by GetContactsApp</p>
          <p style="margin:0"><a href="${unsubscribeUrl}" style="color:#a1a1aa;font-size:11px;text-decoration:underline">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
