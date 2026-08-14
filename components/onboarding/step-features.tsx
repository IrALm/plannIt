import { Calendar, Plus, Bell } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";

const DOT_ICON = (
  <span className="flex gap-[3px]">
    <span className="size-[6px] rounded-full bg-ev-coral" />
    <span className="size-[6px] rounded-full bg-ev-blue" />
    <span className="size-[6px] rounded-full bg-ev-green" />
  </span>
);

const FEATURES = [
  { icon: <Calendar size={20} />, title: "Vue semaine", desc: "Toute ta semaine d'un coup d'œil" },
  { icon: <Plus size={20} />, title: "Ajout express", desc: "Un tap, une heure, c'est noté" },
  { icon: DOT_ICON, title: "Couleurs perso", desc: "Une couleur par type d'activité" },
  { icon: <Bell size={20} />, title: "Rappels", desc: "30 min, 1 h ou 2 h avant" },
];

export function StepFeatures() {
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2">Regarde comme c&apos;est simple.</p>
      </div>
      <h1 className="font-serif text-[23px] mt-0.5 mb-1">Voici comment ça marche</h1>
      <div className="flex flex-col gap-[11px]">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-center gap-[13px] bg-surface border border-line rounded-card p-[13px]"
          >
            <div className="size-10 rounded-chip bg-tint text-accent flex items-center justify-center shrink-0">
              {f.icon}
            </div>
            <div>
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="text-[12.5px] text-ink-2 mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
