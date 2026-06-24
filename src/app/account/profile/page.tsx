import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";
import { ProfileForm } from "@/components/site/profile-form";

/**
 * Profile settings: edit display name and optional avatar URL. Email is shown
 * read-only. We re-read the user from the database (not just the JWT session)
 * so the form reflects the latest persisted name/image after an update.
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [sessionUser, { updated }] = await Promise.all([
    requireUser(),
    searchParams,
  ]);

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, image: true },
  });

  const name = dbUser?.name ?? sessionUser.name ?? "";
  const email = dbUser?.email ?? sessionUser.email ?? "";
  const image = dbUser?.image ?? "";

  return (
    <div className="space-y-10">
      <header>
        <ScriptureEyebrow reference="Psalm 139:14" label="Fearfully Made" />
        <h1 className="mt-3 font-display text-3xl text-navy sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 max-w-prose font-body text-muted">
          Update how your name appears across the Covenant Embassy portal.
        </p>
      </header>

      <Card hairline className="max-w-xl p-6 sm:p-8">
        <ProfileForm
          defaultName={name}
          defaultImage={image}
          email={email}
          justUpdated={updated === "1"}
        />
      </Card>
    </div>
  );
}
