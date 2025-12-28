import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Fetch the failed job
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed jobs can be retried" },
        { status: 400 }
      );
    }

    // Reset job status to pending
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        status: "pending",
        error_message: null,
        progress: 0,
        current_step: null,
      })
      .eq("id", jobId);

    if (updateError) {
      throw updateError;
    }

    // Trigger video generation again
    await inngest.send({
      name: "video/generate",
      data: {
        jobId: job.id,
      },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error("Job retry error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retry job" },
      { status: 500 }
    );
  }
}
