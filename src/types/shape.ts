export type AnchorType = "corner" | "smooth" | "symmetric" | "rounded" | "auto";

export interface Vector2 {
  x: number;
  y: number;
}

export interface AnchorPoint {
  id: string;
  position: Vector2;
  handleIn: Vector2 | null;
  handleOut: Vector2 | null;
  type: AnchorType;
  cornerRadius: number;
  cornerSmoothing: number; // 0-100
  locked: boolean;
}

export interface ShapeTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface ShapeStyle {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  lineCap: "butt" | "round" | "square";
  lineJoin: "miter" | "round" | "bevel";
}

export interface ShapePath {
  closed: boolean;
  fillRule: "nonzero" | "evenodd";
}

export interface Shape {
  id: string;
  name: string;
  type: string;
  transform: ShapeTransform;
  anchors: AnchorPoint[];
  path: ShapePath;
  style: ShapeStyle;
}

export interface Viewport {
  x: number; // pan, em coordenadas do viewBox
  y: number;
  zoom: number; // fator de escala, 1 = 100%
}
