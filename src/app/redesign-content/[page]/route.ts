import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {auth} from "@/lib/auth";
import {canReviewRedesign} from "@/lib/redesign-access";
import routes from "../../../../redesign/routes.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privacyHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Vary": "Cookie",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: Request, context: {params: Promise<{page: string}>}) {
  const {page} = await context.params;
  // Resolve only known build outputs. Request paths never become file paths.
  const entry = Object.prototype.hasOwnProperty.call(routes, page)
    ? routes[page as keyof typeof routes] : undefined;
  if (!entry) return new Response("Not found", {status: 404, headers: privacyHeaders});

  try {
    const session = await auth();
    if (!canReviewRedesign(session?.user, process.env.REDESIGN_REVIEWER_USER_IDS)) {
      if (!session?.user) {
        const login = new URL("/login", request.url);
        login.searchParams.set("callbackUrl", entry.path + new URL(request.url).search);
        return new Response(null, {status: 307, headers: {...privacyHeaders, Location: login.href}});
      }
      return new Response("This preview is private. Your account needs review access.", {status: 403, headers: privacyHeaders});
    }
    const body = await readFile(join(process.cwd(), "redesign", "dist", entry.file), "utf8");
    return new Response(body, {headers: {...privacyHeaders, "Content-Type": "text/html; charset=utf-8"}});
  } catch {
    return new Response("The preview is temporarily unavailable.", {status: 503, headers: privacyHeaders});
  }
}
