import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: avatar, error } = await supabase
      .from("avatars")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Avatar not found", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      avatar,
      images: avatar.image_urls || [],
      status: avatar.status,
      created_at: avatar.created_at,
      completed_at: avatar.completed_at,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch avatar", details: error.message },
      { status: 500 }
    );
  }
}
