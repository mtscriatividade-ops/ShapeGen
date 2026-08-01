import type { AnchorPoint, Vector2 } from "@/types/shape";
import { distance, lerp } from "@/core/geometry/vector";

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Gera os dois pontos de controle Bézier que aproximam um canto arredondado
 * "contínuo" (estilo iOS / squircle), em vez de um arco circular simples.
 *
 * A ideia: em vez de cortar o canto com um arco de raio fixo, deslocamos
 * os handles ao longo das arestas adjacentes por uma distância maior que
 * o raio nominal (fator de overshoot), o que produz uma transição mais
 * suave entre a reta e a curva — a mesma sensação visual de um squircle.
 * O parâmetro `smoothing` (0-100) controla esse fator de overshoot.
 */
function roundedCornerControlPoints(
  prev: Vector2,
  corner: Vector2,
  next: Vector2,
  radius: number,
  smoothing: number
): { entry: Vector2; cp1: Vector2; cp2: Vector2; exit: Vector2 } {
  const distToPrev = distance(corner, prev);
  const distToNext = distance(corner, next);

  // Nunca deixa o raio efetivo invadir o segmento vizinho.
  const maxRadius = Math.min(distToPrev, distToNext) / 2;
  const effectiveRadius = Math.max(0, Math.min(radius, maxRadius));

  // smoothing 0 -> overshoot 1 (arco convencional)
  // smoothing 100 -> overshoot ~1.9 (transição bem suave, tipo squircle)
  const overshoot = 1 + (smoothing / 100) * 0.9;

  const tEntry = Math.min(1, (effectiveRadius * overshoot) / (distToPrev || 1));
  const tExit = Math.min(1, (effectiveRadius * overshoot) / (distToNext || 1));

  const entry = lerp(corner, prev, tEntry);
  const exit = lerp(corner, next, tExit);

  // Pontos de controle puxados um pouco mais perto do canto original
  // que o overshoot, para manter a curva tangente às arestas.
  const tControl = 1 - smoothing / 200; // entre 0.5 e 1
  const cp1 = lerp(entry, corner, tControl);
  const cp2 = lerp(exit, corner, tControl);

  return { entry, cp1, cp2, exit };
}

/**
 * Converte a lista de anchors em uma string de path SVG (atributo `d`).
 * Anchors com handles definidos geram curvas cúbicas (C); caso contrário,
 * geram segmentos retos (L). Anchors do tipo "rounded" com cornerRadius > 0
 * substituem o vértice por uma curva suavizada.
 */
export function anchorsToPathData(anchors: AnchorPoint[], closed: boolean): string {
  if (anchors.length === 0) return "";

  const count = anchors.length;
  const segments: string[] = [];

  const getPoint = (index: number): Vector2 =>
    anchors[((index % count) + count) % count].position;

  const commands: string[] = [];
  let startPoint: Vector2 | null = null;

  for (let i = 0; i < count; i++) {
    const anchor = anchors[i];

    if (anchor.type === "rounded" && anchor.cornerRadius > 0 && (closed || (i > 0 && i < count - 1))) {
      const prev = getPoint(i - 1);
      const next = getPoint(i + 1);
      const { entry, cp1, cp2, exit } = roundedCornerControlPoints(
        prev,
        anchor.position,
        next,
        anchor.cornerRadius,
        anchor.cornerSmoothing
      );

      if (startPoint === null) {
        startPoint = entry;
        commands.push(`M ${fmt(entry.x)} ${fmt(entry.y)}`);
      } else {
        commands.push(`L ${fmt(entry.x)} ${fmt(entry.y)}`);
      }
      commands.push(
        `C ${fmt(cp1.x)} ${fmt(cp1.y)} ${fmt(cp2.x)} ${fmt(cp2.y)} ${fmt(exit.x)} ${fmt(exit.y)}`
      );
      continue;
    }

    if (startPoint === null) {
      startPoint = anchor.position;
      commands.push(`M ${fmt(anchor.position.x)} ${fmt(anchor.position.y)}`);
      continue;
    }

    const prevAnchor = anchors[i - 1];
    if (prevAnchor.handleOut || anchor.handleIn) {
      const cp1 = prevAnchor.handleOut ?? prevAnchor.position;
      const cp2 = anchor.handleIn ?? anchor.position;
      commands.push(
        `C ${fmt(cp1.x)} ${fmt(cp1.y)} ${fmt(cp2.x)} ${fmt(cp2.y)} ${fmt(anchor.position.x)} ${fmt(
          anchor.position.y
        )}`
      );
    } else {
      commands.push(`L ${fmt(anchor.position.x)} ${fmt(anchor.position.y)}`);
    }
  }

  if (closed) {
    const lastAnchor = anchors[count - 1];
    const firstAnchor = anchors[0];
    if (lastAnchor.handleOut || firstAnchor.handleIn) {
      const cp1 = lastAnchor.handleOut ?? lastAnchor.position;
      const cp2 = firstAnchor.handleIn ?? firstAnchor.position;
      commands.push(
        `C ${fmt(cp1.x)} ${fmt(cp1.y)} ${fmt(cp2.x)} ${fmt(cp2.y)} ${fmt(firstAnchor.position.x)} ${fmt(
          firstAnchor.position.y
        )}`
      );
    }
    commands.push("Z");
  }

  segments.push(commands.join(" "));
  return segments.join(" ");
}
