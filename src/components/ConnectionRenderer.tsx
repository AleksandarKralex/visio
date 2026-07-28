import React from 'react';
import type { DiagramConnection, DiagramShape, Point } from '../types';

type Side = 'top' | 'right' | 'bottom' | 'left';

const EXIT = 20;   // clearance from shape edge before first turn
const PAD  = 14;   // padding around obstacle shapes
const TURN = 26;   // extra margin for same-side U-turns

// ── Geometry helpers ──────────────────────────────────────────────────────────

function portPoint(shape: DiagramShape, side: Side): Point {
  const { x, y, width: w, height: h } = shape;
  switch (side) {
    case 'top':    return { x: x + w / 2, y };
    case 'right':  return { x: x + w, y: y + h / 2 };
    case 'bottom': return { x: x + w / 2, y: y + h };
    case 'left':   return { x, y: y + h / 2 };
  }
}

function exitPt(pt: Point, side: Side, d: number): Point {
  switch (side) {
    case 'top':    return { x: pt.x, y: pt.y - d };
    case 'right':  return { x: pt.x + d, y: pt.y };
    case 'bottom': return { x: pt.x, y: pt.y + d };
    case 'left':   return { x: pt.x - d, y: pt.y };
  }
}

/** Pick the best port side on `shape` pointing toward `toward`. */
function autoSide(shape: DiagramShape, toward: Point): Side {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const sdx = (toward.x - cx) / (shape.width / 2 + 1);
  const sdy = (toward.y - cy) / (shape.height / 2 + 1);
  if (Math.abs(sdx) >= Math.abs(sdy)) return sdx >= 0 ? 'right' : 'left';
  return sdy >= 0 ? 'bottom' : 'top';
}

function isH(side: Side) { return side === 'left' || side === 'right'; }

// ── Obstacle checks ───────────────────────────────────────────────────────────

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

// ── Routing ───────────────────────────────────────────────────────────────────

/** Preferred mid-X for H-V-H routing (handles U-turns on same side). */
function prefMidX(se: Point, ss: Side, de: Point, ds: Side): number {
  if (ss === 'right' && ds === 'right') return Math.max(se.x, de.x) + TURN;
  if (ss === 'left'  && ds === 'left')  return Math.min(se.x, de.x) - TURN;
  return (se.x + de.x) / 2;
}

/** Preferred mid-Y for V-H-V routing (handles U-turns on same side). */
function prefMidY(se: Point, ss: Side, de: Point, ds: Side): number {
  if (ss === 'bottom' && ds === 'bottom') return Math.max(se.y, de.y) + TURN;
  if (ss === 'top'    && ds === 'top')    return Math.min(se.y, de.y) - TURN;
  return (se.y + de.y) / 2;
}

/**
 * Compute inner waypoints between the two exit points.
 * Returns 0-2 intermediate corners for an orthogonal path.
 */
function innerWaypoints(se: Point, ss: Side, de: Point, ds: Side, obs: DiagramShape[]): Point[] {
  const sh = isH(ss), dh = isH(ds);

  if (sh && dh) {
    // H-V-H: single vertical spine
    const mx = clearX(prefMidX(se, ss, de, ds), se.y, de.y, obs);
    return [{ x: mx, y: se.y }, { x: mx, y: de.y }];
  }

  if (!sh && !dh) {
    // V-H-V: single horizontal spine
    const my = clearY(prefMidY(se, ss, de, ds), se.x, de.x, obs);
    return [{ x: se.x, y: my }, { x: de.x, y: my }];
  }

  // Mixed (L-shape): try primary corner first, fallback to alternate
  if (sh) {
    // Horizontal exit → vertical entry
    if (!hBlocked(se.y, se.x, de.x, obs) && !vBlocked(de.x, se.y, de.y, obs))
      return [{ x: de.x, y: se.y }];
    return [{ x: se.x, y: de.y }];
  }
  // Vertical exit → horizontal entry
  if (!vBlocked(se.x, se.y, de.y, obs) && !hBlocked(de.y, se.x, de.x, obs))
    return [{ x: se.x, y: de.y }];
  return [{ x: de.x, y: se.y }];
}

function buildElbowPath(src: Point, ss: Side, dst: Point, ds: Side, obs: DiagramShape[]): string {
  const se = exitPt(src, ss, EXIT);
  const de = exitPt(dst, ds, EXIT);
  const wps = innerWaypoints(se, ss, de, ds, obs);
  return [src, se, ...wps, de, dst]
    .map((p, i) => `${i ? 'L' : 'M'} ${Math.round(p.x)} ${Math.round(p.y)}`)
    .join(' ');
}

function buildCurvePath(src: Point, ss: Side, dst: Point, ds: Side): string {
  const d = Math.max(50, Math.hypot(dst.x - src.x, dst.y - src.y) * 0.4);
  const c1 = exitPt(src, ss, d);
  const c2 = exitPt(dst, ds, d);
  return `M ${src.x} ${src.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${dst.x} ${dst.y}`;
}

// ── Arrow markers ─────────────────────────────────────────────────────────────

function getArrowMarker(type: string, color: string, id: string): React.ReactElement | null {
  if (type === 'none') return null;
  if (type === 'arrow') {
    return (
      <marker id={id} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill={color} />
      </marker>
    );
  }
  if (type === 'open') {
    return (
      <marker id={id} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polyline points="0 0, 10 3.5, 0 7" fill="none" stroke={color} strokeWidth="1.5" />
      </marker>
    );
  }
  if (type === 'diamond') {
    return (
      <marker id={id} markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
        <polygon points="5 0, 10 5, 5 10, 0 5" fill={color} />
      </marker>
    );
  }
  if (type === 'circle') {
    return (
      <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <circle cx="4" cy="4" r="3" fill={color} />
      </marker>
    );
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ConnectionRendererProps {
  connection: DiagramConnection;
  shapes: DiagramShape[];
  isSelected: boolean;
  onClick: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (id: string, e: React.MouseEvent) => void;
}

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  connection, shapes, isSelected, onClick, onDoubleClick
}) => {
  const { id, sourceId, targetId, style, label, textStyle, waypoints, sourceSide, targetSide } = connection;

  const sourceShape = shapes.find(s => s.id === sourceId);
  const targetShape = shapes.find(s => s.id === targetId);
  if (!sourceShape || !targetShape) return null;

  const srcCenter = { x: sourceShape.x + sourceShape.width / 2, y: sourceShape.y + sourceShape.height / 2 };
  const dstCenter = { x: targetShape.x + targetShape.width / 2, y: targetShape.y + targetShape.height / 2 };

  const ss = (sourceSide as Side | undefined) ?? autoSide(sourceShape, dstCenter);
  const ds = (targetSide as Side | undefined) ?? autoSide(targetShape, srcCenter);

  const src = portPoint(sourceShape, ss);
  const dst = portPoint(targetShape, ds);

  // All shapes that could block the path (exclude source & target)
  const obs = shapes.filter(s => s.id !== sourceId && s.id !== targetId);

  let pathD: string;
  if (waypoints.length > 0) {
    // User-defined waypoints override routing
    const pts = [src, ...waypoints, dst];
    pathD = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  } else if (style.lineStyle === 'elbow') {
    pathD = buildElbowPath(src, ss, dst, ds, obs);
  } else if (style.lineStyle === 'curved') {
    pathD = buildCurvePath(src, ss, dst, ds);
  } else {
    pathD = `M ${src.x} ${src.y} L ${dst.x} ${dst.y}`;
  }

  const midX = (src.x + dst.x) / 2;
  const midY = (src.y + dst.y) / 2;

  const startMarkerId = `start-${id}`;
  const endMarkerId   = `end-${id}`;
  const startMarker   = getArrowMarker(style.startArrow, style.stroke, startMarkerId);
  const endMarker     = getArrowMarker(style.endArrow,   style.stroke, endMarkerId);

  return (
    <g style={{ opacity: style.opacity }}>
      <defs>
        {startMarker}
        {endMarker}
      </defs>

      {/* Invisible wide hit area */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: 'pointer' }}
        onClick={(e) => onClick(id, e)}
        onDoubleClick={(e) => onDoubleClick(id, e)}
      />

      {/* Visible path */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#0066CC' : style.stroke}
        strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        strokeLinejoin="round"
        markerStart={style.startArrow !== 'none' ? `url(#${startMarkerId})` : undefined}
        markerEnd={style.endArrow   !== 'none' ? `url(#${endMarkerId})`   : undefined}
        pointerEvents="none"
      />

      {label && (
        <g>
          <rect x={midX - 32} y={midY - 10} width={64} height={20}
            fill="white" rx={3}
            stroke={isSelected ? '#0066CC' : 'none'} strokeWidth={0.5} />
          <text
            x={midX} y={midY}
            fontSize={textStyle.fontSize} fontFamily={textStyle.fontFamily}
            fill={textStyle.color}
            textAnchor="middle" dominantBaseline="central"
            pointerEvents="none"
          >
            {label}
          </text>
        </g>
      )}

      {isSelected && (
        <>
          <circle cx={src.x} cy={src.y} r={4} fill="white" stroke="#0066CC" strokeWidth={1.5} pointerEvents="none" />
          <circle cx={dst.x} cy={dst.y} r={4} fill="white" stroke="#0066CC" strokeWidth={1.5} pointerEvents="none" />
        </>
      )}
    </g>
  );
};
