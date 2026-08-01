import { useCallback, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { computeViewBox } from "@/core/geometry/coordinates";
import { ShapeRenderer } from "./ShapeRenderer";

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 700;
const GRID_SIZE = 20;

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const shapes = useEditorStore((s) => s.shapes);
  const selectedShapeId = useEditorStore((s) => s.selectedShapeId);
  const selectShape = useEditorStore((s) => s.selectShape);
  const viewport = useEditorStore((s) => s.viewport);
  const zoomAt = useEditorStore((s) => s.zoomAt);

  const viewBox = computeViewBox(viewport, BASE_WIDTH, BASE_HEIGHT);

  // Pan com botão do meio ou espaço+arraste (aqui: botão do meio / botão direito)
  const handleBackgroundPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.target !== event.currentTarget) return;
      selectShape(null);

      const svg = svgRef.current;
      if (!svg) return;

      const startClient = { x: event.clientX, y: event.clientY };
      const startViewport = { ...viewport };

      const handleMove = (moveEvent: PointerEvent) => {
        // Converte deslocamento de tela em deslocamento de coordenadas do viewBox.
        const scaleFactor = BASE_WIDTH / svg.clientWidth / viewport.zoom;
        const dx = (moveEvent.clientX - startClient.x) * scaleFactor;
        const dy = (moveEvent.clientY - startClient.y) * scaleFactor;
        useEditorStore.getState().setViewport({
          x: startViewport.x - dx,
          y: startViewport.y - dy,
        });
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [selectShape, viewport]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      zoomAt(factor);
    },
    [zoomAt]
  );

  // Linhas de grid simples, redesenhadas com base no viewBox visível.
  const gridLines = [];
  const startX = Math.floor(viewport.x / GRID_SIZE) * GRID_SIZE;
  const endX = viewport.x + BASE_WIDTH / viewport.zoom;
  const startY = Math.floor(viewport.y / GRID_SIZE) * GRID_SIZE;
  const endY = viewport.y + BASE_HEIGHT / viewport.zoom;

  for (let x = startX; x <= endX; x += GRID_SIZE) {
    gridLines.push(
      <line key={`v-${x}`} x1={x} y1={startY} x2={x} y2={endY} stroke="#33333a" strokeWidth={0.5} />
    );
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    gridLines.push(
      <line key={`h-${y}`} x1={startX} y1={y} x2={endX} y2={y} stroke="#33333a" strokeWidth={0.5} />
    );
  }

  return (
    <div className="flex-1 bg-canvas overflow-hidden no-select">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        width="100%"
        height="100%"
        onPointerDown={handleBackgroundPointerDown}
        onWheel={handleWheel}
      >
        <g>{gridLines}</g>
        {shapes.map((shape) => (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            svgRef={svgRef}
            isSelected={shape.id === selectedShapeId}
          />
        ))}
      </svg>
    </div>
  );
}
