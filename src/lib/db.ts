import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma v7 requires a driver adapter. For local SQLite we use better-sqlite3.
// DATABASE_URL is e.g. "file:./dev.db"; strip the file: prefix for the adapter.
const url = process.env.DATABASE_URL ?? "file:./dev.db";

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url });
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
