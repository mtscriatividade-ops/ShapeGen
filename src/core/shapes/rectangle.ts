import type { AnchorPoint, Shape } from "@/types/shape";

let anchorCounter = 0;
function nextAnchorId(): string {
  anchorCounter += 1;
  return `anchor-${anchorCounter}`;
}

let shapeCounter = 0;
function nextShapeId(): string {
  shapeCounter += 1;
  return `shape-${shapeCounter}`;
}

function makeAnchor(x: number, y: number): AnchorPoint {
  return {
    id: nextAnchorId(),
    position: { x, y },
    handleIn: null,
    handleOut: null,
    type: "corner",
    cornerRadius: 0,
    cornerSmoothing: 0,
    locked: false,
  };
}

/**
 * Cria um retângulo paramétrico como Shape editável: quatro anchors nos
 * cantos, sem handles (segmentos retos), prontos para receber
 * arredondamento (via cornerRadius/type "rounded") ou conversão livre.
 */
export function createRectangle(x: number, y: number, width: number, height: number): Shape {
  const anchors: AnchorPoint[] = [
    makeAnchor(x, y),
    makeAnchor(x + width, y),
    makeAnchor(x + width, y + height),
    makeAnchor(x, y + height),
  ];

  return {
    id: nextShapeId(),
    name: "Rectangle",
    type: "rectangle",
    transform: {
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    anchors,
    path: {
      closed: true,
      fillRule: "nonzero",
    },
    style: {
      fill: "#5b8def",
      fillOpacity: 1,
      stroke: "#1e293b",
      strokeWidth: 1,
      strokeOpacity: 1,
      lineCap: "round",
      lineJoin: "round",
    },
  };
}
