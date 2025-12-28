import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

// Upload custom avatar photos for LoRA training
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check credits (custom avatar costs 20 credits)
    const CUSTOM_AVATAR_COST = 20;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < CUSTOM_AVATAR_COST) {
      return NextResponse.json(
        { error: "Insufficient credits. Custom avatar requires 20 credits." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const files = formData.getAll("photos") as File[];

    if (!name) {
      return NextResponse.json({ error: "Avatar name is required" }, { status: 400 });
    }

    // Validate photos (10-20 photos required)
    if (files.length < 10 || files.length > 20) {
      return NextResponse.json(
        { error: "Please upload between 10-20 photos" },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, and WebP images are allowed" },
          { status: 400 }
        );
      }
      // Check file size (max 10MB each)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Each image must be under 10MB" },
          { status: 400 }
        );
      }
    }

    const adminClient = createAdminClient();

    // Upload all photos to storage
    const uploadedUrls: string[] = [];
    const avatarId = crypto.randomUUID();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${avatarId}/${i}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("avatar-training")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 });
      }

      const { data: urlData } = adminClient.storage
        .from("avatar-training")
        .getPublicUrl(uploadData.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    // Create avatar record
    const { data: avatar, error: dbError } = await adminClient
      .from("avatars")
      .insert({
        id: avatarId,
        user_id: user.id,
        name,
        style: "custom",
        status: "pending",
        source_type: "custom_photos",
        training_images: uploadedUrls,
        metadata: {
          photo_count: files.length,
          is_custom: true,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to create avatar" }, { status: 500 });
    }

    // Deduct credits
    await adminClient
      .from("user_profiles")
      .update({ credits: profile.credits - CUSTOM_AVATAR_COST })
      .eq("id", user.id);

    // Record transaction
    await adminClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -CUSTOM_AVATAR_COST,
      type: "usage",
      balance_after: profile.credits - CUSTOM_AVATAR_COST,
      metadata: {
        action: "custom_avatar_creation",
        avatar_id: avatarId,
      },
    });

    // Trigger custom avatar generation (LoRA training)
    await inngest.send({
      name: "avatar/generate-custom",
      data: {
        avatarId,
        trainingImages: uploadedUrls,
      },
    });

    return NextResponse.json({
      success: true,
      avatar,
      message: "Custom avatar training started. This may take 15-30 minutes.",
    });
  } catch (error) {
    console.error("Custom avatar error:", error);
    return NextResponse.json({ error: "Failed to create custom avatar" }, { status: 500 });
  }
}

// Get custom avatar training status
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
    const avatarId = searchParams.get("id");

    if (avatarId) {
      const { data: avatar } = await supabase
        .from("avatars")
        .select("*")
        .eq("id", avatarId)
        .eq("user_id", user.id)
        .single();

      return NextResponse.json({ avatar });
    }

    // Get all custom avatars
    const { data: avatars } = await supabase
      .from("avatars")
      .select("*")
      .eq("user_id", user.id)
      .eq("style", "custom")
      .order("created_at", { ascending: false });

    return NextResponse.json({ avatars });
  } catch (error) {
    console.error("Custom avatar fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch avatars" }, { status: 500 });
  }
}
