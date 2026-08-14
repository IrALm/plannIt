import Link from "next/link";
import { Calendar, Palette, Bell, RefreshCw } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { Mascot } from "@/components/icons/mascot";
import { buttonVariants } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Calendar,
    title: "Vue semaine",
    desc: "Toute ta semaine organisée en un coup d'œil, jour par jour.",
  },
  {
    icon: Palette,
    title: "Types d'activité personnalisés",
    desc: "Réunion, sport, santé, études… chaque type a sa propre couleur.",
  },
  {
    icon: Bell,
    title: "Rappels",
    desc: "30 minutes, 1 heure ou 2 heures avant chaque événement.",
  },
  {
    icon: RefreshCw,
    title: "Synchronisation Google Calendar",
    desc: "Connecte ton compte Google et retrouve tes événements PlannIt directement dans ton agenda Google, sur tous tes appareils.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col animate-plfade">
      {/* Header : le nom "PlannIt" doit être lisible en clair, dès le
          chargement, sans avoir à faire défiler — condition explicite de la
          revue Google OAuth (cohérence avec le nom d'app configuré côté
          écran de consentement). L'icône seule ne suffisait pas. */}
      <header className="flex items-center justify-center gap-[9px] pt-6 pb-2">
        <Logo size={30} />
        <span className="font-serif text-[19px] tracking-[-.01em]">
          Plann<span className="text-accent">It</span>
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-[13px] max-w-sm mx-auto">
        <div className="relative flex items-center justify-center mb-0.5">
          <div className="absolute size-[120px] rounded-full bg-tint" />
          <div className="relative animate-plfloat">
            <Mascot size={92} />
          </div>
        </div>

        <div className="inline-flex items-center gap-[7px] bg-surface border border-line rounded-pill px-[13px] py-[6px] text-[12.5px] text-ink-2">
          <span className="text-sm">👋</span>
          Salut toi
        </div>

        <h1 className="font-serif text-[31px] leading-[1.08] tracking-[-.01em]">
          Ton planning,
          <br />
          enfin clair.
        </h1>

        {/* Description factuelle et sans ambiguïté de l'objectif de
            l'application — en plus de l'accroche ci-dessus, condition
            explicite de la revue Google OAuth. */}
        <p className="text-[14.5px] leading-[1.55] text-ink-2 max-w-[280px]">
          <strong className="text-ink">PlannIt</strong> est une application
          gratuite de gestion de planning personnel : crée tes événements,
          organise-les par catégories colorées, reçois des rappels, et
          synchronise-les automatiquement avec Google Calendar.
        </p>

        <div className="w-full flex flex-col gap-[11px] mt-2">
          <Link href="/register" className={buttonVariants("primary")}>
            Créer un compte
          </Link>
          <Link href="/login" className={buttonVariants("secondary")}>
            Se connecter
          </Link>
        </div>
      </div>

      {/* Qu'est-ce que PlannIt : détail des fonctionnalités pour les
          visiteurs (et la revue Google OAuth) — reprend et développe la
          description factuelle du hero ci-dessus. */}
      <section className="px-6 py-10 max-w-lg mx-auto w-full">
        <h2 className="font-serif text-[22px] mb-3 text-center">
          Qu&apos;est-ce que Plann<span className="text-accent">It</span> ?
        </h2>
        <p className="text-[14px] leading-[1.65] text-ink-2 text-center max-w-md mx-auto">
          PlannIt est une application web gratuite de gestion de planning
          personnel. Elle permet de créer et organiser ses événements par
          types d&apos;activité colorés, de recevoir des rappels, et de
          synchroniser automatiquement son emploi du temps avec Google
          Calendar — pour garder une vue claire de sa semaine, sur ordinateur
          comme sur téléphone (PlannIt s&apos;installe comme une application
          mobile).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 bg-surface border border-line rounded-card p-4"
            >
              <div className="size-9 rounded-chip bg-tint text-accent flex items-center justify-center shrink-0">
                <f.icon size={18} />
              </div>
              <div>
                <div className="text-[14px] font-semibold">{f.title}</div>
                <div className="text-[12.5px] text-ink-2 mt-1 leading-[1.5]">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-center gap-3 py-6 border-t border-line">
        <div className="flex items-center justify-center gap-2 font-mono text-[10.5px] tracking-[.06em] text-muted">
          <span>100% GRATUIT</span>
          <span className="opacity-50">·</span>
          <span>SYNC GOOGLE CALENDAR</span>
        </div>
        <nav className="flex items-center gap-4 text-[12px] text-ink-2">
          <Link href="/privacy" className="hover:text-ink underline underline-offset-2">
            Politique de confidentialité
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/terms" className="hover:text-ink underline underline-offset-2">
            Conditions d&apos;utilisation
          </Link>
        </nav>
      </div>
    </div>
  );
}
