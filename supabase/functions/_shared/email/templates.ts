// Gabarits HTML portés depuis .claude/Design email/design_handoff_emails/
// (structure en tables imbriquées, styles 100% inline, polices web-safe) —
// ce sont des templates email de production, pas des maquettes à réinterpréter.
// Seuls deux emails sont envoyés par l'app : bienvenue et résumé hebdomadaire
// (les rappels avant événement passent par les push notifications, pas par
// email — cf. send-push-reminders).

const BG = "#E9E7E2";
const SURFACE = "#FBF8F1";
const SURFACE2 = "#EFE9DC";
const BORDER = "#E2DAC8";
const ACCENT = "#6E7B4E";
const INK = "#26241E";
const INK2 = "#5C574B";
const MUTED = "#948E7E";
const MUTED2 = "#B4AF9C";

function brandHeader(siteUrl: string) {
  return `
    <tr>
      <td align="center" style="padding:8px 0 22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:9px;" valign="middle">
            <img src="${siteUrl}/icons/icon-email.png" width="30" height="30" alt="PlannIt" style="display:block; border:0; border-radius:8px;">
          </td>
          <td valign="middle" style="font-family:Georgia,'Times New Roman',serif; font-size:22px; color:#22201B; letter-spacing:-.3px;">Plann<span style="color:${ACCENT};">It</span></td>
        </tr></table>
      </td>
    </tr>`;
}

function bulletproofButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td bgcolor="${ACCENT}" style="border-radius:12px;">
        <a href="${href}" target="_blank" style="display:block; padding:14px 30px; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:bold; color:${SURFACE}; text-decoration:none; border-radius:12px;">${label}</a>
      </td>
    </tr></table>`;
}

function divider() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 0 18px;"><div style="height:1px; line-height:1px; font-size:0; background-color:${BORDER};">&nbsp;</div></td></tr></table>`;
}

function footer(lines: string[]) {
  const paragraphs = lines
    .map((l) => `<p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.5; color:${MUTED};">${l}</p>`)
    .join("");
  return `
    <tr>
      <td style="padding:24px 24px 8px;" align="center">
        ${paragraphs}
        <p style="margin:10px 0 0; font-family:'Courier New',Courier,monospace; font-size:11px; color:${MUTED2};">PlannIt</p>
      </td>
    </tr>`;
}

function preheader(text: string) {
  return `<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all;">${text}</span>`;
}

function shell(title: string, preheaderText: string, bodyRows: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:${BG}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
${preheader(preheaderText)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
        ${bodyRows}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

type WelcomeEmailParams = { name: string; siteUrl: string };

export function welcomeEmail({ name, siteUrl }: WelcomeEmailParams) {
  const body = `
    ${brandHeader(siteUrl)}
    <tr>
      <td style="background-color:${SURFACE}; border:1px solid ${BORDER}; border-radius:16px; padding:40px 40px 36px;">
        <p style="margin:0 0 18px; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${ACCENT};">Bienvenue</p>
        <h1 style="margin:0 0 14px; font-family:Georgia,'Times New Roman',serif; font-weight:normal; font-size:30px; line-height:1.15; color:${INK};">Ton planning,<br>enfin clair.</h1>
        <p style="margin:0 0 26px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.6; color:${INK2};">Salut ${name},<br><br>Ton espace PlannIt est prêt. Organise ta semaine, colore tes activités par type et reçois une notification avant chaque rendez-vous. On commence&nbsp;?</p>
        ${bulletproofButton(`${siteUrl}/dashboard`, "Ajouter ma première activité")}
        ${divider()}
        <p style="margin:0 0 16px; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${MUTED};">Ce que tu peux faire</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top" width="40" style="padding:0 0 16px;"><div style="width:28px; height:28px; background-color:${SURFACE2}; border-radius:8px; text-align:center; font-family:Georgia,serif; font-size:15px; line-height:28px; color:${ACCENT};">1</div></td>
            <td valign="top" style="padding:0 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:${INK2};"><span style="color:${INK}; font-weight:bold;">Vue semaine et mois</span><br>Ton planning d'un coup d'œil, sur toute l'année.</td>
          </tr>
          <tr>
            <td valign="top" width="40" style="padding:0 0 16px;"><div style="width:28px; height:28px; background-color:${SURFACE2}; border-radius:8px; text-align:center; font-family:Georgia,serif; font-size:15px; line-height:28px; color:${ACCENT};">2</div></td>
            <td valign="top" style="padding:0 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:${INK2};"><span style="color:${INK}; font-weight:bold;">Couleurs perso</span><br>Une couleur par type&nbsp;: réunion, sport, santé…</td>
          </tr>
          <tr>
            <td valign="top" width="40"><div style="width:28px; height:28px; background-color:${SURFACE2}; border-radius:8px; text-align:center; font-family:Georgia,serif; font-size:15px; line-height:28px; color:${ACCENT};">3</div></td>
            <td valign="top" style="font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:${INK2};"><span style="color:${INK}; font-weight:bold;">Notifications</span><br>Configurables par activité. Tu ne rates plus rien.</td>
          </tr>
        </table>
      </td>
    </tr>
    ${footer([
      "Tu reçois cet email car tu as créé un compte PlannIt.",
      `<a href="${siteUrl}/settings" style="color:${ACCENT}; text-decoration:underline;">Gérer mes réglages</a>`,
    ])}`;

  return {
    subject: "Bienvenue sur PlannIt",
    html: shell("PlannIt — Bienvenue", "Bienvenue sur PlannIt — ton planning enfin clair. Ajoute ta première activité en un tap.", body),
  };
}

export type WeeklyRecapEvent = {
  title: string;
  dayLabel: string; // "JEU"
  timeLabel: string; // "08:30"
  color: string; // hex
};

type WeeklyRecapParams = {
  name: string;
  siteUrl: string;
  weekLabel: string; // "15 – 21 janv."
  totalCount: number;
  distinctTypeCount: number;
  activeDayCount: number;
  highlights: WeeklyRecapEvent[];
  moreCount: number; // événements au-delà de ceux listés dans highlights
};

function statBox(value: number, label: string) {
  return `
    <td width="33%" valign="top" style="padding:0 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${SURFACE2}; border-radius:12px;"><tr><td align="center" style="padding:16px 6px;">
        <div style="font-family:Georgia,serif; font-size:26px; color:${ACCENT};">${value}</div>
        <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:${INK2}; padding-top:2px;">${label}</div>
      </td></tr></table>
    </td>`;
}

export function weeklyRecapEmail({
  name,
  siteUrl,
  weekLabel,
  totalCount,
  distinctTypeCount,
  activeDayCount,
  highlights,
  moreCount,
}: WeeklyRecapParams) {
  const rows = highlights
    .map(
      (ev, i) => `
      <tr>
        <td width="64" valign="top" style="padding:0 0 ${i === highlights.length - 1 && !moreCount ? "0" : "16"}px;"><span style="font-family:'Courier New',Courier,monospace; font-size:12px; color:${MUTED};">${ev.dayLabel} ${ev.timeLabel}</span></td>
        <td width="14" valign="top" style="padding:2px 0 ${i === highlights.length - 1 && !moreCount ? "0" : "16"}px;"><div style="width:8px; height:8px; background-color:${ev.color}; border-radius:4px;">&nbsp;</div></td>
        <td valign="top" style="padding:0 0 ${i === highlights.length - 1 && !moreCount ? "0" : "16"}px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:${INK};">${ev.title}</td>
      </tr>`
    )
    .join("");

  const moreRow = moreCount
    ? `<tr><td colspan="3" style="font-family:Arial,Helvetica,sans-serif; font-size:13px; color:${MUTED}; padding-top:2px;">+ ${moreCount} autre${moreCount > 1 ? "s" : ""} activité${moreCount > 1 ? "s" : ""}</td></tr>`
    : "";

  const body = `
    ${brandHeader(siteUrl)}
    <tr>
      <td style="background-color:${SURFACE}; border:1px solid ${BORDER}; border-radius:16px; padding:36px 40px 32px;">
        <p style="margin:0 0 8px; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${ACCENT};">Ta semaine · ${weekLabel}</p>
        <h1 style="margin:0 0 6px; font-family:Georgia,'Times New Roman',serif; font-weight:normal; font-size:27px; line-height:1.15; color:${INK};">Bonjour ${name},</h1>
        <p style="margin:0 0 26px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.6; color:${INK2};">Voici l'essentiel de ta semaine. Tu as <span style="color:${INK}; font-weight:bold;">${totalCount} activité${totalCount > 1 ? "s" : ""}</span> prévue${totalCount > 1 ? "s" : ""}.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
          <tr>
            ${statBox(totalCount, totalCount > 1 ? "activités" : "activité")}
            ${statBox(distinctTypeCount, distinctTypeCount > 1 ? "types" : "type")}
            ${statBox(activeDayCount, activeDayCount > 1 ? "jours actifs" : "jour actif")}
          </tr>
        </table>

        ${divider()}

        <p style="margin:0 0 16px; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${MUTED};">Tes temps forts</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rows}
          ${moreRow}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-top:30px;">
          ${bulletproofButton(`${siteUrl}/dashboard?view=week`, "Ouvrir ma semaine")}
        </td></tr></table>
      </td>
    </tr>
    ${footer([
      "Résumé hebdomadaire envoyé chaque lundi, seulement si tu as des activités prévues.",
      `<a href="${siteUrl}/settings" style="color:${ACCENT}; text-decoration:underline;">Désactiver ce résumé</a>`,
    ])}`;

  return {
    subject: `Ta semaine du ${weekLabel} : ${totalCount} activité${totalCount > 1 ? "s" : ""}`,
    html: shell("PlannIt — Ta semaine", `Ta semaine du ${weekLabel} : ${totalCount} activité${totalCount > 1 ? "s" : ""} prévue${totalCount > 1 ? "s" : ""}. Voici l'essentiel.`, body),
  };
}
