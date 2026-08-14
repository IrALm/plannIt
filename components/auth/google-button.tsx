import { signInWithGoogle } from "@/features/auth/actions";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit" variant="secondary">
        <GoogleIcon size={18} />
        <span>Continuer avec Google</span>
      </Button>
    </form>
  );
}
