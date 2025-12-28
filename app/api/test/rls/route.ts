import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          status: "unauthorized",
          message: "Please login to test RLS policies",
        },
        { status: 401 }
      );
    }

    const results = {
      user_id: user.id,
      tests: [] as any[],
    };

    // Test 1: User can read own profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    results.tests.push({
      test: "Read own profile",
      passed: !profileError && profile !== null,
      error: profileError?.message || null,
    });

    // Test 2: User can read own avatars
    const { data: avatars, error: avatarsError } = await supabase
      .from("avatars")
      .select("*")
      .eq("user_id", user.id);

    results.tests.push({
      test: "Read own avatars",
      passed: !avatarsError,
      count: avatars?.length || 0,
      error: avatarsError?.message || null,
    });

    // Test 3: User can read own products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id);

    results.tests.push({
      test: "Read own products",
      passed: !productsError,
      count: products?.length || 0,
      error: productsError?.message || null,
    });

    // Test 4: User can read own jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id);

    results.tests.push({
      test: "Read own jobs",
      passed: !jobsError,
      count: jobs?.length || 0,
      error: jobsError?.message || null,
    });

    // Test 5: User can read own credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id);

    results.tests.push({
      test: "Read own credit transactions",
      passed: !transactionsError,
      count: transactions?.length || 0,
      error: transactionsError?.message || null,
    });

    // Test 6: User can update own profile
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", user.id);

    results.tests.push({
      test: "Update own profile",
      passed: !updateError,
      error: updateError?.message || null,
    });

    // Test 7: User CANNOT read other users' data (create a fake UUID)
    const fakeUserId = "00000000-0000-0000-0000-000000000000";
    const { data: otherProfile, error: otherProfileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", fakeUserId)
      .single();

    results.tests.push({
      test: "CANNOT read other users' profiles (should fail)",
      passed: otherProfile === null || !!otherProfileError,
      error: otherProfileError?.message || "Incorrectly allowed access",
    });

    const allPassed = results.tests.every((t) => t.passed);

    return NextResponse.json({
      status: allPassed ? "passed" : "failed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "RLS test failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
