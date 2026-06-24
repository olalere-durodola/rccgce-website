import NextAuth, { type NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth instance for use in `middleware.ts`.
 *
 * Middleware runs on the Edge runtime, which cannot load the Node-only bits of
 * our main config (Prisma + the Postgres driver + bcryptjs). This config has NO
 * providers and NO adapter — it only needs to READ the JWT session cookie to
 * decide whether a request is authenticated. The full config in `@/lib/auth`
 * remains the source of truth for actual sign-in.
 */
const edgeConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  // Trust the host/proxy headers. Required behind reverse proxies on
  // non-Vercel hosts like Railway, otherwise NextAuth v5 throws an
  // UntrustedHost error. Also honoured via the AUTH_TRUST_HOST env var.
  trustHost: true,
  providers: [],
};

export const { auth } = NextAuth(edgeConfig);
