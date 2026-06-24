import { NextResponse } from "next/server";
import { donationSchema } from "@/lib/validation";
import { createOrder } from "@/lib/paypal";

/**
 * POST /api/paypal/create-order
 *
 * Validates the gift with `donationSchema` (amount > 0, valid fund) then creates
 * a PayPal CAPTURE order. Returns `{ id }` for the client PayPalButtons
 * `createOrder` callback. Guest giving is allowed (no auth required here).
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = donationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid amount and fund." },
      { status: 400 },
    );
  }

  const { amount, fund, currency } = parsed.data;

  try {
    const order = await createOrder({ amount, fund, currency });
    return NextResponse.json({ id: order.id });
  } catch {
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 },
    );
  }
}
