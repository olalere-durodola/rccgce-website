import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // The default "forks"/"threads" pools fail to propagate the runner config
    // to the worker under this vite 8 + vitest 4 + Node 22 (Windows) combo
    // ("Cannot read properties of undefined (reading 'config')"). vmThreads
    // runs the modules in an in-process VM context and works reliably.
    pool: "vmThreads",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
