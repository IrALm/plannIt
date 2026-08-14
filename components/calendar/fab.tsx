import { Plus } from "lucide-react";

type FabProps = { onClick: () => void };

export function Fab({ onClick }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-[18px] bottom-[18px] h-[50px] rounded-pill px-[19px] border-none bg-accent text-accent-ink flex items-center gap-2 cursor-pointer shadow-fab font-semibold text-[14.5px]"
    >
      <Plus size={18} />
      <span>Ajouter</span>
    </button>
  );
}
