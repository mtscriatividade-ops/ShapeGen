import { Undo2, Redo2 } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

export function Topbar() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return (
    <div className="h-12 bg-panel border-b border-black/30 flex items-center px-3 gap-2">
      <span className="text-sm font-medium text-neutral-200 mr-4">SVG Shape Studio</span>
      <button
        onClick={undo}
        className="p-1.5 rounded hover:bg-white/10 text-neutral-300"
        title="Undo"
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={redo}
        className="p-1.5 rounded hover:bg-white/10 text-neutral-300"
        title="Redo"
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
}
