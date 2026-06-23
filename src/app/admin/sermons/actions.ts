"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { saveUpload } from "@/lib/upload";
import {
  createSermonCore,
  updateSermonCore,
  deleteSermonCore,
} from "./sermon-core";

/**
 * State returned to the SermonForm via `useActionState`. `status` drives which
 * message + aria role the form announces; `errors` carries field messages.
 */
export type SermonFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Record<string, string>;
};

/**
 * Pull the editable fields out of FormData into a plain object the core can
 * validate. If a file was uploaded it overrides the pasted thumbnail URL.
 */
async function readFormData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };

  let thumbnailUrl = get("thumbnailUrl");
  const uploaded = await saveUpload(formData.get("thumbnailFile") as File | null);
  if (uploaded) thumbnailUrl = uploaded;

  return {
    title: get("title"),
    slug: get("slug"),
    speaker: get("speaker"),
    date: get("date"),
    scripture: get("scripture"),
    description: get("description"),
    videoUrl: get("videoUrl"),
    audioUrl: get("audioUrl"),
    thumbnailUrl,
    seriesId: get("seriesId"),
  };
}

/** Refresh both the admin list and the public sermon surfaces. */
function revalidateSermons() {
  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
}

export async function createSermon(
  _prev: SermonFormState,
  formData: FormData,
): Promise<SermonFormState> {
  // Defence in depth: redirects a non-admin before any work happens.
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await createSermonCore(input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateSermons();
  redirect("/admin/sermons?saved=1");
}

export async function updateSermon(
  id: string,
  _prev: SermonFormState,
  formData: FormData,
): Promise<SermonFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await updateSermonCore(id, input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateSermons();
  redirect("/admin/sermons?saved=1");
}

/** Posted from the row delete form in the list page. */
export async function deleteSermon(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const result = await deleteSermonCore(typeof id === "string" ? id : "", {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  revalidateSermons();
  redirect("/admin/sermons?deleted=1");
}
