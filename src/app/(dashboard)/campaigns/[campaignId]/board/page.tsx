"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (!campaignData) return;
      setCampaign(campaignData);

      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", campaignData.business_id)
        .single();

      setBusiness(businessData);

      // Generate QR code
      const QRCode = (await import("qrcode")).default;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const dataUrl = await QRCode.toDataURL(
        `${appUrl}/play/${campaignData.slug}`,
        {
          width: 1024,
          margin: 2,
          errorCorrectionLevel: "H",
        }
      );
      setQrDataUrl(dataUrl);
      setLoading(false);
    }
    load();
  }, [campaignId]);

  async function handleDownloadPDF() {
    if (!campaign || !qrDataUrl) return;
    setDownloading(true);

    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { BoardPDFDocument } = await import(
        "@/components/board/board-pdf-document"
      );

      const blob = await pdf(
        BoardPDFDocument({
          logoUrl: business?.logo_url || null,
          qrCodeDataUrl: qrDataUrl,
          headline: campaign.board_headline,
          subheadline: campaign.board_subheadline,
          bgColor: campaign.board_bg_color,
          textColor: campaign.board_text_color,
          accentColor: campaign.board_accent_color,
        })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign.name}-board.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading board preview...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Printable Board</h1>
            <p className="text-muted-foreground">{campaign.name}</p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF} disabled={downloading}>
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            This is how your A4 printable board will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* A4 ratio preview */}
          <div
            className="mx-auto flex flex-col items-center justify-center rounded-lg border-2 shadow-lg"
            style={{
              width: "100%",
              maxWidth: 420,
              aspectRatio: "210 / 297",
              backgroundColor: campaign.board_bg_color,
              padding: "2rem",
            }}
          >
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Business logo"
                className="mb-6 h-16 w-auto object-contain"
              />
            )}
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="mb-6 w-48"
              />
            )}
            <h2
              className="text-center text-3xl font-bold"
              style={{ color: campaign.board_text_color }}
            >
              {campaign.board_headline}
            </h2>
            <p
              className="mt-2 text-center"
              style={{ color: campaign.board_text_color, opacity: 0.8 }}
            >
              {campaign.board_subheadline}
            </p>
            <div
              className="mt-6 h-1 w-3/5 rounded"
              style={{ backgroundColor: campaign.board_accent_color }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
