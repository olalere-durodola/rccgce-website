import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

/**
 * Core registration logic, separated from the server action so it can be unit
 * tested without the Next server-action runtime. Validates input, rejects
 * duplicate emails, hashes the password, and creates a MEMBER user.
 */

const BCRYPT_ROUNDS = 12;

export type CreateUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function createUser(input: unknown): Promise<CreateUserResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid registration details.",
    };
  }

  // `email` is already lowercased/trimmed by registerSchema's email transform,
  // so it matches the value the login authorize() will look up.
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: "MEMBER",
      },
    });
    return { ok: true, userId: user.id };
  } catch {
    // Catch the unique-constraint race (someone registered the same email
    // between the check and the insert) and surface a friendly message.
    return { ok: false, error: "An account with that email already exists." };
  }
}
