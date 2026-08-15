import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type LegalPageProps = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2 text-ink-2 text-[13.5px]">
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-serif text-[16px]">
                Plann<span className="text-accent">It</span>
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <h1 className="font-serif text-[28px] leading-[1.15] mb-1">{title}</h1>
        <p className="font-mono text-[11px] uppercase tracking-[.1em] text-muted mb-9">
          Dernière mise à jour : {updatedAt}
        </p>

        <div className="flex flex-col gap-7 text-[14.5px] leading-[1.65] text-ink-2 pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-sans text-[15.5px] font-semibold text-ink mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
