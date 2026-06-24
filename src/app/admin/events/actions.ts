"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { saveUpload } from "@/lib/upload";
import {
  createEventCore,
  updateEventCore,
  deleteEventCore,
} from "./event-core";

export type EventFormState = {
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
    startsAt: get("startsAt"),
    endsAt: get("endsAt"),
    location: get("location"),
    imageUrl,
    isFeatured: formData.get("isFeatured") != null,
  };
}

function revalidateEvents() {
  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await createEventCore(input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateEvents();
  redirect("/admin/events?saved=1");
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await updateEventCore(id, input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateEvents();
  redirect("/admin/events?saved=1");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const result = await deleteEventCore(typeof id === "string" ? id : "", {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  revalidateEvents();
  redirect("/admin/events?deleted=1");
}
