import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, Mail, Gift, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/landing/hero-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Gift className="h-6 w-6 text-primary" />
            LuckyQR
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <HeroSection />

        {/* Features */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              <FeatureCard
                icon={<QrCode className="h-8 w-8" />}
                title="Create a Campaign"
                description="Set up your prizes and win probabilities in minutes."
              />
              <FeatureCard
                icon={<Download className="h-8 w-8" />}
                title="Print Your QR Code"
                description="Download a ready-to-print A4 board with your logo and QR code."
              />
              <FeatureCard
                icon={<Gift className="h-8 w-8" />}
                title="Customers Spin & Win"
                description="They scan the QR, enter their email, and spin the wheel."
              />
              <FeatureCard
                icon={<Mail className="h-8 w-8" />}
                title="Collect & Download"
                description="View all collected emails and download them as CSV."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>LuckyQR — Grow your mailing list with gamified QR campaigns.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
