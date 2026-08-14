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

export const metadata: Metadata = {
  title: "PlannIt — Ton planning, enfin clair.",
  description:
    "PlannIt aide à organiser sa semaine : activités colorées par type, rappels, sync Google Calendar.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
