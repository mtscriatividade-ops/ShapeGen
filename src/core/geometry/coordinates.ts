import type { Vector2, Viewport } from "@/types/shape";

/**
 * Converte um ponto em coordenadas de tela (clientX/clientY do evento de
 * ponteiro) para coordenadas internas do <svg> (mesmo espaço do viewBox),
 * usando a matriz de transformação nativa do elemento.
 *
 * Isso garante que o mapeamento continue correto independentemente de
 * zoom/pan aplicados via viewBox, sem precisarmos reimplementar a álgebra
 * de matrizes manualmente.
 */
export function screenToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): Vector2 {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };

  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

/**
 * Calcula a string de viewBox a partir do estado de viewport (pan + zoom)
 * e do tamanho base (em pixels lógicos) da área de edição.
 */
export function computeViewBox(
  viewport: Viewport,
  baseWidth: number,
  baseHeight: number
): string {
  const width = baseWidth / viewport.zoom;
  const height = baseHeight / viewport.zoom;
  return `${viewport.x} ${viewport.y} ${width} ${height}`;
}
