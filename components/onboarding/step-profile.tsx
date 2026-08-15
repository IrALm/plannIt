import { Mascot } from "@/components/icons/mascot";
import { AVATAR_OPTIONS } from "@/features/profile/avatars";

type StepProfileProps = {
  fullName: string;
  onFullNameChange: (value: string) => void;
  avatarId: string;
  onAvatarChange: (id: string) => void;
  error?: string | null;
};

export function StepProfile({
  fullName,
  onFullNameChange,
  avatarId,
  onAvatarChange,
  error,
}: StepProfileProps) {
  return (
    <div className="flex flex-col gap-[16px] flex-1">
      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2">Avant tout, faisons connaissance.</p>
      </div>
      <h1 className="font-serif text-[23px] leading-[1.12]">
        Comment veux-tu qu&apos;on t&apos;appelle ?
      </h1>

      <label className="flex flex-col gap-[7px]">
        <span className="font-mono text-[10px] tracking-[.12em] uppercase text-muted">
          Ton nom
        </span>
        <input
          autoFocus
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          placeholder="Ton prénom, un surnom, ce que tu veux…"
          className="h-[50px] rounded-input border border-line bg-surface px-[15px] text-[15px] focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex-1 min-h-0 flex flex-col">
        <span className="font-mono text-[10px] tracking-[.12em] uppercase text-muted">
          Choisis ton avatar
        </span>
        <div className="grid grid-cols-4 gap-[12px] mt-[10px] max-h-[220px] overflow-y-auto pr-1">
          {AVATAR_OPTIONS.map((avatar) => {
            const selected = avatar.id === avatarId;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onAvatarChange(avatar.id)}
                aria-label={avatar.label}
                aria-pressed={selected}
                className="rounded-full overflow-hidden aspect-square cursor-pointer"
                style={{
                  boxShadow: selected
                    ? "0 0 0 2px var(--bg), 0 0 0 4px var(--accent)"
                    : "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG local simple, pas besoin de l'optimiseur next/image */}
                <img src={avatar.src} alt={avatar.label} className="w-full h-full" />
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
