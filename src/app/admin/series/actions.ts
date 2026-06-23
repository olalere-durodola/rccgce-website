"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { saveUpload } from "@/lib/upload";
import {
  createSeriesCore,
  updateSeriesCore,
  deleteSeriesCore,
} from "./series-core";

export type SeriesFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Record<string, string>;
};

async function readFormData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };

  let imageUrl = get("imageUrl");
  const uploaded = await saveUpload(formData.get("imageFile") as File | null);
  if (uploaded) imageUrl = uploaded;

  return {
    title: get("title"),
    slug: get("slug"),
    description: get("description"),
    imageUrl,
  };
}

function revalidateSeries() {
  revalidatePath("/admin/series");
  // Series feed into sermon listings/filters on the public site.
  revalidatePath("/sermons");
}

export async function createSeries(
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  await requireAdmin();

  const result = await createSeriesCore(await readFormData(formData), {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateSeries();
  redirect("/admin/series?saved=1");
}

export async function updateSeries(
  id: string,
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  await requireAdmin();

  const result = await updateSeriesCore(id, await readFormData(formData), {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateSeries();
  redirect("/admin/series?saved=1");
}

export async function deleteSeries(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const result = await deleteSeriesCore(typeof id === "string" ? id : "", {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  revalidateSeries();
  redirect("/admin/series?deleted=1");
}
