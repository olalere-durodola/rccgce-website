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
      if (!mapped.fund) {
        // Can't attribute the fund — ack but do not record a half-record.
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
      await prisma.subscription.upsert({
        where: { paypalSubscriptionId: mapped.paypalSubscriptionId },
        update: { status: mapped.status },
        create: {
          paypalSubscriptionId: mapped.paypalSubscriptionId,
          status: mapped.status,
          planName: mapped.planName ?? "Recurring Gift",
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
