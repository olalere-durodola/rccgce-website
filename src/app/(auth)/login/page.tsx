import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/app/(auth)/auth-shell";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { isGoogleEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your RCCG Covenant Embassy account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
}) {
  const { registered, callbackUrl } = await searchParams;

  return (
    <AuthShell
      reference="Psalm 24:7"
      label="Enter"
      title="Welcome back"
      subtitle="Sign in to your account."
      footer={
        <>
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-gold hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm
        googleEnabled={isGoogleEnabled}
        registered={registered === "1"}
        callbackUrl={callbackUrl}
      />
    </AuthShell>
  );
}
