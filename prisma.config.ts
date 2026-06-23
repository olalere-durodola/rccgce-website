import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "@prisma/config";

// Prisma v7 moved the connection URL out of schema.prisma. The CLI
// (migrate / db / introspect) reads the datasource URL from here.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
