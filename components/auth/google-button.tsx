import { signInWithGoogle } from "@/features/auth/actions";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button, type ButtonVariant } from "@/components/ui/button";

type GoogleButtonProps = {
  variant?: ButtonVariant;
};

export function GoogleButton({ variant = "primary" }: GoogleButtonProps) {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit" variant={variant}>
        <GoogleIcon size={18} />
        <span>Continuer avec Google</span>
      </Button>
    </form>
  );
}
