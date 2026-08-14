import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Mascot } from "@/components/icons/mascot";
import { buttonVariants } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col animate-plfade">
      <div className="flex justify-center pt-6">
        <Logo size={36} />
      </div>

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

        <p className="text-[14.5px] leading-[1.55] text-ink-2 max-w-[250px]">
          Fini le papier. Organise ta semaine, colore tes activités et ne rate
          plus rien.
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

      <div className="flex items-center justify-center gap-2 py-5 font-mono text-[10.5px] tracking-[.06em] text-muted">
        <span>100% GRATUIT</span>
        <span className="opacity-50">·</span>
        <span>SYNC GOOGLE CALENDAR</span>
      </div>
    </div>
  );
}
