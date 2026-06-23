import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";

/**
 * POST /api/newsletter — subscribe an email address.
 *
 * Validates with `newsletterSchema` and upserts the signup (dedupe by the
 * unique email column), so re-subscribing an existing address still returns
 * `{ ok: true }` and never leaks who is already signed up. Complements the
 * existing `subscribeNewsletter` server action.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = newsletterSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    await prisma.newsletterSignup.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
