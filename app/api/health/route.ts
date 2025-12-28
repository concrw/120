import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check database connection
    const { data: tables, error: tablesError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    if (tablesError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: tablesError.message,
        },
        { status: 500 }
      );
    }

    // Check all required tables exist
    const requiredTables = [
      "user_profiles",
      "avatars",
      "products",
      "jobs",
      "subscriptions",
      "credit_transactions",
    ];

    const tableChecks = await Promise.all(
      requiredTables.map(async (table) => {
        const { error } = await supabase.from(table).select("id").limit(1);
        return {
          table,
          exists: !error,
          error: error?.message || null,
        };
      })
    );

    const allTablesExist = tableChecks.every((check) => check.exists);

    // Check environment variables
    const envCheck = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      replicate_api: !!process.env.REPLICATE_API_TOKEN,
      openai_api: !!process.env.OPENAI_API_KEY,
      stripe_secret: !!process.env.STRIPE_SECRET_KEY,
      stripe_webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    };

    const allEnvSet = Object.values(envCheck).every((v) => v);

    return NextResponse.json({
      status: allTablesExist && allEnvSet ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tables: tableChecks,
      },
      environment: envCheck,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
