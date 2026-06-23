import { NextResponse } from "next/server";
import { verifyWebhookSignature, mapWebhookEvent } from "@/lib/paypal";
import { prisma } from "@/lib/db";

/**
 * POST /api/paypal/webhook — PayPal event receiver.
 *
 * Flow:
 *  1. Read the RAW body (`req.text()`) — required so signature verification
 *     runs over the exact bytes PayPal signed — then JSON.parse it.
 *  2. Verify the transmission signature; reject with 401 if invalid.
 *  3. Normalize the event with the PURE `mapWebhookEvent`.
 *  4. Upsert keyed on the unique id (paypalOrderId / paypalSubscriptionId), so
 *     re-delivery of the same event never creates a duplicate row. This is also
 *     the source of truth that converges with the capture-order route.
 *  5. Unknown events are acknowledged with 200 and no DB write.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const verified = await verifyWebhookSignature(request.headers, rawBody);
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mapped = mapWebhookEvent(event);
  if (!mapped) {
    // Unknown / unhandled event type — acknowledge so PayPal stops retrying.
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    if (mapped.kind === "donation") {
      // amount is integer cents (or null when unparseable). Don't record a
      // half-record missing fund or a valid amount.
      if (!mapped.fund || mapped.amount === null || mapped.amount <= 0) {
        return NextResponse.json({ ok: true, ignored: true });
      }
      await prisma.donation.upsert({
        where: { paypalOrderId: mapped.paypalOrderId },
        update: {
          amount: mapped.amount,
          currency: mapped.currency,
          fund: mapped.fund,
          status: mapped.status,
        },
        create: {
          paypalOrderId: mapped.paypalOrderId,
          amount: mapped.amount,
          currency: mapped.currency,
          fund: mapped.fund,
          status: mapped.status,
        },
      });
    } else {
      // Subscriptions are recorded with real amount/fund at create time. The
      // webhook only UPDATEs status — it must NEVER overwrite a real amount
      // with 0 or a real fund with a placeholder. We only set amount/fund on
      // CREATE, and only when the event actually carried them.
      await prisma.subscription.upsert({
        where: { paypalSubscriptionId: mapped.paypalSubscriptionId },
        update: { status: mapped.status },
        create: {
          paypalSubscriptionId: mapped.paypalSubscriptionId,
          status: mapped.status,
          planName: mapped.planName ?? "Recurring Gift",
          // Use known values when present; fall back only on first-seen create
          // (e.g. if the create-subscription route's DB write had failed).
          amount: mapped.amount ?? 0,
          fund: mapped.fund ?? "Offering",
        },
      });
    }
  } catch {
    // Signal a server error so PayPal retries delivery later.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
