import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { deleteBlogPost } from "./actions";

export const dynamic = "force-dynamic";

/** Admin blog list: every post with published/draft status and date. */
export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ScriptureEyebrow reference="Habakkuk 2:2" label="Write" />
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Blog
          </h1>
        </div>
        <Button href="/admin/blog/new" variant="gold">
          New post
        </Button>
      </header>

      {posts.length === 0 ? (
        <Card hairline className="p-10 text-center">
          <p className="font-body text-muted">No posts yet.</p>
          <Button href="/admin/blog/new" variant="navy" className="mt-4">
            Write the first post
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {posts.map((p) => (
                  <tr key={p.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3">
                      {p.publishedAt ? (
                        <Badge tone="navy">Published</Badge>
                      ) : (
                        <Badge tone="outline">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {format(p.publishedAt ?? p.createdAt, "PP")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/blog/${p.id}`}
                          className="font-body text-sm font-medium text-navy hover:text-royal focus-ring-gold rounded"
                        >
                          Edit
                        </Link>
                        <form action={deleteBlogPost}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="font-body text-sm font-medium text-red-600 hover:text-red-700 focus-ring-gold rounded"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
