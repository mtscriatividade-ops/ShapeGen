import { Square, Circle, Triangle, Star } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { createRectangle } from "@/core/shapes/rectangle";

const LIBRARY_ITEMS = [
  { id: "rectangle", label: "Rectangle", icon: Square, enabled: true },
  { id: "circle", label: "Circle", icon: Circle, enabled: false },
  { id: "triangle", label: "Triangle", icon: Triangle, enabled: false },
  { id: "star", label: "Star", icon: Star, enabled: false },
];

export function LeftPanel() {
  const addShape = useEditorStore((s) => s.addShape);

  const handleAddRectangle = () => {
    const shape = createRectangle(400, 250, 200, 140);
    addShape(shape);
  };

  return (
    <div className="w-56 bg-panel border-r border-black/30 p-3 flex flex-col gap-2">
      <h2 className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Shapes</h2>
      {LIBRARY_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            disabled={!item.enabled}
            onClick={item.id === "rectangle" ? handleAddRectangle : undefined}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
              item.enabled
                ? "hover:bg-white/10 text-neutral-100"
                : "text-neutral-600 cursor-not-allowed"
            }`}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
