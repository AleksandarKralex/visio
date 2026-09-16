import React, { useMemo } from 'react';
import type { DiagramConnection, DiagramShape, Point } from '../types';
import { portPoint, autoSide, type Side } from '../utils/connectorGeometry';
import { routeConnectorFast, routeConnectorAStar } from '../utils/connectorRouting';

const EXIT = 20;   // clearance from shape edge before first turn

function exitPt(pt: Point, side: Side, d: number): Point {
  switch (side) {
    case 'top':    return { x: pt.x, y: pt.y - d };
    case 'right':  return { x: pt.x + d, y: pt.y };
    case 'bottom': return { x: pt.x, y: pt.y + d };
    case 'left':   return { x: pt.x - d, y: pt.y };
  }
}

type RouteFn = typeof routeConnectorFast;

function buildElbowPath(src: Point, ss: Side, dst: Point, ds: Side, obs: DiagramShape[], route: RouteFn): string {
  const se = exitPt(src, ss, EXIT);
  const de = exitPt(dst, ds, EXIT);
  const { waypoints } = route(se, ss, de, ds, obs);
  return [src, se, ...waypoints, de, dst]
    .map((p, i) => `${i ? 'L' : 'M'} ${Math.round(p.x)} ${Math.round(p.y)}`)
    .join(' ');
}

function buildCurvePath(src: Point, ss: Side, dst: Point, ds: Side): string {
  const d = Math.max(50, Math.hypot(dst.x - src.x, dst.y - src.y) * 0.4);
  const c1 = exitPt(src, ss, d);
  const c2 = exitPt(dst, ds, d);
  return `M ${src.x} ${src.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${dst.x} ${dst.y}`;
}

/** Resolves both endpoints' side (explicit or auto-picked) and absolute point. */
function resolveEndpoints(
  sourceShape: DiagramShape, targetShape: DiagramShape,
  sourceSide: Side | undefined, targetSide: Side | undefined,
  sourceT: number | undefined, targetT: number | undefined
): { ss: Side; ds: Side; src: Point; dst: Point } {
  const srcCenter = { x: sourceShape.x + sourceShape.width / 2, y: sourceShape.y + sourceShape.height / 2 };
  const dstCenter = { x: targetShape.x + targetShape.width / 2, y: targetShape.y + targetShape.height / 2 };
  const ss = sourceSide ?? autoSide(sourceShape, dstCenter);
  const ds = targetSide ?? autoSide(targetShape, srcCenter);
  return { ss, ds, src: portPoint(sourceShape, ss, sourceT), dst: portPoint(targetShape, ds, targetT) };
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
  isDragging: boolean;
  onClick: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (id: string, e: React.MouseEvent) => void;
}

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  connection, shapes, isSelected, isDragging, onClick, onDoubleClick
}) => {
  const { id, sourceId, targetId, style, label, textStyle, waypoints, sourceSide, targetSide, sourceT, targetT } = connection;

  const sourceShape = shapes.find(s => s.id === sourceId);
  const targetShape = shapes.find(s => s.id === targetId);

  // Stable string key for "every other shape's geometry" — cheap to build, but
  // lets the expensive routing below skip recomputation on unrelated re-renders
  // (selecting a shape, editing a label, etc.) while still invalidating the
  // instant any shape anywhere moves/resizes.
  const obsKey = shapes
    .filter(s => s.id !== sourceId && s.id !== targetId)
    .map(s => `${s.id}:${s.x}:${s.y}:${s.width}:${s.height}`)
    .join('|');

  const pathD = useMemo(() => {
    if (!sourceShape || !targetShape) return '';
    const { ss, ds, src, dst } = resolveEndpoints(sourceShape, targetShape, sourceSide, targetSide, sourceT, targetT);

    if (waypoints.length > 0) {
      const pts = [src, ...waypoints, dst];
      return pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
    }
    if (style.lineStyle === 'elbow') {
      const obs = shapes.filter(s => s.id !== sourceId && s.id !== targetId);
      const route = isDragging ? routeConnectorFast : routeConnectorAStar;
      return buildElbowPath(src, ss, dst, ds, obs, route);
    }
    if (style.lineStyle === 'curved') {
      return buildCurvePath(src, ss, dst, ds);
    }
    return `M ${src.x} ${src.y} L ${dst.x} ${dst.y}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sourceShape, targetShape, sourceSide, targetSide, sourceT, targetT,
    style.lineStyle, isDragging, waypoints, obsKey,
  ]);

  if (!sourceShape || !targetShape) return null;

  const { src, dst } = resolveEndpoints(sourceShape, targetShape, sourceSide, targetSide, sourceT, targetT);

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
        data-export-ignore="true"
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
        <g data-export-ignore="true">
          <circle cx={src.x} cy={src.y} r={4} fill="white" stroke="#0066CC" strokeWidth={1.5} pointerEvents="none" />
          <circle cx={dst.x} cy={dst.y} r={4} fill="white" stroke="#0066CC" strokeWidth={1.5} pointerEvents="none" />
        </g>
      )}
    </g>
  );
};
