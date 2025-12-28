import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string; // image or video

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/webm"];
    const allowedTypes = type === "video" ? allowedVideoTypes : allowedImageTypes;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Check file size (10MB for images, 50MB for videos)
    const maxSize = type === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("backgrounds")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from("backgrounds")
      .getPublicUrl(uploadData.path);

    // Save to database
    const { data: background, error: dbError } = await adminClient
      .from("custom_backgrounds")
      .insert({
        user_id: user.id,
        name: name || file.name,
        type: type || "image",
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to save background" }, { status: 500 });
    }

    return NextResponse.json({ success: true, background });
  } catch (error) {
    console.error("Background upload error:", error);
    return NextResponse.json({ error: "Failed to upload background" }, { status: 500 });
  }
}

// Get user's custom backgrounds
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: backgrounds, error } = await supabase
      .from("custom_backgrounds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch backgrounds error:", error);
      return NextResponse.json({ error: "Failed to fetch backgrounds" }, { status: 500 });
    }

    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error("Backgrounds fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch backgrounds" }, { status: 500 });
  }
}

// Delete custom background
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
      return NextResponse.json({ error: "Background ID required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get background info first
    const { data: background } = await adminClient
      .from("custom_backgrounds")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!background) {
      return NextResponse.json({ error: "Background not found" }, { status: 404 });
    }

    // Delete from storage
    const filePath = background.file_url.split("/backgrounds/")[1];
    if (filePath) {
      await adminClient.storage.from("backgrounds").remove([filePath]);
    }

    // Delete from database
    await adminClient.from("custom_backgrounds").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Background delete error:", error);
    return NextResponse.json({ error: "Failed to delete background" }, { status: 500 });
  }
}
