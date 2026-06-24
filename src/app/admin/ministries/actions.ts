"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { saveUpload } from "@/lib/upload";
import {
  createMinistryCore,
  updateMinistryCore,
  deleteMinistryCore,
} from "./ministry-core";

export type MinistryFormState = {
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
    name: get("name"),
    slug: get("slug"),
    summary: get("summary"),
    description: get("description"),
    leader: get("leader"),
    meetingTime: get("meetingTime"),
    imageUrl,
  };
}

function revalidateMinistries() {
  revalidatePath("/admin/ministries");
  revalidatePath("/ministries");
}

export async function createMinistry(
  _prev: MinistryFormState,
  formData: FormData,
): Promise<MinistryFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await createMinistryCore(input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateMinistries();
  redirect("/admin/ministries?saved=1");
}

export async function updateMinistry(
  id: string,
  _prev: MinistryFormState,
  formData: FormData,
): Promise<MinistryFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await updateMinistryCore(id, input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateMinistries();
  redirect("/admin/ministries?saved=1");
}

export async function deleteMinistry(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const result = await deleteMinistryCore(typeof id === "string" ? id : "", {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  revalidateMinistries();
  redirect("/admin/ministries?deleted=1");
}
