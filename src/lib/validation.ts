import { z } from "zod";

/**
 * Allowed donation/subscription funds. Mirrors the documented (SQLite has no
 * native enums) `fund` string column on Donation / Subscription.
 */
export const FUNDS = ["Tithe", "Offering", "Missions", "Building"] as const;
export type Fund = (typeof FUNDS)[number];

// Optional URL field that also accepts an empty string (e.g. cleared inputs).
const optionalUrl = z.url().or(z.literal("")).optional();

// Shared email field: validates format AND normalizes (lowercase + trim) so
// registration and login agree on one canonical value. Without this, a user
// who registers "Jane@Example.com" could not log in (the authorize lookup
// would miss the lowercased stored email).
const emailField = z
  .email("Enter a valid email")
  .transform((value) => value.toLowerCase().trim());

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailField,
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Member profile edit. Email is intentionally omitted: it is the login identity
// (the Credentials authorize() and OAuth account-linking key on it), so v1 keeps
// it read-only to avoid uniqueness collisions and identity drift. We only allow
// editing the display name and an optional avatar image URL.
// TODO: add a verified email-change flow if/when email editing is required.
export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: optionalUrl,
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Giving
// ---------------------------------------------------------------------------

export const donationSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  fund: z.enum(FUNDS),
  currency: z.string().default("USD"),
});
export type DonationInput = z.infer<typeof donationSchema>;

export const subscriptionSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  fund: z.enum(FUNDS),
});
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const seriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: optionalUrl,
});
export type SeriesInput = z.infer<typeof seriesSchema>;

export const sermonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  speaker: z.string().min(1, "Speaker is required"),
  date: z.coerce.date(),
  scripture: z.string().optional(),
  description: z.string().optional(),
  videoUrl: optionalUrl,
  audioUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  seriesId: z.string().optional(),
});
export type SermonInput = z.infer<typeof sermonSchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  location: z.string().optional(),
  imageUrl: optionalUrl,
  isFeatured: z.boolean().default(false),
});
export type EventInput = z.infer<typeof eventSchema>;

export const ministrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  imageUrl: optionalUrl,
  leader: z.string().optional(),
  meetingTime: z.string().optional(),
});
export type MinistryInput = z.infer<typeof ministrySchema>;

export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  coverImage: optionalUrl,
  publishedAt: z.coerce.date().optional(),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

// ---------------------------------------------------------------------------
// Misc public forms
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  message: z.string().min(1, "Message is required"),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email"),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;
