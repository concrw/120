import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/send";

// Generate a random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create beta invite codes (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { count = 1, bonus_credits = 50 } = await request.json();

    const adminClient = createAdminClient();
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = generateInviteCode();
      const { data, error } = await adminClient.from("beta_invites").insert({
        code,
        bonus_credits,
        created_by: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }).select().single();

      if (!error && data) {
        codes.push(data);
      }
    }

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Beta invite creation error:", error);
    return NextResponse.json({ error: "Failed to create invite codes" }, { status: 500 });
  }
}

// Redeem beta invite code
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if code exists and is valid
    const { data: invite, error: findError } = await adminClient
      .from("beta_invites")
      .select("*")
      .eq("code", code.toUpperCase())
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (findError || !invite) {
      return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 400 });
    }

    // Mark code as used
    await adminClient
      .from("beta_invites")
      .update({
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // Add bonus credits to user
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("credits, display_name, email, preferred_language")
      .eq("id", user.id)
      .single();

    const newCredits = (profile?.credits || 0) + invite.bonus_credits;

    await adminClient
      .from("user_profiles")
      .update({
        credits: newCredits,
        is_beta_user: true,
      })
      .eq("id", user.id);

    // Record transaction
    await adminClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: invite.bonus_credits,
      type: "bonus",
      balance_after: newCredits,
      metadata: {
        source: "beta_invite",
        invite_code: code,
      },
    });

    // Send welcome email
    if (profile?.email) {
      await sendWelcomeEmail(profile.email, {
        userName: profile.display_name || "User",
        credits: newCredits,
        language: profile.preferred_language || "en",
      });
    }

    return NextResponse.json({
      success: true,
      bonus_credits: invite.bonus_credits,
      new_balance: newCredits,
    });
  } catch (error) {
    console.error("Beta invite redemption error:", error);
    return NextResponse.json({ error: "Failed to redeem invite code" }, { status: 500 });
  }
}

// Get invite codes list (admin only)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data: invites } = await adminClient
      .from("beta_invites")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Beta invite list error:", error);
    return NextResponse.json({ error: "Failed to get invite codes" }, { status: 500 });
  }
}
