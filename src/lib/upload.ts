import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Image upload abstraction.
 *
 * `saveUpload` persists an uploaded image and returns the PUBLIC path that can
 * be stored on a record and rendered with <img src> / next/image.
 *
 * SWAPPABLE BY DESIGN: today this writes to the local `public/uploads/`
 * directory (good enough for a single-server / self-hosted deployment). To move
 * to S3, UploadThing, Cloudinary, etc. later, replace only the body of
 * `saveUpload` (and the dir helper) — the signature `(File) => Promise<string>`
 * is the contract callers depend on, so nothing else needs to change.
 *
 * NOTE on serverless: a local-disk strategy assumes a persistent filesystem. On
 * ephemeral/serverless hosts (Vercel, etc.) the written file does not survive
 * the request, so swap to an object-store implementation before deploying there.
 */

/** Absolute path to the public uploads directory. */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Public URL prefix that maps to UPLOAD_DIR. */
const PUBLIC_PREFIX = "/uploads";

/** Allowed image content types (defence against arbitrary file writes). */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/**
 * Save an uploaded image to `public/uploads/<unique>.<ext>` and return its
 * public path (e.g. `/uploads/ab12….png`).
 *
 * Returns `null` when there is no usable file (the common "left the file input
 * empty" case), so callers can fall back to a pasted URL without branching on
 * FormData quirks. Throws on an unsupported / non-image type.
 */
export async function saveUpload(
  file: File | null | undefined,
): Promise<string | null> {
  // No file selected: FormData yields either null or a zero-byte File.
  if (!file || typeof file === "string" || file.size === 0) {
    return null;
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported image type "${file.type}". Allowed: JPEG, PNG, WebP, GIF, AVIF.`,
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = EXT_BY_TYPE[file.type] ?? ".bin";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `${PUBLIC_PREFIX}/${filename}`;
}
