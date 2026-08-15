import { createClient } from "@/lib/supabase/server";

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

async function callSendEmail(body: unknown) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await fetch(`${FUNCTIONS_URL}/send-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/** Best-effort : un échec d'envoi ne doit jamais casser le flux appelant. */
export async function sendWelcomeEmail(email: string, name?: string) {
  try {
    await callSendEmail({ type: "welcome", payload: { email, name } });
  } catch {
    // silencieux
  }
}
