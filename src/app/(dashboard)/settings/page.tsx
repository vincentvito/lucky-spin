"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadBusiness() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: business } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (business) {
          setBusinessId(business.id);
          setBusinessName(business.business_name);
          setLogoUrl(business.logo_url);
        }
      } finally {
        setInitialLoading(false);
      }
    }
    loadBusiness();
  }, [supabase, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let uploadedLogoUrl = logoUrl;

      // Upload logo if a new file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${user.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("logos").getPublicUrl(filePath);

        uploadedLogoUrl = publicUrl;
      }

      if (businessId) {
        // Update existing
        const { error } = await supabase
          .from("businesses")
          .update({
            business_name: businessName,
            logo_url: uploadedLogoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", businessId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("businesses").insert({
          user_id: user.id,
          business_name: businessName,
          logo_url: uploadedLogoUrl,
        });

        if (error) throw error;
      }

      toast.success("Settings saved!");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save settings"
      );
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            This information will appear on your printed QR boards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name <InfoTooltip text="Shown on your printed QR boards and in emails to participants" /></Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Cafe Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo <InfoTooltip text="Displayed on your printed QR boards" /></Label>
              {logoUrl && (
                <div className="mb-2">
                  <img
                    src={logoUrl}
                    alt="Current logo"
                    className="h-20 w-auto rounded border object-contain"
                  />
                </div>
              )}
              <Input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoFile(file);
                    setLogoUrl(URL.createObjectURL(file));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or SVG. Recommended size: 400x200px.
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
