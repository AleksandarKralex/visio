import React from 'react';
import type { DiagramConnection, DiagramShape, Point } from '../types';

function getShapeCenter(shape: DiagramShape): Point {
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
}

function getConnectionPoint(shape: DiagramShape, targetCenter: Point): Point {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const dx = targetCenter.x - cx;
  const dy = targetCenter.y - cy;

  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: cx, y: cy };

  const scaleX = Math.abs(shape.width / 2 / dx);
  const scaleY = Math.abs(shape.height / 2 / dy);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

function getElbowPath(src: Point, dst: Point): string {
  const midX = (src.x + dst.x) / 2;
  return `M ${src.x} ${src.y} H ${midX} V ${dst.y} H ${dst.x}`;
}

function getCurvePath(src: Point, dst: Point): string {
  const dx = dst.x - src.x;
  const dy = dst.y - src.y;
  const cx1 = src.x + dx * 0.4;
  const cy1 = src.y;
  const cx2 = dst.x - dx * 0.4;
  const cy2 = dst.y;
  return `M ${src.x} ${src.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${dst.x} ${dst.y}`;
}

function getStraightPath(src: Point, dst: Point): string {
  return `M ${src.x} ${src.y} L ${dst.x} ${dst.y}`;
}

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
  const { id, sourceId, targetId, style, label, textStyle, waypoints } = connection;

  const sourceShape = shapes.find(s => s.id === sourceId);
  const targetShape = shapes.find(s => s.id === targetId);

  if (!sourceShape || !targetShape) return null;

  const srcCenter = getShapeCenter(sourceShape);
  const dstCenter = getShapeCenter(targetShape);

  const src = getConnectionPoint(sourceShape, dstCenter);
  const dst = getConnectionPoint(targetShape, srcCenter);

  let pathD: string;
  if (waypoints.length > 0) {
    const pts = [src, ...waypoints, dst];
    pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  } else if (style.lineStyle === 'elbow') {
    pathD = getElbowPath(src, dst);
  } else if (style.lineStyle === 'curved') {
    pathD = getCurvePath(src, dst);
  } else {
    pathD = getStraightPath(src, dst);
  }

  const midX = (src.x + dst.x) / 2;
  const midY = (src.y + dst.y) / 2;

  const startMarkerId = `start-${id}`;
  const endMarkerId = `end-${id}`;

  const startMarker = getArrowMarker(style.startArrow, style.stroke, startMarkerId);
  const endMarker = getArrowMarker(style.endArrow, style.stroke, endMarkerId);

  return (
    <g style={{ opacity: style.opacity }}>
      <defs>
        {startMarker}
        {endMarker}
      </defs>
      {/* Hit area */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
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
        markerStart={style.startArrow !== 'none' ? `url(#${startMarkerId})` : undefined}
        markerEnd={style.endArrow !== 'none' ? `url(#${endMarkerId})` : undefined}
        pointerEvents="none"
      />
      {label && (
        <g>
          <rect
            x={midX - 30}
            y={midY - 10}
            width={60}
            height={20}
            fill="white"
            rx={3}
            stroke={isSelected ? '#0066CC' : 'none'}
            strokeWidth={0.5}
          />
          <text
            x={midX}
            y={midY}
            fontSize={textStyle.fontSize}
            fontFamily={textStyle.fontFamily}
            fill={textStyle.color}
            textAnchor="middle"
            dominantBaseline="central"
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
