import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <label htmlFor={inputId} className="flex flex-col gap-[7px]">
        <span className="font-mono text-[10px] tracking-[.12em] uppercase text-muted">
          {label}
        </span>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-[50px] rounded-input border border-line bg-surface text-ink px-[15px] text-[15px]",
            "focus:border-accent focus:outline-none",
            className
          )}
          {...props}
        />
      </label>
    );
  }
);
Input.displayName = "Input";
