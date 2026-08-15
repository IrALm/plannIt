import { sendViaBrevo } from "./brevoClient.ts";
import { welcomeEmail, weeklyRecapEmail, type WeeklyRecapEvent } from "./templates.ts";

type Recipient = { email: string; name?: string };

// Seuls deux emails sont envoyés par l'app — les rappels avant événement
// passent par les push notifications (cf. send-push-reminders), pas par
// email.
export const EmailService = {
  async sendWelcomeEmail(to: Recipient, siteUrl: string) {
    const { subject, html } = welcomeEmail({ name: to.name ?? to.email.split("@")[0], siteUrl });
    return sendViaBrevo({ to, subject, html });
  },

  async sendWeeklyRecap(
    to: Recipient,
    siteUrl: string,
    params: {
      weekLabel: string;
      totalCount: number;
      distinctTypeCount: number;
      activeDayCount: number;
      highlights: WeeklyRecapEvent[];
      moreCount: number;
    }
  ) {
    const { subject, html } = weeklyRecapEmail({
      name: to.name ?? to.email.split("@")[0],
      siteUrl,
      ...params,
    });
    return sendViaBrevo({ to, subject, html });
  },
};
