import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { BlogForm } from "@/components/site/blog-form";

export const dynamic = "force-dynamic";

/** Create a new blog post. */
export default function NewBlogPostPage() {
  return (
    <div className="space-y-8">
      <header>
        <ScriptureEyebrow reference="Habakkuk 2:2" label="Write" />
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          New post
        </h1>
      </header>
      <BlogForm />
    </div>
  );
}
