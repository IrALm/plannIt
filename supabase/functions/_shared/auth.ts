import { createClient } from "npm:@supabase/supabase-js@2";

/** Vérifie le JWT Supabase passé en Authorization: Bearer <token> et renvoie l'utilisateur, ou null. */
export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
