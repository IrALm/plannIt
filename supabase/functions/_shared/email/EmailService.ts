import { sendViaBrevo } from "./brevoClient.ts";
import {
  welcomeEmail,
  eventCreatedEmail,
  eventReminderEmail,
  notificationEmail,
} from "./templates.ts";

type Recipient = { email: string; name?: string };

export const EmailService = {
  async sendWelcomeEmail(to: Recipient) {
    const { subject, html } = welcomeEmail(to.name ?? to.email.split("@")[0]);
    return sendViaBrevo({ to, subject, html });
  },

  async sendEventCreatedEmail(to: Recipient, title: string, whenLabel: string) {
    const { subject, html } = eventCreatedEmail(title, whenLabel);
    return sendViaBrevo({ to, subject, html });
  },

  async sendEventReminder(
    to: Recipient,
    title: string,
    whenLabel: string,
    minutesBefore: number
  ) {
    const { subject, html } = eventReminderEmail(title, whenLabel, minutesBefore);
    return sendViaBrevo({ to, subject, html });
  },

  async sendNotificationEmail(to: Recipient, subjectLine: string, message: string) {
    const { subject, html } = notificationEmail(subjectLine, message);
    return sendViaBrevo({ to, subject, html });
  },
};
