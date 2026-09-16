import type { DiagramShape, Point } from '../types';
import type { Side } from './connectorGeometry';

const PAD = 14;   // padding around obstacle shapes
const TURN = 26;  // extra margin for same-side U-turns (fast-path heuristic only)

function isH(side: Side) { return side === 'left' || side === 'right'; }

// ── Obstacle checks (shared by the fast heuristic and A*'s trivial-path check
//    and grid-edge blocking) ─────────────────────────────────────────────────

function hBlocked(y: number, x1: number, x2: number, obs: DiagramShape[]): boolean {
  const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
  return obs.some(s =>
    y > s.y - PAD && y < s.y + s.height + PAD &&
    hi > s.x - PAD && lo < s.x + s.width + PAD
  );
}

function vBlocked(x: number, y1: number, y2: number, obs: DiagramShape[]): boolean {
  const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
  return obs.some(s =>
    x > s.x - PAD && x < s.x + s.width + PAD &&
    hi > s.y - PAD && lo < s.y + s.height + PAD
  );
}

function clearX(pref: number, y1: number, y2: number, obs: DiagramShape[]): number {
  if (!vBlocked(pref, y1, y2, obs)) return pref;
  const cands = obs.flatMap(s => [s.x - PAD - 10, s.x + s.width + PAD + 10]);
  return cands.sort((a, b) => Math.abs(a - pref) - Math.abs(b - pref))
    .find(x => !vBlocked(x, y1, y2, obs)) ?? pref;
}

function clearY(pref: number, x1: number, x2: number, obs: DiagramShape[]): number {
  if (!hBlocked(pref, x1, x2, obs)) return pref;
  const cands = obs.flatMap(s => [s.y - PAD - 10, s.y + s.height + PAD + 10]);
  return cands.sort((a, b) => Math.abs(a - pref) - Math.abs(b - pref))
    .find(y => !hBlocked(y, x1, x2, obs)) ?? pref;
}

/** Preferred mid-X for H-V-H routing (handles U-turns on same side). */
function prefMidX(se: Point, ss: Side, de: Point, ds: Side): number {
  if (ss === 'right' && ds === 'right') return Math.max(se.x, de.x) + TURN;
  if (ss === 'left' && ds === 'left') return Math.min(se.x, de.x) - TURN;
  return (se.x + de.x) / 2;
}

/** Preferred mid-Y for V-H-V routing (handles U-turns on same side). */
function prefMidY(se: Point, ss: Side, de: Point, ds: Side): number {
  if (ss === 'bottom' && ds === 'bottom') return Math.max(se.y, de.y) + TURN;
  if (ss === 'top' && ds === 'top') return Math.min(se.y, de.y) - TURN;
  return (se.y + de.y) / 2;
}

/**
 * Cheap single-bend obstacle-avoidance heuristic (today's pre-existing algorithm,
 * unchanged). Tries at most two alternative positions per obstacle and gives up
 * (drawing through the obstacle) if neither is clear. Used as the live drag
 * preview (routeConnectorFast) and as `routeConnectorAStar`'s fast-accept
 * candidate when it happens to already be unobstructed.
 */
function innerWaypointsHeuristic(se: Point, ss: Side, de: Point, ds: Side, obs: DiagramShape[]): Point[] {
  const sh = isH(ss), dh = isH(ds);

  if (sh && dh) {
    const mx = clearX(prefMidX(se, ss, de, ds), se.y, de.y, obs);
    return [{ x: mx, y: se.y }, { x: mx, y: de.y }];
  }

  if (!sh && !dh) {
    const my = clearY(prefMidY(se, ss, de, ds), se.x, de.x, obs);
    return [{ x: se.x, y: my }, { x: de.x, y: my }];
  }

  if (sh) {
    if (!hBlocked(se.y, se.x, de.x, obs) && !vBlocked(de.x, se.y, de.y, obs))
      return [{ x: de.x, y: se.y }];
    return [{ x: se.x, y: de.y }];
  }
  if (!vBlocked(se.x, se.y, de.y, obs) && !hBlocked(de.y, se.x, de.x, obs))
    return [{ x: se.x, y: de.y }];
  return [{ x: de.x, y: se.y }];
}

/** True if every axis-aligned segment of `[se, ...waypoints, de]` is unobstructed. */
function isWaypointPathClear(se: Point, waypoints: Point[], de: Point, obs: DiagramShape[]): boolean {
  const pts = [se, ...waypoints, de];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (a.y === b.y) {
      if (hBlocked(a.y, a.x, b.x, obs)) return false;
    } else if (a.x === b.x) {
      if (vBlocked(a.x, a.y, b.y, obs)) return false;
    } else {
      return false; // not axis-aligned — shouldn't happen for this heuristic's output
    }
  }
  return true;
}

/**
 * Cheap preview routing used while a shape/endpoint is actively being dragged.
 * Identical to today's shipping algorithm — zero regression risk, O(obstacles).
 */
export function routeConnectorFast(se: Point, ss: Side, de: Point, ds: Side, obstacles: DiagramShape[]): { waypoints: Point[] } {
  return { waypoints: innerWaypointsHeuristic(se, ss, de, ds, obstacles) };
}

// ── Grid A* pathfinding (full routing, used when idle / at drag-end) ─────────

const CELL_DEFAULT = 14;     // px, within the requested 10-20px band
const CELL_MAX = 24;         // px, adaptive ceiling to keep grids bounded
const MAX_GRID_NODES = 4000; // cols * rows cap
const MAX_EXPANSIONS = 20000; // hard cap on heap pops, independent safety net
const TURN_PENALTY = 40;     // extra cost charged when the path changes direction
const RETRY_MARGINS = [40, 100, 250]; // px, widened search region per retry

/** 0 = no direction yet (search start); 1=N 2=E 3=S 4=W. */
type DirCode = 0 | 1 | 2 | 3 | 4;

/** The direction a path must be travelling when it reaches a shape's `side` to
 * continue straight into the fixed stub segment that connects to the actual port
 * (the stub always travels inward, opposite the side's own outward-facing direction). */
function sideToInwardDir(side: Side): DirCode {
  switch (side) {
    case 'top': return 3;    // stub continues south, into the shape
    case 'bottom': return 1; // continues north
    case 'left': return 2;   // continues east
    case 'right': return 4;  // continues west
  }
}

function pickCellSize(spanW: number, spanH: number): number {
  let cell = CELL_DEFAULT;
  while ((spanW / cell) * (spanH / cell) > MAX_GRID_NODES && cell < CELL_MAX) cell += 2;
  return cell;
}

interface Grid {
  xLines: number[];
  yLines: number[];
  obstacles: DiagramShape[];
}

/**
 * Builds a local, bounded grid around `se`/`de` only — not the whole diagram —
 * so cost stays independent of total page shape count. Uses a uniform cell size
 * (10-20px band, adaptive up to CELL_MAX if the region is large) but inserts the
 * exact se/de coordinates as extra grid lines so the route touches the true exit
 * points with zero snapping error instead of a sub-cell visual jump.
 */
function buildGrid(se: Point, de: Point, allObstacles: DiagramShape[], margin: number): Grid {
  const cell = pickCellSize(Math.abs(de.x - se.x) + margin * 2, Math.abs(de.y - se.y) + margin * 2);

  const minX = Math.min(se.x, de.x) - margin;
  const maxX = Math.max(se.x, de.x) + margin;
  const minY = Math.min(se.y, de.y) - margin;
  const maxY = Math.max(se.y, de.y) + margin;
  const width = Math.max(maxX - minX, cell * 4);
  const height = Math.max(maxY - minY, cell * 4);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const x0 = cx - width / 2, x1 = cx + width / 2;
  const y0 = cy - height / 2, y1 = cy + height / 2;

  const obstacles = allObstacles.filter(s =>
    s.x - PAD < x1 && s.x + s.width + PAD > x0 &&
    s.y - PAD < y1 && s.y + s.height + PAD > y0
  );

  const xSet = new Set<number>([Math.round(x0), Math.round(x1), Math.round(se.x), Math.round(de.x)]);
  const ySet = new Set<number>([Math.round(y0), Math.round(y1), Math.round(se.y), Math.round(de.y)]);
  for (let x = x0 + cell; x < x1; x += cell) xSet.add(Math.round(x));
  for (let y = y0 + cell; y < y1; y += cell) ySet.add(Math.round(y));

  return {
    xLines: [...xSet].sort((a, b) => a - b),
    yLines: [...ySet].sort((a, b) => a - b),
    obstacles,
  };
}

/** Binary min-heap of (state id, f-score) pairs. No decrease-key; stale entries
 * are detected and skipped on pop via the gScore map (standard lazy-deletion A*). */
class MinHeap {
  private heap: { id: number; f: number }[] = [];
  get size() { return this.heap.length; }
  push(id: number, f: number) {
    const h = this.heap;
    h.push({ id, f });
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p].f <= h[i].f) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  }
  pop(): { id: number; f: number } | undefined {
    const h = this.heap;
    if (h.length === 0) return undefined;
    const top = h[0];
    const last = h.pop()!;
    if (h.length > 0) {
      h[0] = last;
      let i = 0;
      for (; ;) {
        const l = i * 2 + 1, r = i * 2 + 2;
        let smallest = i;
        if (l < h.length && h[l].f < h[smallest].f) smallest = l;
        if (r < h.length && h[r].f < h[smallest].f) smallest = r;
        if (smallest === i) break;
        [h[smallest], h[i]] = [h[i], h[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

/**
 * Orthogonal grid A* from `se` to `de`, arriving at `de` moving in
 * `requiredEndDir` (so the fixed de→dst stub continues straight, no kink).
 * State is (col, row, arrival-direction) rather than plain (col,row) because the
 * turn penalty depends on which direction the path arrived from. Returns the
 * full grid-point path (including se and de) or null if no path was found within
 * the expansion budget.
 */
function findPath(grid: Grid, se: Point, de: Point, requiredEndDir: DirCode): Point[] | null {
  const { xLines, yLines, obstacles } = grid;
  const numCols = xLines.length, numRows = yLines.length;
  if (numCols < 2 || numRows < 2) return null;

  const startCol = xLines.indexOf(Math.round(se.x));
  const startRow = yLines.indexOf(Math.round(se.y));
  const goalCol = xLines.indexOf(Math.round(de.x));
  const goalRow = yLines.indexOf(Math.round(de.y));
  if (startCol < 0 || startRow < 0 || goalCol < 0 || goalRow < 0) return null;

  const NUM_DIRS = 5;
  const stateId = (col: number, row: number, dir: DirCode) => (col * numRows + row) * NUM_DIRS + dir;
  const decode = (id: number): { col: number; row: number; dir: DirCode } => {
    const dir = (id % NUM_DIRS) as DirCode;
    const rest = (id - dir) / NUM_DIRS;
    const row = rest % numRows;
    const col = (rest - row) / numRows;
    return { col, row, dir };
  };
  const heuristic = (col: number, row: number) => Math.abs(xLines[col] - de.x) + Math.abs(yLines[row] - de.y);

  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const heap = new MinHeap();

  const startId = stateId(startCol, startRow, 0);
  gScore.set(startId, 0);
  heap.push(startId, heuristic(startCol, startRow));

  let expansions = 0;

  while (heap.size > 0) {
    if (expansions++ > MAX_EXPANSIONS) return null;
    const cur = heap.pop()!;
    const { col, row, dir } = decode(cur.id);
    const g = gScore.get(cur.id);
    if (g === undefined) continue;
    if (cur.f !== g + heuristic(col, row)) continue; // stale heap entry, a cheaper one already won

    if (col === goalCol && row === goalRow && dir === requiredEndDir) {
      const points: Point[] = [];
      let id: number | undefined = cur.id;
      while (id !== undefined) {
        const d = decode(id);
        points.push({ x: xLines[d.col], y: yLines[d.row] });
        id = cameFrom.get(id);
      }
      points.reverse();
      return points;
    }

    const neighbors: { col: number; row: number; dir: DirCode; cost: number }[] = [];
    if (col + 1 < numCols && !hBlocked(yLines[row], xLines[col], xLines[col + 1], obstacles))
      neighbors.push({ col: col + 1, row, dir: 2, cost: xLines[col + 1] - xLines[col] });
    if (col - 1 >= 0 && !hBlocked(yLines[row], xLines[col], xLines[col - 1], obstacles))
      neighbors.push({ col: col - 1, row, dir: 4, cost: xLines[col] - xLines[col - 1] });
    if (row + 1 < numRows && !vBlocked(xLines[col], yLines[row], yLines[row + 1], obstacles))
      neighbors.push({ col, row: row + 1, dir: 3, cost: yLines[row + 1] - yLines[row] });
    if (row - 1 >= 0 && !vBlocked(xLines[col], yLines[row], yLines[row - 1], obstacles))
      neighbors.push({ col, row: row - 1, dir: 1, cost: yLines[row] - yLines[row - 1] });

    for (const n of neighbors) {
      const turnCost = dir !== 0 && n.dir !== dir ? TURN_PENALTY : 0;
      const tentativeG = g + n.cost + turnCost;
      const nId = stateId(n.col, n.row, n.dir);
      const known = gScore.get(nId);
      if (known === undefined || tentativeG < known) {
        gScore.set(nId, tentativeG);
        cameFrom.set(nId, cur.id);
        heap.push(nId, tentativeG + heuristic(n.col, n.row));
      }
    }
  }
  return null;
}

/** Drops colinear interior points, keeping only real corners; also drops the
 * leading/trailing points since those equal se/de, which the caller adds back. */
function simplifyPath(points: Point[]): Point[] {
  if (points.length <= 2) return [];
  const out: Point[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const collinearH = a.y === b.y && b.y === c.y;
    const collinearV = a.x === b.x && b.x === c.x;
    if (!collinearH && !collinearV) out.push(b);
  }
  return out;
}

/**
 * Full grid-based A* routing, used when idle or at drag-end. Falls back to
 * `routeConnectorFast`'s result if no obstacle actually blocks the direct
 * candidate (skipping grid construction entirely — the common case) or if every
 * retry region fails to find a path (never throws, never hangs; worst case
 * matches today's pre-existing behavior exactly).
 */
export function routeConnectorAStar(se: Point, ss: Side, de: Point, ds: Side, obstacles: DiagramShape[]): { waypoints: Point[] } {
  const candidate = innerWaypointsHeuristic(se, ss, de, ds, obstacles);
  if (isWaypointPathClear(se, candidate, de, obstacles)) {
    return { waypoints: candidate };
  }

  const requiredEndDir = sideToInwardDir(ds);
  for (const margin of RETRY_MARGINS) {
    const grid = buildGrid(se, de, obstacles, margin);
    const rawPath = findPath(grid, se, de, requiredEndDir);
    if (rawPath) return { waypoints: simplifyPath(rawPath) };
  }

  return { waypoints: candidate };
}
