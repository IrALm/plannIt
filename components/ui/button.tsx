import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "w-full h-[50px] rounded-input bg-accent text-accent-ink font-semibold text-[15.5px] hover:opacity-90",
  secondary:
    "w-full h-[50px] rounded-input border-[1.5px] border-line bg-transparent text-ink font-semibold text-[15.5px] hover:bg-surface",
  danger:
    "w-full h-12 rounded-input border border-line bg-transparent text-danger font-semibold text-[14.5px] hover:bg-surface",
  icon: "size-[38px] shrink-0 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center hover:bg-surface-2",
};

/** Classes de style d'un bouton, réutilisables sur un <Link> pour éviter d'imbriquer <button> dans <a>. */
export function buttonVariants(variant: ButtonVariant = "primary", className?: string) {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    return (
      <button ref={ref} className={buttonVariants(variant, className)} {...props} />
    );
  }
);
Button.displayName = "Button";
