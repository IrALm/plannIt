import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe — PlannIt" };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
