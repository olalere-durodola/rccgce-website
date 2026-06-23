/**
 * Central site-level constants used by SEO metadata, the sitemap, and robots.
 *
 * `SITE_URL` resolves from NEXT_PUBLIC_SITE_URL so it is correct across
 * environments (local, preview, production). Update the env var per deploy;
 * the production default is the canonical domain.
 */

export const SITE_NAME = "RCCG Covenant Embassy";

export const SITE_DESCRIPTION =
  "RCCG Covenant Embassy — a house of covenant and destiny in Plano, Texas. " +
  "Join us for worship, watch sermons, explore ministries, plan your visit, " +
  "and give online.";

/** Canonical base URL. Trailing slash trimmed so route joins stay clean. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rccgcovenantembassy.org"
).replace(/\/$/, "");

/** Brand navy — used for theme-color. */
export const THEME_COLOR = "#0B1436";
