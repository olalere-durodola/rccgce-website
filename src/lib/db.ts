import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma v7 requires a driver adapter. We use @prisma/adapter-pg (node-postgres)
// for PostgreSQL in every environment — Railway managed Postgres in production
// and a local Postgres (Docker, see README) in development.
// DATABASE_URL example: postgresql://USER:PASS@localhost:5432/rccgce?schema=public
const connectionString = process.env.DATABASE_URL;

// Fail fast with a clear message in production rather than surfacing an opaque
// error on the first query. In dev we allow it to be unset (e.g. `next build`,
// which does no DB work) so the build never needs a live database.
if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error(
    "DATABASE_URL is not set. On Railway, add a PostgreSQL service and set the " +
      "web service variable DATABASE_URL=${{Postgres.DATABASE_URL}}.",
  );
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Cache the client on globalThis in development so Next.js hot-reload does not
// spawn a new connection pool on every edit (the classic "too many clients").
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Convenience alias.
export const db = prisma;
