"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { getCampaignUrl } from "@/lib/qr";
import { toast } from "sonner";

export function QRCodeDisplay({ slug }: { slug: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const campaignUrl = getCampaignUrl(slug);

  useEffect(() => {
    async function generate() {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(campaignUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
    }
    generate();
  }, [campaignUrl]);

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!qrDataUrl) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Generating QR code...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={qrDataUrl}
        alt="Campaign QR Code"
        className="h-64 w-64 rounded border"
      />
      <div className="flex items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 text-sm">{campaignUrl}</code>
        <Button variant="ghost" size="icon" onClick={handleCopyUrl}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <Button variant="outline" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  );
}
