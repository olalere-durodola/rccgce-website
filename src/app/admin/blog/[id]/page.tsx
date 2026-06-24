import { notFound } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { BlogForm } from "@/components/site/blog-form";

export const dynamic = "force-dynamic";

/** Format a date for a <input type="datetime-local"> default value. */
const dtLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

/** Edit an existing blog post. */
export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Habakkuk 2:2" label="Write" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Edit post
        </h1>
      </header>
      <BlogForm
        defaults={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          body: post.body,
          coverImage: post.coverImage ?? "",
          publishedAt: post.publishedAt ? dtLocal(post.publishedAt) : "",
        }}
      />
    </div>
  );
}
