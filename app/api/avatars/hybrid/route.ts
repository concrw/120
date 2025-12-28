import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

interface BodyPartReference {
  part: "face" | "body" | "legs" | "skin_tone";
  imageUrl: string;
  weight: number; // 0-100
}

// Create hybrid avatar from multiple references
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check credits (hybrid avatar costs 25 credits)
    const HYBRID_COST = 25;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < HYBRID_COST) {
      return NextResponse.json(
        { error: `Insufficient credits. Hybrid avatar requires ${HYBRID_COST} credits.` },
        { status: 400 }
      );
    }

    const { name, references } = (await request.json()) as {
      name: string;
      references: BodyPartReference[];
    };

    if (!name) {
      return NextResponse.json({ error: "Avatar name required" }, { status: 400 });
    }

    if (!references || references.length < 2) {
      return NextResponse.json(
        { error: "At least 2 body part references required" },
        { status: 400 }
      );
    }

    // Validate references
    const hasFace = references.some((r) => r.part === "face");
    const hasBody = references.some((r) => r.part === "body");

    if (!hasFace || !hasBody) {
      return NextResponse.json(
        { error: "Face and body references are required" },
        { status: 400 }
      );
    }

    if (references.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 references allowed" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const avatarId = crypto.randomUUID();

    // Create avatar record
    const { data: avatar, error: dbError } = await adminClient
      .from("avatars")
      .insert({
        id: avatarId,
        user_id: user.id,
        name,
        style: "hybrid",
        status: "pending",
        source_type: "hybrid_references",
        metadata: {
          references: references.map((r) => ({
            part: r.part,
            weight: r.weight,
          })),
          is_hybrid: true,
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
      .update({ credits: profile.credits - HYBRID_COST })
      .eq("id", user.id);

    // Record transaction
    await adminClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -HYBRID_COST,
      type: "usage",
      balance_after: profile.credits - HYBRID_COST,
      metadata: {
        action: "hybrid_avatar_creation",
        avatar_id: avatarId,
      },
    });

    // Trigger hybrid generation
    await inngest.send({
      name: "avatar/generate-hybrid",
      data: {
        avatarId,
        references,
      },
    });

    return NextResponse.json({
      success: true,
      avatar,
      message: "Hybrid avatar generation started. This may take 20-30 minutes.",
    });
  } catch (error) {
    console.error("Hybrid avatar error:", error);
    return NextResponse.json({ error: "Failed to create hybrid avatar" }, { status: 500 });
  }
}

// Upload reference image for hybrid avatar
export async function PUT(request: Request) {
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
    const part = formData.get("part") as string;

    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    if (!["face", "body", "legs", "skin_tone"].includes(part)) {
      return NextResponse.json({ error: "Invalid body part" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Upload to storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/hybrid-refs/${Date.now()}-${part}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("avatar-references")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: urlData } = adminClient.storage
      .from("avatar-references")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      part,
    });
  } catch (error) {
    console.error("Reference upload error:", error);
    return NextResponse.json({ error: "Failed to upload reference" }, { status: 500 });
  }
}
