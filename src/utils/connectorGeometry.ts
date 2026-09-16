import type { DiagramShape, Point } from '../types';

export type Side = 'top' | 'right' | 'bottom' | 'left';

/**
 * Absolute point on `shape`'s bounding-box edge for the given side.
 * `t` (0-1) is the fractional position along that edge — for top/bottom, t=0 is
 * the left end; for left/right, t=0 is the top end. t=0.5 (the default) is the
 * exact midpoint, matching every pre-existing call site and all saved diagrams
 * that predate free glue points.
 */
export function portPoint(shape: DiagramShape, side: Side, t: number = 0.5): Point {
  const { x, y, width: w, height: h } = shape;
  switch (side) {
    case 'top':    return { x: x + w * t, y };
    case 'right':  return { x: x + w, y: y + h * t };
    case 'bottom': return { x: x + w * t, y: y + h };
    case 'left':   return { x, y: y + h * t };
  }
}

/** Pick the best port side on `shape` pointing toward `toward`. */
export function autoSide(shape: DiagramShape, toward: Point): Side {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const sdx = (toward.x - cx) / (shape.width / 2 + 1);
  const sdy = (toward.y - cy) / (shape.height / 2 + 1);
  if (Math.abs(sdx) >= Math.abs(sdy)) return sdx >= 0 ? 'right' : 'left';
  return sdy >= 0 ? 'bottom' : 'top';
}
