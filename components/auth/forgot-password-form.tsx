"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, type ResetPasswordState } from "@/features/auth/actions";

const INITIAL_STATE: ResetPasswordState = { error: null, success: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, INITIAL_STATE);

  return (
    <div className="flex flex-col px-6 pt-2 pb-6 max-w-sm mx-auto w-full animate-plfade">
      <Link
        href="/login"
        className="self-start size-[38px] rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center"
      >
        <ArrowLeft size={18} />
      </Link>

      <div className="flex items-center gap-[11px] mt-[18px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2 leading-[1.35]">
          Ça arrive à tout le monde.
        </p>
      </div>

      <h1 className="font-serif text-[26px] tracking-[-.01em] mt-[18px] mb-1">
        Mot de passe oublié
      </h1>

      {state.success ? (
        <p className="text-[14px] text-ink-2 mt-6 leading-[1.55]">
          Si un compte existe avec cet email, tu vas recevoir un lien de
          réinitialisation d&apos;ici quelques minutes.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-[14px] mt-[22px]">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="toi@email.com"
            autoComplete="email"
            required
          />
          {state.error && (
            <p role="alert" className="text-[13px] text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" variant="primary" className="mt-[10px]" disabled={pending}>
            {pending ? "..." : "Envoyer le lien"}
          </Button>
        </form>
      )}
    </div>
  );
}
