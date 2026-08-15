"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mascot } from "@/components/icons/mascot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updatePassword, type AuthActionState } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const INITIAL_STATE: AuthActionState = { error: null };

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(updatePassword, INITIAL_STATE);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError("Ce lien n'est plus valide, redemande une réinitialisation.");
      }
      setReady(true);
    });
  }, [searchParams]);

  return (
    <div className="flex flex-col px-6 pt-8 pb-6 max-w-sm mx-auto w-full animate-plfade">
      <div className="flex justify-end mb-2">
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2 leading-[1.35]">
          Choisis un nouveau mot de passe.
        </p>
      </div>
      <h1 className="font-serif text-[26px] tracking-[-.01em] mt-[18px] mb-1">
        Nouveau mot de passe
      </h1>

      {!ready ? null : exchangeError ? (
        <p role="alert" className="text-[13px] text-danger mt-4">
          {exchangeError}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-[14px] mt-[22px]">
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirme le mot de passe"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          {state.error && (
            <p role="alert" className="text-[13px] text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" variant="primary" className="mt-[10px]" disabled={pending}>
            {pending ? "..." : "Mettre à jour"}
          </Button>
        </form>
      )}
    </div>
  );
}
