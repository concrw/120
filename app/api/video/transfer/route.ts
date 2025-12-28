import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

// Real Model Transfer - Replace person in video with AI avatar
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check credits (transfer costs 30 credits)
    const TRANSFER_COST = 30;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < TRANSFER_COST) {
      return NextResponse.json(
        { error: `Insufficient credits. Transfer requires ${TRANSFER_COST} credits.` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const avatarId = formData.get("avatarId") as string;
    const productIds = formData.get("productIds") as string; // comma-separated
    const keepBackground = formData.get("keepBackground") === "true";

    if (!videoFile) {
      return NextResponse.json({ error: "Video file required" }, { status: 400 });
    }

    if (!avatarId) {
      return NextResponse.json({ error: "Avatar ID required" }, { status: 400 });
    }

    // Validate video
    if (!videoFile.type.startsWith("video/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (videoFile.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be under 100MB" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Upload source video
    const fileExt = videoFile.name.split(".").pop();
    const fileName = `${user.id}/transfer/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("transfer-videos")
      .upload(fileName, videoFile, {
        contentType: videoFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
    }

    const { data: urlData } = adminClient.storage
      .from("transfer-videos")
      .getPublicUrl(uploadData.path);

    // Create transfer job
    const { data: job, error: jobError } = await adminClient
      .from("transfer_jobs")
      .insert({
        user_id: user.id,
        source_video_url: urlData.publicUrl,
        target_avatar_id: avatarId,
        target_product_ids: productIds ? productIds.split(",") : [],
        keep_background: keepBackground,
        status: "pending",
        metadata: {
          original_filename: videoFile.name,
          file_size: videoFile.size,
        },
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return NextResponse.json({ error: "Failed to create transfer job" }, { status: 500 });
    }

    // Deduct credits
    await adminClient
      .from("user_profiles")
      .update({ credits: profile.credits - TRANSFER_COST })
      .eq("id", user.id);

    // Record transaction
    await adminClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -TRANSFER_COST,
      type: "usage",
      balance_after: profile.credits - TRANSFER_COST,
      metadata: {
        action: "real_model_transfer",
        job_id: job.id,
      },
    });

    // Trigger transfer pipeline
    await inngest.send({
      name: "video/transfer",
      data: {
        jobId: job.id,
        sourceVideoUrl: urlData.publicUrl,
        avatarId,
        productIds: productIds ? productIds.split(",") : [],
        keepBackground,
      },
    });

    return NextResponse.json({
      success: true,
      job,
      message: "Video transfer started. This may take 10-20 minutes.",
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Failed to start transfer" }, { status: 500 });
  }
}

// Get transfer job status
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("id");

    if (jobId) {
      const { data: job } = await supabase
        .from("transfer_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      return NextResponse.json({ job });
    }

    // Get all transfer jobs
    const { data: jobs } = await supabase
      .from("transfer_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Transfer fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
