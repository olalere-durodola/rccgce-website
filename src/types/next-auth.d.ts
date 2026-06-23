import type { DefaultSession } from "next-auth";

/**
 * Module augmentation so `session.user.role` and `session.user.id` are typed,
 * and so the JWT carries `role`/`id` through the jwt/session callbacks.
 *
 * `role` mirrors the User.role string column: "MEMBER" | "ADMIN".
 */
type UserRole = "MEMBER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
