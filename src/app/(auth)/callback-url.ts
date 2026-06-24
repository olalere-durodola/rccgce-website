/** Default post-login destination when no (valid) callbackUrl is supplied. */
export const DEFAULT_CALLBACK = "/account";

/**
 * Validate a post-login redirect target. Only same-origin RELATIVE paths are
 * allowed, to prevent open-redirect attacks: the value must start with a single
 * "/" and must NOT start with "//" or "/\" (protocol-relative URLs) — those, as
 * well as absolute URLs and anything else, fall back to {@link DEFAULT_CALLBACK}.
 */
export function safeCallbackUrl(
  raw: FormDataEntryValue | null | undefined,
): string {
  if (typeof raw !== "string" || raw.length === 0) return DEFAULT_CALLBACK;
  // Must be a relative path rooted at "/".
  if (raw[0] !== "/") return DEFAULT_CALLBACK;
  // Reject protocol-relative ("//evil") and backslash-tricks ("/\evil").
  if (raw[1] === "/" || raw[1] === "\\") return DEFAULT_CALLBACK;
  return raw;
}
