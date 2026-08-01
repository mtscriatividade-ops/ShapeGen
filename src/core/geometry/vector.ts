import type { Vector2 } from "@/types/shape";

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vector2, factor: number): Vector2 {
  return { x: a.x * factor, y: a.y * factor };
}

export function length(a: Vector2): number {
  return Math.hypot(a.x, a.y);
}

export function normalize(a: Vector2): Vector2 {
  const len = length(a);
  if (len === 0) return { x: 0, y: 0 };
  return { x: a.x / len, y: a.y / len };
}

/** Distância entre dois pontos. */
export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Interpola linearmente entre dois pontos (t entre 0 e 1). */
export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
