"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { saveUpload } from "@/lib/upload";
import {
  createBlogPostCore,
  updateBlogPostCore,
  deleteBlogPostCore,
} from "./blog-core";

export type BlogFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Record<string, string>;
};

async function readFormData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };

  let coverImage = get("coverImage");
  const uploaded = await saveUpload(formData.get("coverFile") as File | null);
  if (uploaded) coverImage = uploaded;

  return {
    title: get("title"),
    slug: get("slug"),
    excerpt: get("excerpt"),
    body: get("body"),
    coverImage,
    publishedAt: get("publishedAt"),
  };
}

function revalidateBlog() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function createBlogPost(
  _prev: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  // authorId is stamped inside the core from the SERVER session, not here.
  const result = await createBlogPostCore(input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateBlog();
  redirect("/admin/blog?saved=1");
}

export async function updateBlogPost(
  id: string,
  _prev: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  await requireAdmin();

  const input = await readFormData(formData);
  const result = await updateBlogPostCore(id, input, { db: prisma });

  if (result.status === "forbidden") redirect("/");
  if (result.status === "error") {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidateBlog();
  redirect("/admin/blog?saved=1");
}

export async function deleteBlogPost(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const result = await deleteBlogPostCore(typeof id === "string" ? id : "", {
    db: prisma,
  });

  if (result.status === "forbidden") redirect("/");
  revalidateBlog();
  redirect("/admin/blog?deleted=1");
}
