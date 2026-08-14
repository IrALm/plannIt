const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Confirme ton email avant de te connecter (vérifie ta boîte de réception).",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
  "Unable to validate email address: invalid format": "Adresse email invalide.",
  "For security purposes, you can only request this after 60 seconds.":
    "Merci de patienter une minute avant de renvoyer un email.",
};

/** Traduit les messages d'erreur Supabase Auth (anglais) en français lisible. */
export function mapAuthError(message: string): string {
  return KNOWN_MESSAGES[message] ?? "Une erreur est survenue. Réessaie dans un instant.";
}
