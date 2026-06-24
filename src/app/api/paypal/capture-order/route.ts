import { NextResponse } from "next/server";
import { z } from "zod";
import { captureOrder, parseFundFromCustomId } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FUNDS, type Fund } from "@/lib/validation";
import { parseAmountToCents, dollarsToCents } from "@/lib/money";

const bodySchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
  // Optional client hints; the captured order is the source of truth and these
  // are only fallbacks when PayPal omits custom_id / amount.
  fund: z.enum(FUNDS).optional(),
  amount: z.number().positive().optional(),
});

type CaptureResult = {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{
        amount?: { value?: string; currency_code?: string };
      }>;
    };
  }>;
};

/**
 * POST /api/paypal/capture-order
 *
 * Captures a PayPal order. On COMPLETED, records the gift as a Donation using
 * an idempotent upsert keyed on the unique `paypalOrderId` — so this route and
 * the webhook converge on a single row even if both fire for the same order.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "orderId is required." },
      { status: 400 },
    );
  }

  const { orderId, fund: fundHint, amount: amountHint } = parsed.data;

  let capture: CaptureResult;
  try {
    capture = (await captureOrder(orderId)) as CaptureResult;
  } catch {
    return NextResponse.json(
      { error: "Could not complete the payment. Please try again." },
      { status: 502 },
    );
  }

  if (capture.status !== "COMPLETED") {
    return NextResponse.json({ status: capture.status }, { status: 200 });
  }

  // Prefer values from the captured order; fall back to client hints.
  // Money is recorded as integer CENTS — never store the raw float.
  const unit = capture.purchase_units?.[0];
  const captureAmount = unit?.payments?.captures?.[0]?.amount;
  const fund: Fund | null =
    parseFundFromCustomId(unit?.custom_id) ?? fundHint ?? null;
  const amountCents =
    parseAmountToCents(captureAmount?.value) ??
    (amountHint !== undefined ? dollarsToCents(amountHint) : null);
  const currency = captureAmount?.currency_code ?? "USD";

  if (!fund || amountCents === null || amountCents <= 0) {
    // Payment captured but we cannot attribute it — ack so PayPal doesn't retry
    // the client flow; the webhook (source of truth) can still record it later.
    return NextResponse.json(
      { status: "COMPLETED", recorded: false },
      { status: 200 },
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const paypalOrderId = capture.id ?? orderId;

  // The money has already been taken. If the DB write fails we must NOT tell the
  // donor the gift failed — log for reconciliation and report "captured but not
  // yet recorded"; the idempotent webhook will reconcile by paypalOrderId.
  try {
    const donation = await prisma.donation.upsert({
      where: { paypalOrderId },
      update: { amount: amountCents, currency, fund, status: "COMPLETED" },
      create: {
        paypalOrderId,
        amount: amountCents,
        currency,
        fund,
        status: "COMPLETED",
        userId,
      },
    });

    return NextResponse.json({
      status: "COMPLETED",
      recorded: true,
      donation: {
        id: donation.id,
        amount: amountCents,
        currency,
        fund,
      },
    });
  } catch (error) {
    console.error(
      `[capture-order] Capture COMPLETED but DB write failed for paypalOrderId=${paypalOrderId}; webhook will reconcile.`,
      error,
    );
    return NextResponse.json(
      {
        status: "COMPLETED",
        recorded: false,
        reconciling: true,
        message:
          "Your gift was received. We're finalizing the record — thank you!",
      },
      { status: 200 },
    );
  }
}
