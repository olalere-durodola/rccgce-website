import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

/**
 * NextAuth v5 (next-auth@beta) configuration.
 *
 * Strategy: JWT sessions (required for the Credentials provider). The Prisma
 * adapter is still wired up so OAuth (Google) account linking persists to the
 * database, while Credentials logins ride entirely on the JWT.
 *
 * This module is the single source of truth for auth. It exports
 * `{ handlers, auth, signIn, signOut }`. The route handler at
 * `src/app/api/auth/[...nextauth]/route.ts` re-exports `handlers.GET/POST`.
 */

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/** True when Google sign-in is configured. Safe to read on the client only via
 * a server component / env flag — exported here for server-side use. */
export const isGoogleEnabled = googleEnabled;

/**
 * Fail-closed role coercion: any value other than the explicit "ADMIN" string
 * (including unexpected/legacy DB values, undefined, or null) resolves to the
 * least-privileged "MEMBER" role.
 */
function toRole(value: unknown): "MEMBER" | "ADMIN" {
  return value === "ADMIN" ? "ADMIN" : "MEMBER";
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  // Trust the host/proxy headers. Required behind reverse proxies on
  // non-Vercel hosts like Railway, otherwise NextAuth v5 throws an
  // UntrustedHost error on sign-in/callback. Also honoured via AUTH_TRUST_HOST.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // Reject when no user, or an OAuth-only account with no password set.
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: toRole(user.role),
        };
      },
    }),
    // Google is ENV-GATED: only registered when both creds are present so the
    // app runs (and builds) without Google credentials configured.
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // Safe here: Google returns provider-verified emails, so linking a
            // Google login to an existing same-email account can't be abused to
            // hijack an account via an unverified address.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is populated — copy id/role onto the token.
      if (user) {
        token.id = user.id;
        token.role = toRole(user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = toRole(token.role);
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
