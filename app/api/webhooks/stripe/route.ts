import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_id, credits } = session.metadata || {};

      if (!user_id || !credits) {
        console.error("Missing metadata in checkout session");
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      const supabase = await createClient();

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("credits")
        .eq("id", user_id)
        .single();

      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits + parseInt(credits);

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ credits: newCredits })
        .eq("id", user_id);

      if (updateError) {
        console.error("Failed to update credits:", updateError);
        return NextResponse.json(
          { error: "Failed to update credits" },
          { status: 500 }
        );
      }

      await supabase.from("credit_transactions").insert({
        user_id: user_id,
        amount: parseInt(credits),
        type: "purchase",
        balance_after: newCredits,
        metadata: {
          stripe_session_id: session.id,
          package_id: session.metadata?.package_id,
        },
      });

      console.log(
        `Credits updated for user ${user_id}: ${currentCredits} -> ${newCredits}`
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
