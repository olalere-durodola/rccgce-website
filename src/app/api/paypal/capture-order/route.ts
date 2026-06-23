import { NextResponse } from "next/server";
import { z } from "zod";
import { captureOrder, parseFundFromCustomId } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FUNDS, type Fund } from "@/lib/validation";

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
  const unit = capture.purchase_units?.[0];
  const captureAmount = unit?.payments?.captures?.[0]?.amount;
  const fund: Fund | null =
    parseFundFromCustomId(unit?.custom_id) ?? fundHint ?? null;
  const amount = captureAmount?.value
    ? Number(captureAmount.value)
    : (amountHint ?? 0);
  const currency = captureAmount?.currency_code ?? "USD";

  if (!fund || amount <= 0) {
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

  const donation = await prisma.donation.upsert({
    where: { paypalOrderId },
    update: { amount, currency, fund, status: "COMPLETED" },
    create: {
      paypalOrderId,
      amount,
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
      amount,
      currency,
      fund,
    },
  });
}
