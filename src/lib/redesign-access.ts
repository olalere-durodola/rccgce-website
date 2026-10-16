type PreviewUser = {id?: string; role?: string} | null | undefined;

/** IDs are server-configured existing accounts; unverified email is not access. */
export function canReviewRedesign(user: PreviewUser, reviewerIds: string | undefined) {
  if (typeof user?.id !== "string" || !user.id.trim()) return false;
  if (user.role === "ADMIN") return true;
  return new Set((reviewerIds ?? "").split(",").map(id => id.trim()).filter(Boolean)).has(user.id);
}
