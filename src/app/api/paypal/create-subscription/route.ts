import { NextResponse } from "next/server";
import { subscriptionSchema } from "@/lib/validation";
import { isPresetRecurringAmount, planIdFor } from "@/lib/giving-config";
import { createSubscription } from "@/lib/paypal";

/**
 * POST /api/paypal/create-subscription
 *
 * Validates the recurring gift (`subscriptionSchema` for shape, plus the amount
 * must be one of the preset monthly amounts) then creates a PayPal subscription
 * against a pre-provisioned billing plan. Returns `{ id }` for the client
 * PayPalButtons `createSubscription` callback.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = subscriptionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid plan, amount, and fund." },
      { status: 400 },
    );
  }

  const { amount, fund } = parsed.data;

  if (!isPresetRecurringAmount(amount)) {
    return NextResponse.json(
      { error: "Recurring gifts must use one of the preset monthly amounts." },
      { status: 400 },
    );
  }

  const planId = planIdFor(fund, amount);
  if (!planId) {
    // Plan not provisioned yet (sandbox/build). Fail gracefully.
    return NextResponse.json(
      { error: "Recurring giving is being configured. Please check back." },
      { status: 503 },
    );
  }

  try {
    const subscription = await createSubscription({ planId, amount, fund });
    return NextResponse.json({ id: subscription.id });
  } catch {
    return NextResponse.json(
      { error: "Could not start the recurring gift. Please try again." },
      { status: 502 },
    );
  }
}
