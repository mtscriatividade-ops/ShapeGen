import { useCallback } from "react";
import type { AnchorPoint, Vector2 } from "@/types/shape";
import { screenToSvgPoint } from "@/core/geometry/coordinates";
import { useEditorStore } from "@/store/useEditorStore";

interface AnchorHandleProps {
  shapeId: string;
  anchor: AnchorPoint;
  svgRef: React.RefObject<SVGSVGElement>;
  isSelected: boolean;
}

function HandleDot({
  position,
  onPointerDown,
}: {
  position: Vector2;
  onPointerDown: (e: React.PointerEvent<SVGRectElement>) => void;
}) {
  const size = 6;
  return (
    <rect
      x={position.x - size / 2}
      y={position.y - size / 2}
      width={size}
      height={size}
      className="fill-amber-300 stroke-amber-500"
      strokeWidth={1}
      style={{ cursor: "grab" }}
      onPointerDown={onPointerDown}
    />
  );
}

export function AnchorHandle({ shapeId, anchor, svgRef, isSelected }: AnchorHandleProps) {
  const moveAnchorTransient = useEditorStore((s) => s.moveAnchorTransient);
  const moveHandleTransient = useEditorStore((s) => s.moveHandleTransient);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const selectAnchor = useEditorStore((s) => s.selectAnchor);

  const dragFrom = useCallback(
    (
      onMove: (point: Vector2) => void,
      onCommit: () => void
    ) => (event: React.PointerEvent<SVGElement>) => {
      event.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        onMove(screenToSvgPoint(svg, moveEvent.clientX, moveEvent.clientY));
      };
      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        onCommit();
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [svgRef]
  );

  const handleAnchorPointerDown = useCallback(
    (event: React.PointerEvent<SVGCircleElement>) => {
      selectAnchor(anchor.id);
      dragFrom(
        (point) => moveAnchorTransient(shapeId, anchor.id, point.x, point.y),
        commitHistory
      )(event);
    },
    [anchor.id, commitHistory, dragFrom, moveAnchorTransient, selectAnchor, shapeId]
  );

  const handleInPointerDown = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      dragFrom(
        (point) => moveHandleTransient(shapeId, anchor.id, "in", point.x, point.y),
        commitHistory
      )(event);
    },
    [anchor.id, commitHistory, dragFrom, moveHandleTransient, shapeId]
  );

  const handleOutPointerDown = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      dragFrom(
        (point) => moveHandleTransient(shapeId, anchor.id, "out", point.x, point.y),
        commitHistory
      )(event);
    },
    [anchor.id, commitHistory, dragFrom, moveHandleTransient, shapeId]
  );

  return (
    <g>
      {isSelected && anchor.handleIn && (
        <>
          <line
            x1={anchor.position.x}
            y1={anchor.position.y}
            x2={anchor.handleIn.x}
            y2={anchor.handleIn.y}
            stroke="#f59e0b"
            strokeWidth={1}
          />
          <HandleDot position={anchor.handleIn} onPointerDown={handleInPointerDown} />
        </>
      )}
      {isSelected && anchor.handleOut && (
        <>
          <line
            x1={anchor.position.x}
            y1={anchor.position.y}
            x2={anchor.handleOut.x}
            y2={anchor.handleOut.y}
            stroke="#f59e0b"
            strokeWidth={1}
          />
          <HandleDot position={anchor.handleOut} onPointerDown={handleOutPointerDown} />
        </>
      )}
      <circle
        cx={anchor.position.x}
        cy={anchor.position.y}
        r={5}
        className={isSelected ? "fill-accent stroke-white" : "fill-white stroke-accent"}
        strokeWidth={1.5}
        style={{ cursor: "grab" }}
        onPointerDown={handleAnchorPointerDown}
      />
    </g>
  );
}
