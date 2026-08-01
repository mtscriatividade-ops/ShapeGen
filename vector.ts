import { useCallback } from "react";
import type { Shape } from "@/types/shape";
import { anchorsToPathData } from "@/core/path/pathBuilder";
import { screenToSvgPoint } from "@/core/geometry/coordinates";
import { useEditorStore } from "@/store/useEditorStore";
import { AnchorHandle } from "./AnchorHandle";

interface ShapeRendererProps {
  shape: Shape;
  svgRef: React.RefObject<SVGSVGElement>;
  isSelected: boolean;
}

export function ShapeRenderer({ shape, svgRef, isSelected }: ShapeRendererProps) {
  const selectShape = useEditorStore((s) => s.selectShape);
  const updateShapeTransient = useEditorStore((s) => s.updateShapeTransient);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const selectedAnchorId = useEditorStore((s) => s.selectedAnchorId);

  const d = anchorsToPathData(shape.anchors, shape.path.closed);

  const handleBodyPointerDown = useCallback(
    (event: React.PointerEvent<SVGPathElement>) => {
      event.stopPropagation();
      selectShape(shape.id);
      const svg = svgRef.current;
      if (!svg) return;

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const start = screenToSvgPoint(svg, event.clientX, event.clientY);
      const originalAnchors = shape.anchors.map((a) => ({ ...a, position: { ...a.position } }));

      const handleMove = (moveEvent: PointerEvent) => {
        const point = screenToSvgPoint(svg, moveEvent.clientX, moveEvent.clientY);
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        updateShapeTransient(shape.id, (s) => ({
          ...s,
          anchors: originalAnchors.map((a) => ({
            ...a,
            position: { x: a.position.x + dx, y: a.position.y + dy },
          })),
        }));
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        commitHistory();
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [commitHistory, selectShape, shape.anchors, shape.id, svgRef, updateShapeTransient]
  );

  return (
    <g>
      <path
        d={d}
        fill={shape.style.fill}
        fillOpacity={shape.style.fillOpacity}
        stroke={shape.style.stroke}
        strokeWidth={shape.style.strokeWidth}
        strokeOpacity={shape.style.strokeOpacity}
        strokeLinecap={shape.style.lineCap}
        strokeLinejoin={shape.style.lineJoin}
        style={{ cursor: "move" }}
        onPointerDown={handleBodyPointerDown}
      />
      {isSelected &&
        shape.anchors.map((anchor) => (
          <AnchorHandle
            key={anchor.id}
            shapeId={shape.id}
            anchor={anchor}
            svgRef={svgRef}
            isSelected={selectedAnchorId === anchor.id}
          />
        ))}
    </g>
  );
}
