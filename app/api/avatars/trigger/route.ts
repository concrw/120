import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { avatarId } = body;

    if (!avatarId) {
      return NextResponse.json(
        { error: "Avatar ID is required" },
        { status: 400 }
      );
    }

    // Verify avatar belongs to user
    const { data: avatar } = await supabase
      .from("avatars")
      .select("*")
      .eq("id", avatarId)
      .eq("user_id", user.id)
      .single();

    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    // Check user credits (10 credits per avatar)
    const AVATAR_COST = 10;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < AVATAR_COST) {
      return NextResponse.json(
        { error: "Insufficient credits. Avatar generation requires 10 credits." },
        { status: 402 }
      );
    }

    // Deduct credits
    const newBalance = profile.credits - AVATAR_COST;
    await supabase
      .from("user_profiles")
      .update({ credits: newBalance })
      .eq("id", user.id);

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -AVATAR_COST,
      type: "avatar_generation",
      balance_after: newBalance,
      metadata: {
        avatar_id: avatarId,
      },
    });

    // Trigger Inngest workflow
    await inngest.send({
      name: "avatar/generate",
      data: {
        avatarId: avatarId,
      },
    });

    return NextResponse.json({ success: true, avatarId, creditsRemaining: newBalance });
  } catch (error) {
    console.error("Avatar trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger avatar generation" },
      { status: 500 }
    );
  }
}
