import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create business profile if it doesn't exist (for OAuth signups)
      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!existingBusiness) {
        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.email?.split("@")[0] ||
          "My Business";

        await supabase.from("businesses").insert({
          user_id: data.user.id,
          business_name: displayName,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
