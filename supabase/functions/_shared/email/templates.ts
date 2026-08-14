const ACCENT = "#6E7B4E";
const BG = "#EFE9DC";
const SURFACE = "#FBF8F1";
const INK = "#26241E";
const INK2 = "#5C574B";

function wrap(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:32px 16px;background:${BG};font-family:'DM Sans',Arial,sans-serif;color:${INK};">
  <div style="max-width:420px;margin:0 auto;background:${SURFACE};border-radius:14px;padding:28px 24px;">
    <div style="font-family:Georgia,serif;font-size:15px;color:${ACCENT};font-weight:bold;margin-bottom:18px;">
      Plann<span style="color:${INK};">It</span>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px;color:${INK};">${title}</h1>
    ${bodyHtml}
    <p style="font-size:12px;color:${INK2};margin-top:28px;">— L'équipe PlannIt</p>
  </div>
</body>
</html>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: "Bienvenue sur PlannIt 🌱",
    html: wrap(
      `Bienvenue, ${name} !`,
      `<p style="font-size:14.5px;line-height:1.6;color:${INK2};">
        Ton compte PlannIt est prêt. Organise ta semaine, colore tes activités
        par type, et connecte Google Calendar quand tu veux pour ne plus rien
        rater.
      </p>`
    ),
  };
}

export function eventCreatedEmail(title: string, whenLabel: string) {
  return {
    subject: `Activité ajoutée : ${title}`,
    html: wrap(
      "Nouvelle activité",
      `<p style="font-size:14.5px;line-height:1.6;color:${INK2};">
        <strong style="color:${INK};">${title}</strong> a bien été ajoutée
        à ton planning — ${whenLabel}.
      </p>`
    ),
  };
}

export function eventReminderEmail(title: string, whenLabel: string, minutesBefore: number) {
  return {
    subject: `Rappel : ${title} bientôt`,
    html: wrap(
      "Ça arrive bientôt !",
      `<p style="font-size:14.5px;line-height:1.6;color:${INK2};">
        <strong style="color:${INK};">${title}</strong> commence dans
        ${minutesBefore} minutes (${whenLabel}).
      </p>`
    ),
  };
}

export function notificationEmail(subject: string, message: string) {
  return {
    subject,
    html: wrap(
      subject,
      `<p style="font-size:14.5px;line-height:1.6;color:${INK2};">${message}</p>`
    ),
  };
}
