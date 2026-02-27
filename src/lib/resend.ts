import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "GetContactsApp <noreply@getcontacts.app>";

export async function sendPrizeEmail({
  email,
  won,
  prizeName,
  campaignName,
  campaignId,
}: {
  email: string;
  won: boolean;
  prizeName: string | null;
  campaignName: string;
  campaignId: string;
}) {
  const subject = won
    ? `You won: ${prizeName}!`
    : `Thanks for playing — ${campaignName}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getcontacts.app";
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&campaign=${campaignId}`;

  const html = won
    ? prizeWonHtml({ prizeName: prizeName!, campaignName, unsubscribeUrl })
    : noWinHtml({ campaignName, unsubscribeUrl });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html,
  });
}

function prizeWonHtml({
  prizeName,
  campaignName,
  unsubscribeUrl,
}: {
  prizeName: string;
  campaignName: string;
  unsubscribeUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#7C3AED,#A78BFA);padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">&#127881;</div>
          <h1 style="margin:0;color:#ffffff;font-size:24px">You Won!</h1>
        </td></tr>
        <tr><td style="padding:32px;text-align:center">
          <p style="margin:0 0 8px;color:#71717a;font-size:14px">${campaignName}</p>
          <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#18181b">${prizeName}</p>
          <div style="background:#EDE9FE;border:1px solid #DDD6FE;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="margin:0;color:#4C1D95;font-size:14px;font-weight:600">Show this email to claim your prize</p>
          </div>
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px">Powered by GetContactsApp</p>
          <p style="margin:0"><a href="${unsubscribeUrl}" style="color:#a1a1aa;font-size:11px;text-decoration:underline">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function noWinHtml({
  campaignName,
  unsubscribeUrl,
}: {
  campaignName: string;
  unsubscribeUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#5B21B6,#8B5CF6);padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">&#127922;</div>
          <h1 style="margin:0;color:#ffffff;font-size:24px">Thanks for Playing!</h1>
        </td></tr>
        <tr><td style="padding:32px;text-align:center">
          <p style="margin:0 0 8px;color:#71717a;font-size:14px">${campaignName}</p>
          <p style="margin:0 0 24px;font-size:16px;color:#3f3f46">Better luck next time! We appreciate you participating.</p>
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px">Powered by GetContactsApp</p>
          <p style="margin:0"><a href="${unsubscribeUrl}" style="color:#a1a1aa;font-size:11px;text-decoration:underline">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
