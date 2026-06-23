/**
 * Normalize a YouTube URL into an embeddable `/embed/<id>` form.
 *
 * Accepts the common shapes — `watch?v=`, `youtu.be/<id>`, and already-embed
 * URLs — and returns null when no video id can be extracted, so callers can
 * decide whether to render an iframe at all.
 */
export function toYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${u.pathname}`;
      }
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // Unknown host — only allow if it is already an embed-style path.
    return null;
  } catch {
    return null;
  }
}
