import { Mascot } from "@/components/icons/mascot";

export function StepDone() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-[130px] rounded-full bg-tint" />
        <div className="relative animate-plfloat">
          <Mascot size={92} />
        </div>
      </div>
      <h1 className="font-serif text-[29px]">C&apos;est bon !</h1>
      <p className="text-[14.5px] leading-[1.55] text-ink-2 max-w-[230px]">
        Ton espace est prêt. Ajoute ta première activité quand tu veux.
      </p>
    </div>
  );
}
