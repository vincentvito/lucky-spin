import { createAdminClient } from "@/lib/supabase/admin";
import { sendDemoResultEmail } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  won: z.boolean().optional(),
  prizeName: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { success } = rateLimit(`landing:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    await supabase
      .from("landing_leads")
      .upsert({ email: normalizedEmail }, { onConflict: "email" });

    // Send demo result email if spin data is provided
    if (parsed.data.won !== undefined) {
      sendDemoResultEmail({
        email: normalizedEmail,
        won: parsed.data.won,
        prizeName: parsed.data.prizeName ?? null,
      }).catch((err) => console.error("Demo email error:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Landing lead error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
