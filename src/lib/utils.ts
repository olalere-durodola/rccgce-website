import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Turn an arbitrary string into a URL-safe slug: lowercase, alphanumerics
 * separated by single hyphens, with leading/trailing hyphens trimmed.
 *
 * e.g. "The Power of Covenant!" -> "the-power-of-covenant"
 *
 * Note: this can yield an empty string (e.g. for input that is all symbols);
 * callers that require a non-empty slug should validate the result.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
