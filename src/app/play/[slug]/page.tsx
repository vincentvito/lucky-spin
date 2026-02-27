"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { SpinningWheel, type WheelSegment } from "@/components/play/spinning-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, PartyPopper, Frown } from "lucide-react";
import {
  generateMonochromaticPalette,
  generateBgGradient,
} from "@/lib/color-utils";

interface Prize {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

interface Campaign {
  id: string;
  name: string;
  board_accent_color: string;
  wheel_base_color: string | null;
  play_bg_color: string | null;
  logo_url: string | null;
}

type PlayState = "loading" | "email_input" | "spinning" | "result" | "already_played" | "error";

const NO_WIN_COLOR = "#6B7280";

function buildSegments(prizes: Prize[], wheelBaseColor: string | null): WheelSegment[] {
  const segments: WheelSegment[] = [];

  if (wheelBaseColor) {
    const palette = generateMonochromaticPalette(wheelBaseColor, prizes.length);
    prizes.forEach((prize, i) => {
      segments.push({ label: prize.name, color: palette.prizeShades[i] });
      segments.push({ label: "Try Again", color: palette.noWinShade });
    });
  } else {
    prizes.forEach((prize) => {
      segments.push({ label: prize.name, color: prize.color });
      segments.push({ label: "Try Again", color: NO_WIN_COLOR });
    });
  }

  return segments;
}

export default function PlayPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [state, setState] = useState<PlayState>("loading");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [targetSegment, setTargetSegment] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);

  // Load campaign data
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("id, name, board_accent_color, wheel_base_color, play_bg_color, logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!campaignData) {
        setState("error");
        return;
      }

      setCampaign(campaignData);

      const { data: prizesData } = await supabase
        .from("prizes")
        .select("id, name, color, sort_order")
        .eq("campaign_id", campaignData.id)
        .order("sort_order");

      if (!prizesData || prizesData.length === 0) {
        setState("error");
        return;
      }

      setPrizes(prizesData);
      setSegments(buildSegments(prizesData, campaignData.wheel_base_color));
      setState("email_input");
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), campaignSlug: slug }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setState("already_played");
        return;
      }

      if (!res.ok) {
        setEmailError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Start spinning
      setWon(data.won);
      setPrizeName(data.prizeName);
      setTargetSegment(data.segmentIndex);
      setSpinning(true);
      setState("spinning");
    } catch {
      setEmailError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    setState("result");
  }, []);

  // Background style
  const bgStyle = campaign?.play_bg_color
    ? { background: generateBgGradient(campaign.play_bg_color) }
    : undefined;
  const bgClass = campaign?.play_bg_color
    ? ""
    : "bg-gradient-to-b from-gray-900 to-gray-800";

  // Loading state
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-4 text-center ${bgClass}`}
        style={bgStyle}
      >
        <Frown className="mb-4 h-12 w-12 text-gray-400" />
        <h1 className="text-xl font-bold text-white">Campaign Not Found</h1>
        <p className="mt-2 text-gray-400">
          This campaign is no longer active or doesn&apos;t exist.
        </p>
      </div>
    );
  }

  // Already played
  if (state === "already_played") {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-4 text-center ${bgClass}`}
        style={bgStyle}
      >
        {campaign?.logo_url && (
          <img
            src={campaign.logo_url}
            alt="Logo"
            className="mb-4 h-16 w-auto object-contain"
          />
        )}
        <Gift className="mb-4 h-12 w-12 text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">
          You Already Played!
        </h1>
        <p className="mt-2 text-gray-400">
          You&apos;ve already entered this campaign. Each email can only
          participate once.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-4 py-8 ${bgClass}`}
      style={bgStyle}
    >
      {/* Logo */}
      {campaign?.logo_url && (
        <img
          src={campaign.logo_url}
          alt="Logo"
          className="mb-4 h-16 w-auto object-contain"
        />
      )}

      {/* Campaign name */}
      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        {campaign?.name}
      </h1>

      {/* Wheel */}
      <div className="my-6">
        <SpinningWheel
          segments={segments}
          targetSegmentIndex={targetSegment}
          onSpinComplete={handleSpinComplete}
          spinning={spinning}
        />
      </div>

      {/* Email form (before spinning) */}
      {state === "email_input" && (
        <div className="w-full max-w-sm">
          <p className="mb-4 text-center text-gray-300">
            Enter your email to spin the wheel!
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-white/10 text-white placeholder:text-gray-400 border-white/20 text-center text-lg"
              disabled={submitting}
            />
            {emailError && (
              <p className="text-center text-sm text-red-400">{emailError}</p>
            )}
            <Button
              type="submit"
              className="h-12 w-full text-lg"
              disabled={submitting}
              style={{
                backgroundColor: campaign?.board_accent_color || "#FF6B00",
              }}
            >
              {submitting ? "Spinning..." : "Spin the Wheel!"}
            </Button>
          </form>
        </div>
      )}

      {/* Spinning state */}
      {state === "spinning" && (
        <p className="animate-pulse text-center text-lg text-yellow-400">
          Good luck!
        </p>
      )}

      {/* Result */}
      {state === "result" && (
        <div className="w-full max-w-sm text-center">
          {won ? (
            <>
              <PartyPopper className="mx-auto mb-3 h-12 w-12 text-yellow-400" />
              <h2 className="text-3xl font-bold text-yellow-400">
                You Won!
              </h2>
              <p className="mt-2 text-xl text-white">{prizeName}</p>
              <p className="mt-4 text-sm text-gray-400">
                Show this screen to claim your prize!
              </p>
            </>
          ) : (
            <>
              <Frown className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">
                Better Luck Next Time!
              </h2>
              <p className="mt-2 text-gray-400">
                Thanks for participating. No win this time.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
