import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-11-17.clover",
  });
}

const CREDIT_PACKAGES = {
  starter: { credits: 25, price: 15 },
  popular: { credits: 50, price: 25 },
  pro: { credits: 100, price: 45 },
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packageId } = body;

    if (!packageId || !(packageId in CREDIT_PACKAGES)) {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    const packageInfo =
      CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${packageInfo.credits} Credits`,
              description: `~${Math.floor(packageInfo.credits / 5)} AI fashion videos`,
            },
            unit_amount: packageInfo.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/credits?success=true`,
      cancel_url: `${request.headers.get("origin")}/credits?canceled=true`,
      metadata: {
        user_id: user.id,
        package_id: packageId,
        credits: packageInfo.credits.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
