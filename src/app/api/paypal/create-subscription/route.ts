import { NextResponse } from "next/server";
import { subscriptionSchema } from "@/lib/validation";
import { isPresetRecurringAmount, planIdFor } from "@/lib/giving-config";
import { createSubscription } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { dollarsToCents } from "@/lib/money";

/**
 * POST /api/paypal/create-subscription
 *
 * Validates the recurring gift (`subscriptionSchema` for shape, plus the amount
 * must be one of the preset monthly amounts) then creates a PayPal subscription
 * against a pre-provisioned billing plan.
 *
 * Records the Subscription row HERE at creation time with the donor's real
 * planName, amount (cents), fund, and userId — so the webhook only ever UPDATEs
 * status and never has to invent placeholder amount/fund. Returns `{ id }` for
 * the client PayPalButtons `createSubscription` callback.
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

  const { amount, fund, planName } = parsed.data;

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

  let subscription: { id: string; status: string };
  try {
    subscription = await createSubscription({ planId, amount, fund });
  } catch {
    return NextResponse.json(
      { error: "Could not start the recurring gift. Please try again." },
      { status: 502 },
    );
  }

  // Record the subscription with the donor's real amount/fund so the webhook
  // only updates status. Idempotent on the unique paypalSubscriptionId. If the
  // DB write fails, the subscription still exists at PayPal — log and continue
  // (the webhook upsert will reconcile), but still return the id to the client.
  const session = await auth();
  const userId = session?.user?.id ?? null;
  try {
    await prisma.subscription.upsert({
      where: { paypalSubscriptionId: subscription.id },
      update: { amount: dollarsToCents(amount), fund, planName, userId },
      create: {
        paypalSubscriptionId: subscription.id,
        planName,
        amount: dollarsToCents(amount),
        fund,
        status: subscription.status ?? "APPROVAL_PENDING",
        userId,
      },
    });
  } catch (error) {
    console.error(
      `[create-subscription] Subscription created at PayPal (${subscription.id}) but DB write failed; webhook will reconcile.`,
      error,
    );
  }

  return NextResponse.json({ id: subscription.id });
}
