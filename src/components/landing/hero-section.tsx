"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  SpinningWheel,
  type WheelSegment,
} from "@/components/play/spinning-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateMonochromaticPalette } from "@/lib/color-utils";

const HERO_PRIZES = [
  { name: "Free Coffee" },
  { name: "20% Discount" },
  { name: "Free Appetizer" },
  { name: "VIP Access" },
];

const HERO_BASE_COLOR = "#14B8A6";

const STICKERS = [
  { text: "Increase Sales", className: "-top-2 -right-4 rotate-3", delay: "0s" },
  { text: "Grow Email List", className: "-top-2 -left-4 -rotate-3", delay: "0.5s" },
  { text: "Easy to Set Up", className: "-bottom-2 -right-4 rotate-2", delay: "1s" },
  { text: "Boost Engagement", className: "-bottom-2 -left-4 -rotate-2", delay: "1.5s" },
];

function buildHeroSegments(): WheelSegment[] {
  const palette = generateMonochromaticPalette(HERO_BASE_COLOR, HERO_PRIZES.length);
  const segments: WheelSegment[] = [];
  HERO_PRIZES.forEach((prize, i) => {
    segments.push({ label: prize.name, color: palette.prizeShades[i] });
    segments.push({ label: "Try Again", color: palette.noWinShade });
  });
  return segments;
}

type HeroPlayState = "idle" | "spinning" | "result";

export function HeroSection() {
  const segments = useMemo(() => buildHeroSegments(), []);

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
