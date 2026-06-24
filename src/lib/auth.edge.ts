import NextAuth, { type NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth instance for use in `middleware.ts`.
 *
 * Middleware runs on the Edge runtime, which cannot load the Node-only bits of
 * our main config (Prisma + better-sqlite3 + bcryptjs). This config has NO
 * providers and NO adapter — it only needs to READ the JWT session cookie to
 * decide whether a request is authenticated. The full config in `@/lib/auth`
 * remains the source of truth for actual sign-in.
 */
const edgeConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [],
};

export const { auth } = NextAuth(edgeConfig);
