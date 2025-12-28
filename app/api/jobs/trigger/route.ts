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
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Verify job belongs to user
    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check user credits (20 credits per video)
    const VIDEO_COST = 20;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < VIDEO_COST) {
      return NextResponse.json(
        { error: "Insufficient credits. Video generation requires 20 credits." },
        { status: 402 }
      );
    }

    // Deduct credits
    const newBalance = profile.credits - VIDEO_COST;
    await supabase
      .from("user_profiles")
      .update({ credits: newBalance })
      .eq("id", user.id);

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -VIDEO_COST,
      type: "video_generation",
      balance_after: newBalance,
      metadata: {
        job_id: jobId,
      },
    });

    // Trigger Inngest workflow
    await inngest.send({
      name: "video/generate",
      data: {
        jobId: jobId,
      },
    });

    return NextResponse.json({ success: true, jobId, creditsRemaining: newBalance });
  } catch (error) {
    console.error("Job trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger job" },
      { status: 500 }
    );
  }
}
