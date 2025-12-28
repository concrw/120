import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  try {
    const results = {
      tests: [] as any[],
    };

    // Test 1: Stripe API connection
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-11-17.clover",
      });

      // Test connection by retrieving account info
      const account = await stripe.accounts.retrieve();

      results.tests.push({
        service: "Stripe API",
        test: "API connection and authentication",
        passed: true,
        message: "Successfully connected to Stripe",
        account_id: account.id,
        account_type: account.type,
      });
    } catch (error: any) {
      results.tests.push({
        service: "Stripe API",
        test: "API connection and authentication",
        passed: false,
        error: error.message,
      });
    }

    // Test 2: Webhook secret configured
    const webhookSecretExists = !!process.env.STRIPE_WEBHOOK_SECRET;

    results.tests.push({
      service: "Stripe Webhook",
      test: "Webhook secret configuration",
      passed: webhookSecretExists,
      message: webhookSecretExists
        ? "Webhook secret is configured"
        : "Webhook secret is missing",
    });

    // Test 3: Publishable key configured
    const publishableKeyExists = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    results.tests.push({
      service: "Stripe Client",
      test: "Publishable key configuration",
      passed: publishableKeyExists,
      message: publishableKeyExists
        ? "Publishable key is configured"
        : "Publishable key is missing",
    });

    // Test 4: List available payment methods
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-11-17.clover",
      });

      const paymentMethods = await stripe.paymentMethods.list({
        limit: 1,
      });

      results.tests.push({
        service: "Stripe Payment Methods",
        test: "Can list payment methods",
        passed: true,
        message: "Successfully listed payment methods",
      });
    } catch (error: any) {
      results.tests.push({
        service: "Stripe Payment Methods",
        test: "Can list payment methods",
        passed: false,
        error: error.message,
      });
    }

    const allPassed = results.tests.every((t) => t.passed);

    return NextResponse.json({
      status: allPassed ? "passed" : "failed",
      timestamp: new Date().toISOString(),
      results,
      credit_packages: {
        starter: { credits: 25, price: "$15" },
        popular: { credits: 50, price: "$25" },
        pro: { credits: 100, price: "$45" },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Stripe test failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
