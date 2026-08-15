import { cn } from "@/lib/utils/cn";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-2 bg-surface-2 border border-line rounded-card p-[5px]",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 h-[38px] rounded-chip text-[13px] font-semibold cursor-pointer transition-colors duration-200",
              active ? "bg-surface text-ink" : "bg-transparent text-ink-2"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
