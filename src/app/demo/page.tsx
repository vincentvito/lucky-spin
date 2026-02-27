"use client";

import { useState, useCallback } from "react";
import {
  SpinningWheel,
  type WheelSegment,
} from "@/components/play/spinning-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, PartyPopper, Frown } from "lucide-react";
import { generateMonochromaticPalette, generateBgGradient } from "@/lib/color-utils";

const DEMO_PRIZES = [
  { name: "Free Coffee" },
  { name: "10% Off" },
  { name: "Free Dessert" },
  { name: "Free Drink" },
];

const DEMO_BASE_COLOR = "#7C3AED";
const DEMO_BG_COLOR = "#1A0E2E";

function buildSegments(): WheelSegment[] {
  const palette = generateMonochromaticPalette(DEMO_BASE_COLOR, DEMO_PRIZES.length);
  const segments: WheelSegment[] = [];
  DEMO_PRIZES.forEach((prize, i) => {
    segments.push({ label: prize.name, color: palette.prizeShades[i] });
    segments.push({ label: "Try Again", color: palette.noWinShade });
  });
  return segments;
}

type PlayState = "email_input" | "spinning" | "result";

export default function DemoPage() {
  const segments = buildSegments();

  const [state, setState] = useState<PlayState>("email_input");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [targetSegment, setTargetSegment] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
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

    // Simulate server-side lottery
    const random = Math.random();
    // 40% total win chance for demo
    if (random < 0.4) {
      const prizeIndex = Math.floor(Math.random() * DEMO_PRIZES.length);
      setWon(true);
      setPrizeName(DEMO_PRIZES[prizeIndex].name);
      setTargetSegment(prizeIndex * 2); // Prize segments are at even indices
    } else {
      setWon(false);
      setPrizeName(null);
      // Pick a random "no win" segment (odd indices)
      const noWinIndex = Math.floor(Math.random() * DEMO_PRIZES.length);
      setTargetSegment(noWinIndex * 2 + 1);
    }

    setSpinning(true);
    setState("spinning");
  }

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    setState("result");
  }, []);

  function handleReset() {
    setState("email_input");
    setEmail("");
    setEmailError("");
    setTargetSegment(null);
    setSpinning(false);
    setWon(false);
    setPrizeName(null);
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-8"
      style={{ background: generateBgGradient(DEMO_BG_COLOR) }}
    >
      {/* Demo banner */}
      <div className="mb-4 rounded-full bg-purple-500/20 px-4 py-1 text-sm text-purple-300">
        Demo Mode — No database required
      </div>

      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        Summer Coffee Giveaway
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

      {/* Email form */}
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
              className="h-12 border-white/20 bg-white/10 text-center text-lg text-white placeholder:text-gray-400"
            />
            {emailError && (
              <p className="text-center text-sm text-red-400">{emailError}</p>
            )}
            <Button
              type="submit"
              className="h-12 w-full text-lg"
              style={{ backgroundColor: "#7C3AED" }}
            >
              Spin the Wheel!
            </Button>
          </form>
        </div>
      )}

      {/* Spinning */}
      {state === "spinning" && (
        <p className="animate-pulse text-center text-lg text-purple-300">
          Good luck!
        </p>
      )}

      {/* Result */}
      {state === "result" && (
        <div className="w-full max-w-sm text-center">
          {won ? (
            <>
              <PartyPopper className="mx-auto mb-3 h-12 w-12 text-purple-300" />
              <h2 className="text-3xl font-bold text-purple-300">You Won!</h2>
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
          <Button
            onClick={handleReset}
            variant="outline"
            className="mt-6 border-white/20 text-white hover:bg-white/10"
          >
            Try Again (Demo)
          </Button>
        </div>
      )}
    </div>
  );
}
