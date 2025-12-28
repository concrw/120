import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify job belongs to user
    const { data: job } = await supabase
      .from("jobs")
      .select("output_video_url, id, avatars(name), products(name)")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (!job || !job.output_video_url) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Fetch the video from the external URL
    const videoResponse = await fetch(job.output_video_url);

    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video" },
        { status: 500 }
      );
    }

    const videoBlob = await videoResponse.blob();
    const buffer = await videoBlob.arrayBuffer();

    // Generate filename
    const filename = `thirdtwenty_${job.id.slice(0, 8)}.mp4`;

    // Return video with download headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Video download error:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
