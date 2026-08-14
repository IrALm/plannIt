import { Mascot } from "@/components/icons/mascot";

export function StepWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-[120px] rounded-full bg-tint" />
        <div className="relative animate-plfloat">
          <Mascot size={92} />
        </div>
      </div>
      <h1 className="font-serif text-[27px] leading-[1.1]">
        Bienvenue
        <br />
        dans PlannIt
      </h1>
      <p className="text-[14.5px] leading-[1.55] text-ink-2 max-w-[250px]">
        Je suis ton copilote planning. En deux minutes, je te montre comment
        tout ranger.
      </p>
    </div>
  );
}
