import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const campaignId = request.nextUrl.searchParams.get("campaign");

  if (!email || !campaignId) {
    return new NextResponse(unsubscribeHtml(false, "Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("participants")
    .update({ unsubscribed: true })
    .eq("campaign_id", campaignId)
    .eq("email", email.toLowerCase().trim());

  if (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(unsubscribeHtml(false, "Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(unsubscribeHtml(true), {
    headers: { "Content-Type": "text/html" },
  });
}

function unsubscribeHtml(success: boolean, errorMessage?: string) {
  const title = success ? "Unsubscribed" : "Error";
  const message = success
    ? "You have been successfully unsubscribed. You will no longer receive emails from this campaign."
    : errorMessage ?? "Something went wrong.";
  const icon = success ? "&#10003;" : "&#10007;";
  const color = success ? "#22c55e" : "#ef4444";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="background:#fff;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="width:48px;height:48px;border-radius:50%;background:${color};color:#fff;font-size:24px;line-height:48px;margin:0 auto 16px">${icon}</div>
    <h1 style="margin:0 0 8px;font-size:20px;color:#18181b">${title}</h1>
    <p style="margin:0;color:#71717a;font-size:14px">${message}</p>
  </div>
</body>
</html>`;
}
