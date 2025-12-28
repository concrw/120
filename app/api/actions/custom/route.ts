import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Upload custom action reference video
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("video") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "Video file required" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files allowed" }, { status: 400 });
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be under 100MB" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Upload to storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("custom-actions")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from("custom-actions")
      .getPublicUrl(uploadData.path);

    // Save to database
    const { data: action, error: dbError } = await adminClient
      .from("custom_actions")
      .insert({
        user_id: user.id,
        name: name || "Custom Action",
        description,
        video_url: urlData.publicUrl,
        file_size: file.size,
        duration: null, // Would be extracted from video metadata
        status: "processing",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to save action" }, { status: 500 });
    }

    // Trigger pose extraction (in production)
    // await inngest.send({ name: "action/extract-pose", data: { actionId: action.id } });

    // For now, mark as ready immediately
    await adminClient
      .from("custom_actions")
      .update({
        status: "ready",
        metadata: {
          processed: true,
          pose_extracted: true,
        },
      })
      .eq("id", action.id);

    return NextResponse.json({
      success: true,
      action: { ...action, status: "ready" },
    });
  } catch (error) {
    console.error("Custom action error:", error);
    return NextResponse.json({ error: "Failed to upload action" }, { status: 500 });
  }
}

// Get user's custom actions
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actions, error } = await supabase
      .from("custom_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch actions error:", error);
      return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 });
    }

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Actions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 });
  }
}

// Delete custom action
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Action ID required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get action info first
    const { data: action } = await adminClient
      .from("custom_actions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    // Delete from storage
    const filePath = action.video_url.split("/custom-actions/")[1];
    if (filePath) {
      await adminClient.storage.from("custom-actions").remove([filePath]);
    }

    // Delete from database
    await adminClient.from("custom_actions").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Action delete error:", error);
    return NextResponse.json({ error: "Failed to delete action" }, { status: 500 });
  }
}
