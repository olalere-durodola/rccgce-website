import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/app/(auth)/auth-shell";
import { RegisterForm } from "@/app/(auth)/register/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join the RCCG Covenant Embassy community.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      reference="Genesis 17:7"
      label="Covenant"
      title="Create your account"
      subtitle="Join the Covenant Embassy family."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
