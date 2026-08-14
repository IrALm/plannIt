import { type ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToggleChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  label: string;
  dotColor?: string;
  size?: "sm" | "md";
};

/**
 * Chip pill sélectionnable — utilisé pour les types d'activité (onboarding étape 3)
 * et les rappels (modal ajout/édition). Cf. tyData / rmData dans PlannIt.dc.html.
 */
export function ToggleChip({
  selected,
  label,
  dotColor,
  size = "md",
  className,
  ...props
}: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center rounded-pill border font-medium text-ink transition-colors duration-200 cursor-pointer",
        size === "md"
          ? "gap-2 px-[13px] py-[9px] text-[13.5px]"
          : "gap-[6px] px-[13px] py-2 text-[12.5px]",
        selected ? "border-accent bg-tint" : "border-line bg-transparent",
        className
      )}
      {...props}
    >
      {dotColor && (
        <span
          className="size-[10px] rounded-full shrink-0"
          style={{ background: dotColor }}
        />
      )}
      <span>{label}</span>
      {selected && <Check size={size === "md" ? 14 : 12} className="text-accent" />}
    </button>
  );
}
