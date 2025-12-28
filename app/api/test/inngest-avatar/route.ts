import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Create a test user if needed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please authenticate first",
          suggestion: "Visit /auth/signup to create a test account",
        },
        { status: 401 }
      );
    }

    // Create a test avatar entry
    const { data: avatar, error: avatarError } = await supabase
      .from("avatars")
      .insert({
        user_id: user.id,
        prompt: "A professional fashion model in elegant evening wear",
        status: "processing",
      })
      .select()
      .single();

    if (avatarError) {
      return NextResponse.json(
        { error: "Failed to create test avatar", details: avatarError.message },
        { status: 500 }
      );
    }

    // Trigger the Inngest workflow
    await inngest.send({
      name: "avatar/generate",
      data: {
        avatarId: avatar.id,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Avatar generation job triggered",
      avatar: {
        id: avatar.id,
        user_id: avatar.user_id,
        prompt: avatar.prompt,
        status: avatar.status,
      },
      inngest_ui: "http://localhost:8288",
      check_status: `/api/avatars/${avatar.id}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to trigger avatar generation",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
