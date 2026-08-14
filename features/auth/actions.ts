"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapAuthError } from "@/lib/supabase/errors";
import { getURL } from "@/lib/utils/url";

export type AuthActionState = { error: string | null };
export type ResetPasswordState = { error: string | null; success: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
  if (password.length < 6)
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  if (password !== confirmPassword)
    return { error: "Les mots de passe ne correspondent pas." };

  const supabase = await createClient();
  const origin = await getURL();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: mapAuthError(error.message) };

  redirect("/onboarding");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Renseigne ton email et ton mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: mapAuthError(error.message) };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getURL();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=google");

  redirect(data.url);
}

export async function requestPasswordReset(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide.", success: false };

  const supabase = await createClient();
  const origin = await getURL();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  // Ne jamais révéler si l'email existe ou non (énumération de comptes) —
  // seule exception : le rate-limit, pour que l'utilisateur comprenne pourquoi
  // rien ne s'est passé.
  const isRateLimit = error?.message.includes("60 seconds");
  if (error && isRateLimit) return { error: mapAuthError(error.message), success: false };

  return { error: null, success: true };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 6)
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  if (password !== confirmPassword)
    return { error: "Les mots de passe ne correspondent pas." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: mapAuthError(error.message) };

  redirect("/dashboard");
}
