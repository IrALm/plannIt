import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, DM_Sans, DM_Mono } from "next/font/google";
import { InstallPromptListener } from "@/components/pwa/install-prompt-listener";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SITE_URL = "https://plann-it-cyan.vercel.app";
const DESCRIPTION =
  "PlannIt est une application gratuite de gestion de planning personnel : organise ta semaine, colore tes activités par type, reçois des rappels et synchronise ton emploi du temps avec Google Calendar.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PlannIt — Ton planning, enfin clair.",
    template: "%s — PlannIt",
  },
  description: DESCRIPTION,
  applicationName: "PlannIt",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "PlannIt",
    title: "PlannIt — Ton planning, enfin clair.",
    description: DESCRIPTION,
    locale: "fr_FR",
    // image générée automatiquement depuis app/opengraph-image.tsx (convention Next.js)
  },
  twitter: {
    card: "summary_large_image",
    title: "PlannIt — Ton planning, enfin clair.",
    description: DESCRIPTION,
  },
  // Vérification de propriété du domaine dans Google Search Console (requise
  // pour la validation OAuth) — Next.js injecte automatiquement la balise
  // <meta name="google-site-verification" ...> correspondante dans le <head>.
  verification: {
    google: "brIOVL2GJd6nCrIYF_YyWiCXpkaEpJbOZWXDO8btfII",
  },
};

export const viewport: Viewport = {
  themeColor: "#6e7b4e",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('plannit-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

// Capté avant l'hydratation React (le script tourne dès le parsing du HTML) :
// beforeinstallprompt peut se déclencher très tôt, avant que le useEffect de
// InstallPromptListener n'ait le temps de s'attacher — sans ce script, on
// perd l'événement silencieusement et le bouton d'install n'apparaît jamais.
const INSTALL_PROMPT_CAPTURE_SCRIPT = `
(function () {
  window.__pwaInstallPrompt = null;
  window.__pwaInstalled = false;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__pwaInstallPrompt = e;
    window.dispatchEvent(new Event('pwa-install-prompt-ready'));
  });
  window.addEventListener('appinstalled', function () {
    window.__pwaInstalled = true;
    window.__pwaInstallPrompt = null;
    window.dispatchEvent(new Event('pwa-installed'));
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE_SCRIPT }} />
      </head>
      <body
        className={`${dmSerifDisplay.variable} ${dmSans.variable} ${dmMono.variable} font-sans antialiased`}
      >
        <InstallPromptListener />
        {children}
      </body>
    </html>
  );
}
