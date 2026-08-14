const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type SendEmailParams = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
};

/** Fine couche autour de l'API transactionnelle Brevo. BREVO_API_KEY reste
 * côté Edge Function (Deno.env), jamais exposée au frontend. */
export async function sendViaBrevo({ to, subject, html }: SendEmailParams) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": Deno.env.get("BREVO_API_KEY")!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: Deno.env.get("BREVO_SENDER_EMAIL"),
        name: Deno.env.get("BREVO_SENDER_NAME") ?? "PlannIt",
      },
      to: [to],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}
