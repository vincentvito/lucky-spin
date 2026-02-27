"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CampaignFormData, PrizeFormData } from "@/lib/validators";
import type { CampaignWithPrizes } from "@/types/database";
import { generateMonochromaticPalette } from "@/lib/color-utils";

const DEFAULT_PRIZE_COLORS = [
  "#14B8A6",
  "#0D9488",
  "#0F766E",
  "#115E59",
  "#06B6D4",
  "#0891B2",
  "#10B981",
  "#059669",
];

interface CampaignFormProps {
  campaign?: CampaignWithPrizes;
  onSubmit: (data: CampaignFormData) => Promise<{ id: string }>;
}

export function CampaignForm({ campaign, onSubmit }: CampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(campaign?.name || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [boardHeadline, setBoardHeadline] = useState(
    campaign?.board_headline || "Scan & Win!"
  );
  const [boardSubheadline, setBoardSubheadline] = useState(
    campaign?.board_subheadline || "Try your luck and win amazing prizes!"
  );
  const [boardBgColor, setBoardBgColor] = useState(
    campaign?.board_bg_color || "#FFFFFF"
  );
  const [boardTextColor, setBoardTextColor] = useState(
    campaign?.board_text_color || "#000000"
  );
  const [boardAccentColor, setBoardAccentColor] = useState(
    campaign?.board_accent_color || "#14B8A6"
  );

  const [colorMode, setColorMode] = useState<"auto" | "manual">(
    campaign?.wheel_base_color ? "auto" : "manual"
  );
  const [wheelBaseColor, setWheelBaseColor] = useState(
    campaign?.wheel_base_color || "#14B8A6"
  );
  const [playBgColor, setPlayBgColor] = useState(
    campaign?.play_bg_color || "#111827"
  );

  const [prizes, setPrizes] = useState<
    Array<{
      name: string;
      probability: number;
      color: string;
      total_quantity: number | null;
    }>
  >(
    campaign?.prizes?.map((p) => ({
      name: p.name,
      probability: p.probability,
      color: p.color,
      total_quantity: p.total_quantity,
    })) || [
      { name: "", probability: 0.1, color: DEFAULT_PRIZE_COLORS[0], total_quantity: null },
    ]
  );

  function addPrize() {
    setPrizes([
      ...prizes,
      {
        name: "",
        probability: 0.1,
        color: DEFAULT_PRIZE_COLORS[prizes.length % DEFAULT_PRIZE_COLORS.length],
        total_quantity: null,
      },
    ]);
  }

  function removePrize(index: number) {
    setPrizes(prizes.filter((_, i) => i !== index));
  }

  function updatePrize(index: number, field: string, value: string | number | null) {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  }

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);

  const palette = colorMode === "auto"
    ? generateMonochromaticPalette(wheelBaseColor, prizes.length)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (totalProbability > 1) {
        toast.error("Total prize probability must not exceed 100%");
        setLoading(false);
        return;
      }

      const formData: CampaignFormData = {
        name,
        description: description || undefined,
        board_headline: boardHeadline,
        board_subheadline: boardSubheadline,
        board_bg_color: boardBgColor,
        board_text_color: boardTextColor,
        board_accent_color: boardAccentColor,
        wheel_base_color: colorMode === "auto" ? wheelBaseColor : null,
        play_bg_color: playBgColor,
        prizes: prizes.map((p, i) => ({
          ...p,
          sort_order: i,
        })),
      };

      const result = await onSubmit(formData);
      toast.success(campaign ? "Campaign updated!" : "Campaign created!");
      router.push(`/campaigns/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campaign details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Basic information about your campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Coffee Giveaway"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your campaign"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prizes */}
      <Card>
        <CardHeader>
          <CardTitle>Prizes</CardTitle>
          <CardDescription>
            Set up prizes and their win probability. Remaining probability ({Math.round((1 - totalProbability) * 100)}%) means no win.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prizes.map((prize, index) => (
            <div key={index} className="flex items-end gap-3 rounded-md border p-3">
              <div className="flex-1 space-y-2">
                <Label>Prize Name</Label>
                <Input
                  value={prize.name}
                  onChange={(e) => updatePrize(index, "name", e.target.value)}
                  placeholder="Free Coffee"
                  required
                />
              </div>
              <div className="w-28 space-y-2">
                <Label>Win %</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={Math.round(prize.probability * 100)}
                  onChange={(e) =>
                    updatePrize(index, "probability", Number(e.target.value) / 100)
                  }
                  required
                />
              </div>
              <div className="w-24 space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={prize.total_quantity ?? ""}
                  onChange={(e) =>
                    updatePrize(
                      index,
                      "total_quantity",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </div>
              {colorMode === "manual" && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={prize.color}
                    onChange={(e) => updatePrize(index, "color", e.target.value)}
                    className="h-9 w-12 cursor-pointer p-1"
                  />
                </div>
              )}
              {prizes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePrize(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}

          {totalProbability > 1 && (
            <p className="text-sm text-destructive">
              Total probability is {Math.round(totalProbability * 100)}% — must be 100% or less.
            </p>
          )}

          <Button type="button" variant="outline" onClick={addPrize}>
            <Plus className="mr-2 h-4 w-4" />
            Add Prize
          </Button>
        </CardContent>
      </Card>

      {/* Play page customization */}
      <Card>
        <CardHeader>
          <CardTitle>Play Page</CardTitle>
          <CardDescription>
            Customize the appearance of the player-facing wheel page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wheel color mode */}
          <div className="space-y-2">
            <Label>Wheel Colors</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={colorMode === "auto" ? "default" : "outline"}
                size="sm"
                onClick={() => setColorMode("auto")}
              >
                Auto (Monochromatic)
              </Button>
              <Button
                type="button"
                variant={colorMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setColorMode("manual")}
              >
                Manual (Per-Prize)
              </Button>
            </div>
          </div>

          {/* Base color picker (auto mode) */}
          {colorMode === "auto" && (
            <div className="space-y-2">
              <Label>Wheel Base Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={wheelBaseColor}
                  onChange={(e) => setWheelBaseColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <span className="text-xs text-muted-foreground">{wheelBaseColor}</span>
                {palette && (
                  <div className="ml-2 flex gap-1">
                    {palette.prizeShades.map((shade, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded border border-border"
                        style={{ backgroundColor: shade }}
                        title={shade}
                      />
                    ))}
                    <div
                      className="h-6 w-6 rounded border border-dashed border-border"
                      style={{ backgroundColor: palette.noWinShade }}
                      title={`No win: ${palette.noWinShade}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Page background */}
          <div className="space-y-2">
            <Label>Page Background</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={playBgColor}
                onChange={(e) => setPlayBgColor(e.target.value)}
                className="h-9 w-12 cursor-pointer p-1"
              />
              <span className="text-xs text-muted-foreground">{playBgColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board customization */}
      <Card>
        <CardHeader>
          <CardTitle>Printable Board</CardTitle>
          <CardDescription>
            Customize the A4 board that will be printed with your QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boardHeadline">Headline</Label>
            <Input
              id="boardHeadline"
              value={boardHeadline}
              onChange={(e) => setBoardHeadline(e.target.value)}
              placeholder="Scan & Win!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boardSubheadline">Subheadline</Label>
            <Input
              id="boardSubheadline"
              value={boardSubheadline}
              onChange={(e) => setBoardSubheadline(e.target.value)}
              placeholder="Try your luck and win amazing prizes!"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Background</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={boardBgColor}
                  onChange={(e) => setBoardBgColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <span className="text-xs text-muted-foreground">{boardBgColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={boardTextColor}
                  onChange={(e) => setBoardTextColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <span className="text-xs text-muted-foreground">{boardTextColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={boardAccentColor}
                  onChange={(e) => setBoardAccentColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <span className="text-xs text-muted-foreground">{boardAccentColor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? campaign
              ? "Updating..."
              : "Creating..."
            : campaign
              ? "Update Campaign"
              : "Create Campaign"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
