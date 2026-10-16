import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Register cleanup in each test context, including reused VM workers in CI.
afterEach(() => cleanup());
