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

/* ------------------------------------------------------------------ */
/*  Demo / Landing-page email                                          */
/* ------------------------------------------------------------------ */

export async function sendDemoResultEmail({
  email,
  won,
  prizeName,
}: {
  email: string;
  won: boolean;
  prizeName: string | null;
}) {
  const subject = won
    ? `You won ${prizeName}! Here's what GetContactsApp can do`
    : `Thanks for spinning! See what GetContactsApp can do for you`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getcontacts.app";
  const html = demoResultHtml({ won, prizeName, appUrl });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html,
  });
}

function demoResultHtml({
  won,
  prizeName,
  appUrl,
}: {
  won: boolean;
  prizeName: string | null;
  appUrl: string;
}) {
  const signupUrl = `${appUrl}/signup`;

  const headerEmoji = won ? "&#127881;" : "&#127922;";
  const headerTitle = won ? "You Won!" : "Thanks for Spinning!";

  const resultText = won
    ? `<p style="margin:0 0 4px;font-size:14px;color:#71717a">Your demo prize:</p>
       <p style="margin:0 0 20px;font-size:24px;font-weight:700;color:#7C3AED">${prizeName}</p>`
    : `<p style="margin:0 0 20px;font-size:16px;color:#3f3f46">Better luck next time! But here&rsquo;s the real win&hellip;</p>`;

  const demoDisclaimer = won
    ? `<p style="margin:0 0 24px;font-size:13px;color:#a1a1aa;font-style:italic">This was a demo spin &mdash; imagine your customers getting this email with YOUR prizes!</p>`
    : `<p style="margin:0 0 24px;font-size:13px;color:#a1a1aa;font-style:italic">This was a demo &mdash; imagine YOUR customers spinning for YOUR prizes!</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#A78BFA 50%,#C4B5FD 100%);padding:40px 32px;text-align:center">
          <div style="font-size:56px;margin-bottom:12px">${headerEmoji}</div>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px">${headerTitle}</h1>
        </td></tr>

        <!-- Result -->
        <tr><td style="padding:32px 32px 0;text-align:center">
          ${resultText}
          ${demoDisclaimer}
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px">
          <div style="border-top:1px solid #E5E7EB"></div>
        </td></tr>

        <!-- Marketing -->
        <tr><td style="padding:28px 32px 0;text-align:center">
          <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#18181b">Want This for Your Business?</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6">
            You just experienced what your customers would feel. GetContactsApp lets you create
            spin-to-win campaigns that collect emails while delighting visitors.
          </p>
        </td></tr>

        <!-- Feature pills 2x2 -->
        <tr><td style="padding:0 32px 24px;text-align:center">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 4px" width="50%">
                <div style="background:#F5F3FF;border-radius:8px;padding:14px 12px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">&#128241;</div>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#5B21B6">QR Code Campaigns</p>
                </div>
              </td>
              <td style="padding:6px 4px" width="50%">
                <div style="background:#F5F3FF;border-radius:8px;padding:14px 12px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">&#127918;</div>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#5B21B6">Gamified Spin Wheel</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 4px" width="50%">
                <div style="background:#F5F3FF;border-radius:8px;padding:14px 12px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">&#128231;</div>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#5B21B6">Auto Email Collection</p>
                </div>
              </td>
              <td style="padding:6px 4px" width="50%">
                <div style="background:#F5F3FF;border-radius:8px;padding:14px 12px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">&#128200;</div>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#5B21B6">CSV Export &amp; Analytics</p>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;text-align:center">
          <a href="${signupUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px">
            Create Your First Campaign
          </a>
          <p style="margin:12px 0 0;font-size:13px;color:#a1a1aa">Free to get started. No credit card required.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#FAFAFA;border-top:1px solid #F4F4F5;text-align:center">
          <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px">
            GetContactsApp &mdash; Grow your mailing list with gamified QR campaigns
          </p>
          <p style="margin:0;font-size:11px;color:#d4d4d8">
            You received this email because you tried our demo at <a href="${appUrl}" style="color:#a1a1aa;text-decoration:underline">getcontacts.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
