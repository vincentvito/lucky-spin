import QRCode from "qrcode";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function getCampaignUrl(slug: string): string {
  return `${BASE_URL}/play/${slug}`;
}

export async function generateQRCodeDataUrl(slug: string): Promise<string> {
  const url = getCampaignUrl(slug);
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });
}

export async function generateQRCodeBuffer(slug: string): Promise<Buffer> {
  const url = getCampaignUrl(slug);
  return QRCode.toBuffer(url, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}
