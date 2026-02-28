"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  SpinningWheel,
  type WheelSegment,
} from "@/components/play/spinning-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hexToHsl, hslToHex } from "@/lib/color-utils";
import { Shuffle } from "lucide-react";

const HERO_PRIZES = [
  { name: "Free Coffee" },
  { name: "20% Discount" },
  { name: "Free Appetizer" },
  { name: "VIP Access" },
];

interface HeroPalette {
  name: string;
  /** Primary brand color — buttons, text accents, stickers */
  primary: string;
  /** 4 vibrant colors for prize segments */
  segments: [string, string, string, string];
  /** 4 distinct muted colors for "Try Again" segments */
  noWin: [string, string, string, string];
  /** Light tint for feature-icon backgrounds & section bg */
  accentBg: string;
  /** Muted text color for descriptions & footer */
  mutedFg: string;
}

const CURATED_PALETTES: HeroPalette[] = [
  {
    name: "Soft Teal",
    primary: "#5CBDB1",
    segments: ["#7DD4C8", "#A8E6CF", "#FFD3B6", "#88D8B0"],
    noWin: ["#D4E8E5", "#E0EDE8", "#F0E4DA", "#D8EBE2"],
    accentBg: "#EDF8F6",
    mutedFg: "#7A9E98",
  },
  {
    name: "Sunset Sorbet",
    primary: "#F0907E",
    segments: ["#F8B4A8", "#F7C59F", "#E8A0B4", "#FFD1A9"],
    noWin: ["#F4DCD6", "#F5E4D0", "#F0D4DE", "#F6E2D2"],
    accentBg: "#FFF0EC",
    mutedFg: "#B0908A",
  },
  {
    name: "Sky & Mint",
    primary: "#6BAFDE",
    segments: ["#A0D2F0", "#7DC4E8", "#A8E6CF", "#8AD4E0"],
    noWin: ["#D8E8F4", "#DAE6F0", "#D8F0E4", "#D8ECF0"],
    accentBg: "#EBF4FA",
    mutedFg: "#8AA0B0",
  },
  {
    name: "Berry Pastel",
    primary: "#B08CCF",
    segments: ["#C8A8E0", "#F0A8C8", "#B8B8F0", "#DDA8D0"],
    noWin: ["#E4D8EE", "#F4D8E4", "#DCDCF4", "#ECD8E8"],
    accentBg: "#F4EEF8",
    mutedFg: "#9A8AAE",
  },
  {
    name: "Coral Lagoon",
    primary: "#F09090",
    segments: ["#F8B0A0", "#88D8D0", "#F0C8A0", "#A0DCD0"],
    noWin: ["#F4DAD4", "#D4EEEA", "#F2E4D0", "#D4ECE8"],
    accentBg: "#FFF0EE",
    mutedFg: "#B09090",
  },
  {
    name: "Honey & Sage",
    primary: "#D4A050",
    segments: ["#E8C880", "#A8C8A0", "#E0B870", "#B8D4A8"],
    noWin: ["#F0E4CC", "#D8E8D4", "#ECE0C0", "#DCE8D8"],
    accentBg: "#FAF4E8",
    mutedFg: "#A09470",
  },
  {
    name: "Lemon Fizz",
    primary: "#E8B840",
    segments: ["#F0D070", "#F0A868", "#90CCB0", "#F0C080"],
    noWin: ["#F4E8C4", "#F0DCC4", "#D0E8DC", "#F2E0C8"],
    accentBg: "#FEF8E8",
    mutedFg: "#A09060",
  },
  {
    name: "Rose Quartz",
    primary: "#E8A8A4",
    segments: ["#F0C4B0", "#E8B0AC", "#F0D4A0", "#DEB8B4"],
    noWin: ["#F4E0DA", "#F0D8D6", "#F4EACC", "#ECDAD6"],
    accentBg: "#FBF2F0",
    mutedFg: "#B09890",
  },
  {
    name: "Cotton Candy",
    primary: "#F088A0",
    segments: ["#F0A8B8", "#90CCF0", "#FFD480", "#B8A8E8"],
    noWin: ["#F4D4DE", "#D4E4F4", "#F4E8C8", "#DCD4F0"],
    accentBg: "#FFF0F4",
    mutedFg: "#B08090",
  },
  {
    name: "Spring Meadow",
    primary: "#78B890",
    segments: ["#A0D4A8", "#E8C870", "#88C8A0", "#C0DCB0"],
    noWin: ["#D4E8D8", "#F0E4C0", "#D4E4D4", "#DCF0D8"],
    accentBg: "#EEF6F0",
    mutedFg: "#78A088",
  },
  {
    name: "Candy Floss",
    primary: "#F088A8",
    segments: ["#F8A898", "#FFD088", "#D88CC8", "#B898E0"],
    noWin: ["#F4D8D0", "#F4E8C8", "#ECD4E4", "#DCD0F0"],
    accentBg: "#FFF0F2",
    mutedFg: "#B08898",
  },
  {
    name: "Lavender Mist",
    primary: "#A890D0",
    segments: ["#C0A8E0", "#F0A8C0", "#98CCD8", "#B8A0E0"],
    noWin: ["#E0D4EC", "#F4D4E0", "#D4E8EC", "#DCD4EC"],
    accentBg: "#F4F0FA",
    mutedFg: "#9888A8",
  },
  {
    name: "Tropical Sorbet",
    primary: "#58C8A8",
    segments: ["#80D8B8", "#F8D480", "#F09888", "#88C8E8"],
    noWin: ["#CEF0E0", "#F4EACC", "#F4D4D0", "#D0E4F0"],
    accentBg: "#ECF8F4",
    mutedFg: "#70A898",
  },
  {
    name: "Peach Cloud",
    primary: "#F0A898",
    segments: ["#F8C0A8", "#F0D8A0", "#E8A0B8", "#A0D4C0"],
    noWin: ["#F4DED4", "#F4ECCC", "#F0D4DE", "#D0ECE0"],
    accentBg: "#FEF4F0",
    mutedFg: "#B09488",
  },
  {
    name: "Bluebell",
    primary: "#80A8D8",
    segments: ["#A8C8F0", "#88B8E0", "#B0D8D0", "#C0B0E0"],
    noWin: ["#D8E4F4", "#D4E0F0", "#D8ECE8", "#DED8F0"],
    accentBg: "#EEF2FA",
    mutedFg: "#8898B0",
  },
];

const STICKERS = [
  { text: "Increase Sales", className: "-top-2 -right-4 rotate-3", delay: "0s" },
  { text: "Grow Email List", className: "-top-2 -left-4 -rotate-3", delay: "0.5s" },
  { text: "Easy to Set Up", className: "bottom-20 -right-4 rotate-2", delay: "1s" },
  { text: "Boost Engagement", className: "bottom-20 -left-4 -rotate-2", delay: "1.5s" },
];

function buildHeroSegments(palette: HeroPalette): WheelSegment[] {
  const segments: WheelSegment[] = [];
  HERO_PRIZES.forEach((prize, i) => {
    segments.push({ label: prize.name, color: palette.segments[i] });
    segments.push({ label: "Try Again", color: palette.noWin[i] });
  });
  return segments;
}

type HeroPlayState = "idle" | "spinning" | "result";

export function HeroSection() {
  const [paletteIndex, setPaletteIndex] = useState(0);
  const palette = CURATED_PALETTES[paletteIndex];
  const segments = useMemo(() => buildHeroSegments(palette), [palette]);

  const [playState, setPlayState] = useState<HeroPlayState>("idle");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [targetSegment, setTargetSegment] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  function handleDemoSpin(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Enter your email to try it!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return;
    }

    // Client-side spin simulation (50% win rate)
    const random = Math.random();
    let won = false;
    let selectedPrizeName: string | null = null;

    if (random < 0.5) {
      const prizeIndex = Math.floor(Math.random() * HERO_PRIZES.length);
      won = true;
      selectedPrizeName = HERO_PRIZES[prizeIndex].name;
      setResultMessage(selectedPrizeName);
      setTargetSegment(prizeIndex * 2);
    } else {
      setResultMessage(null);
      const noWinIndex = Math.floor(Math.random() * HERO_PRIZES.length);
      setTargetSegment(noWinIndex * 2 + 1);
    }

    // Store the lead + trigger demo email (fire-and-forget)
    fetch("/api/landing-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        won,
        prizeName: selectedPrizeName,
      }),
    }).catch(() => {});

    setSpinning(true);
    setPlayState("spinning");
  }

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    setPlayState("result");
  }, []);

  function handleReset() {
    setPlayState("idle");
    setEmail("");
    setEmailError("");
    setTargetSegment(null);
    setSpinning(false);
    setResultMessage(null);
  }

  function handleRandomize() {
    const next = (paletteIndex + 1) % CURATED_PALETTES.length;
    setPaletteIndex(next);

    const p = CURATED_PALETTES[next];
    const [h, s] = hexToHsl(p.primary);
    const root = document.documentElement;
    root.style.setProperty("--primary", p.primary);
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--accent", p.accentBg);
    root.style.setProperty("--accent-foreground", hslToHex(h, s, 36));
    root.style.setProperty("--muted", p.accentBg);
    root.style.setProperty("--muted-foreground", p.mutedFg);
    root.style.setProperty("--ring", hslToHex(h, s, 50));
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Left: Title, subtitle, CTAs */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Collect Emails with a
            <span className="text-primary"> Fun Spin-to-Win</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Generate QR codes for your cafe or restaurant. Customers scan, enter
            their email, and spin a wheel for a chance to win prizes. You grow
            your mailing list effortlessly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Right: Wheel + Stickers + Form */}
        <div className="relative flex flex-1 flex-col items-center">
          {/* Sticker tags — desktop only */}
          {STICKERS.map((sticker) => (
            <span
              key={sticker.text}
              className={`absolute z-10 hidden rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md lg:block animate-sticker-float ${sticker.className}`}
              style={{ animationDelay: sticker.delay }}
            >
              {sticker.text}
            </span>
          ))}

          {/* Spinning Wheel */}
          <SpinningWheel
            segments={segments}
            targetSegmentIndex={targetSegment}
            onSpinComplete={handleSpinComplete}
            spinning={spinning}
          />

          {/* Randomize palette */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomize}
              className="gap-1.5"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Next Palette
            </Button>
            <span className="text-xs text-muted-foreground">{palette.name}</span>
          </div>

          {/* Email Form / Spinning / Result */}
          <div className="mt-6 w-full max-w-sm">
            {playState === "idle" && (
              <form onSubmit={handleDemoSpin} className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  Try it yourself — enter your email and spin!
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 flex-1"
                  />
                  <Button type="submit" className="h-10 shrink-0">
                    Spin!
                  </Button>
                </div>
                {emailError && (
                  <p className="text-center text-sm text-destructive">
                    {emailError}
                  </p>
                )}
              </form>
            )}

            {playState === "spinning" && (
              <p className="animate-pulse text-center text-sm font-medium text-primary">
                Good luck!
              </p>
            )}

            {playState === "result" && (
              <div className="text-center">
                {resultMessage ? (
                  <p className="text-lg font-bold text-primary">
                    You won: {resultMessage}!
                  </p>
                ) : (
                  <p className="text-muted-foreground">Better luck next time!</p>
                )}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Spin Again
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Create Your Own</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
