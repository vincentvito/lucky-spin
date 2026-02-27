import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Use admin client to bypass RLS for business profile creation
      const adminSupabase = createAdminClient();

      const { data: existingBusiness } = await adminSupabase
        .from("businesses")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!existingBusiness) {
        const displayName =
          data.user.user_metadata?.business_name ||
          data.user.user_metadata?.full_name ||
          data.user.email?.split("@")[0] ||
          "My Business";

        const { error: insertError } = await adminSupabase
          .from("businesses")
          .insert({
            user_id: data.user.id,
            business_name: displayName,
          });

        if (insertError && insertError.code !== "23505") {
          console.error("Failed to create business profile:", insertError);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
