"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/google-button";
import { signIn, signUp, type AuthActionState } from "@/features/auth/actions";

type AuthFormProps = {
  mode: "signup" | "login";
};

const INITIAL_STATE: AuthActionState = { error: null };

/**
 * Écran Auth — un seul design, deux modes (cf. bloc "AUTH" dans PlannIt.dc.html).
 * En prod, signup/login sont deux routes distinctes (/register, /login) plutôt que
 * deux états internes, pour garder des URLs partageables — le composant visuel
 * reste unique.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const action = isSignup ? signUp : signIn;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <div className="flex flex-col px-6 pt-2 pb-6 max-w-sm mx-auto w-full animate-plfade">
      <Link
        href="/"
        className="self-start size-[38px] rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center"
      >
        <ArrowLeft size={18} />
      </Link>

      <div className="flex items-center gap-[11px] mt-[18px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2 leading-[1.35]">
          {isSignup ? "En 10 secondes, promis." : "Ton planning t'attend."}
        </p>
      </div>

      <h1 className="font-serif text-[26px] tracking-[-.01em] mt-[18px] mb-1">
        {isSignup ? "Crée ton compte" : "Content de te revoir"}
      </h1>

      <form action={formAction} className="flex flex-col gap-[14px] mt-[22px]">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="toi@email.com"
          autoComplete="email"
          required
        />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
        />
        {isSignup && (
          <Input
            label="Confirme le mot de passe"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        )}

        {!isSignup && (
          <Link
            href="/forgot-password"
            className="self-end text-[12.5px] text-ink-2 hover:text-accent"
          >
            Mot de passe oublié ?
          </Link>
        )}

        {state.error && (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" className="mt-[10px]" disabled={pending}>
          {pending ? "..." : isSignup ? "Créer mon compte" : "Se connecter"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted">ou</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <GoogleButton />

      <div className="text-center mt-4 text-[13.5px] text-ink-2">
        {isSignup ? "Déjà inscrit ?" : "Pas encore de compte ?"}{" "}
        <Link
          href={isSignup ? "/login" : "/register"}
          className="text-accent font-semibold"
        >
          {isSignup ? "Se connecter" : "Créer un compte"}
        </Link>
      </div>
    </div>
  );
}
