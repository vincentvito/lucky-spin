import { createClient } from "@/lib/supabase/server";
import { determineLotteryOutcome } from "@/lib/lottery";
import { sendPrizeEmail } from "@/lib/resend";
import { playSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = playSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, campaignSlug } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await createClient();

    // 1. Get campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name, is_active")
      .eq("slug", campaignSlug)
      .eq("is_active", true)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or inactive" },
        { status: 404 }
      );
    }

    // 2. Check if email already played
    const { data: existing } = await supabase
      .from("participants")
      .select("id, prize_id")
      .eq("campaign_id", campaign.id)
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "already_played" },
        { status: 409 }
      );
    }

    // 3. Get prizes
    const { data: prizes } = await supabase
      .from("prizes")
      .select(
        "id, name, probability, total_quantity, awarded_count, color, sort_order"
      )
      .eq("campaign_id", campaign.id)
      .order("sort_order");

    if (!prizes || prizes.length === 0) {
      return NextResponse.json(
        { error: "Campaign has no prizes configured" },
        { status: 400 }
      );
    }

    // 4. Determine outcome
    const totalSegments = prizes.length * 2;
    const result = determineLotteryOutcome(prizes, totalSegments);

    // 5. Insert participant
    const { error: insertError } = await supabase
      .from("participants")
      .insert({
        campaign_id: campaign.id,
        email: normalizedEmail,
        prize_id: result.prizeId,
      });

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "already_played" },
          { status: 409 }
        );
      }
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record participation" },
        { status: 500 }
      );
    }

    // 6. Increment awarded count if won
    if (result.won && result.prizeId) {
      await supabase.rpc("increment_awarded_count", {
        prize_id_input: result.prizeId,
      });
    }

    // 7. Send prize notification email (fire-and-forget)
    sendPrizeEmail({
      email: normalizedEmail,
      won: result.won,
      prizeName: result.prizeName,
      campaignName: campaign.name,
      campaignId: campaign.id,
    }).catch(console.error);

    return NextResponse.json({
      won: result.won,
      prizeName: result.prizeName,
      segmentIndex: result.segmentIndex,
      totalSegments,
    });
  } catch (err) {
    console.error("Play API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
