import { cn } from "@/lib/utils/cn";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function Switch({ checked, onCheckedChange, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative w-[42px] h-6 rounded-pill shrink-0 cursor-pointer transition-colors duration-200",
        checked ? "bg-accent" : "bg-line",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-[left] duration-200",
          checked ? "left-[21px]" : "left-[3px]"
        )}
      />
    </button>
  );
}
