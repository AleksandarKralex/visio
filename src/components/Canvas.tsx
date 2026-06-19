import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { ShapeRenderer } from './ShapeRenderer';
import { ConnectionRenderer } from './ConnectionRenderer';
import type { DiagramShape, Point, ShapeType } from '../types';

const HANDLE_SIZE = 8;
const PORT_RADIUS = 7;        // visual radius
const PORT_HIT_RADIUS = 12;  // invisible hit area radius

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  type: 'move' | 'resize' | 'pan' | 'select-box' | 'connect';
  startX: number;
  startY: number;
  handle?: ResizeHandle;
  initialShapes?: { id: string; x: number; y: number; width: number; height: number }[];
  connectSourceId?: string;
}

function snapToGrid(val: number, gridSize: number, snap: boolean): number {
  if (!snap) return val;
  return Math.round(val / gridSize) * gridSize;
}

function getShapePorts(shape: DiagramShape) {
  return [
    { side: 'top', cx: shape.x + shape.width / 2, cy: shape.y },
    { side: 'right', cx: shape.x + shape.width, cy: shape.y + shape.height / 2 },
    { side: 'bottom', cx: shape.x + shape.width / 2, cy: shape.y + shape.height },
    { side: 'left', cx: shape.x, cy: shape.y + shape.height / 2 },
  ];
}

export const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [selBox, setSelBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [connectLine, setConnectLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [hoveredShape, setHoveredShape] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const {
    file, activeTool, selectedIds, canvas, showGrid,
    setSelectedIds, clearSelection, addToSelection, setActiveTool,
    addShape, updateShape, removeShapes, removeConnections, pushHistory,
    addConnection, setZoom, setPan, setConnectingFrom, connectingFrom,
  } = useStore();

  const page = file.pages.find(p => p.id === file.activePageId)!;
  const { zoom, panX, panY } = canvas;
  const gridSize = page?.gridSize ?? 20;

  const svgToCanvas = useCallback((clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  // Hit-test with a small tolerance margin for better precision
  const getShapeAt = useCallback((x: number, y: number, margin = 2): DiagramShape | null => {
    const shapes = [...(page?.shapes ?? [])].sort((a, b) => b.zIndex - a.zIndex);
    for (const shape of shapes) {
      if (x >= shape.x - margin && x <= shape.x + shape.width + margin &&
        y >= shape.y - margin && y <= shape.y + shape.height + margin) {
        return shape;
      }
    }
    return null;
  }, [page]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = svgRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
      const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      setPan(panX - e.deltaX, panY - e.deltaY);
    }
  }, [zoom, panX, panY, setZoom, setPan]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Start connection from a shape or a port
  const startConnect = useCallback((shapeId: string, portX: number, portY: number) => {
    setConnectingFrom(shapeId);
    setConnectLine({ x1: portX, y1: portY, x2: portX, y2: portY });
  }, [setConnectingFrom]);

  // Complete connection to a shape
  const completeConnect = useCallback((targetId: string) => {
    if (connectingFrom && connectingFrom !== targetId) {
      addConnection(connectingFrom, targetId);
    }
    setConnectingFrom(null);
    setConnectLine(null);
  }, [connectingFrom, addConnection, setConnectingFrom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const pt = svgToCanvas(e.clientX, e.clientY);

    if (e.button === 1 || activeTool === 'pan') {
      setDrag({ type: 'pan', startX: e.clientX, startY: e.clientY });
      return;
    }

    if (activeTool !== 'select' && activeTool !== 'connect' && activeTool !== 'text') {
      const snapX = snapToGrid(pt.x - 60, gridSize, page.snapToGrid);
      const snapY = snapToGrid(pt.y - 40, gridSize, page.snapToGrid);
      addShape(activeTool as ShapeType, snapX, snapY);
      setActiveTool('select');
      return;
    }

    const shape = getShapeAt(pt.x, pt.y);

    if (activeTool === 'connect') {
      if (shape) {
        if (connectingFrom) {
          completeConnect(shape.id);
        } else {
          startConnect(shape.id, shape.x + shape.width / 2, shape.y + shape.height / 2);
          setDrag({ type: 'connect', startX: pt.x, startY: pt.y, connectSourceId: shape.id });
        }
      } else if (connectingFrom) {
        // Cancel connection on empty-space click
        setConnectingFrom(null);
        setConnectLine(null);
      }
      return;
    }

    if (activeTool === 'text') {
      if (!shape) {
        const id = addShape('text', pt.x - 75, pt.y - 20);
        setEditingId(id);
        setEditValue('Text');
        setActiveTool('select');
      }
      return;
    }

    if (!shape) {
      clearSelection();
      setDrag({ type: 'select-box', startX: pt.x, startY: pt.y });
      return;
    }

    if (e.shiftKey) {
      if (selectedIds.includes(shape.id)) {
        setSelectedIds(selectedIds.filter(id => id !== shape.id));
      } else {
        addToSelection(shape.id);
      }
    } else {
      if (!selectedIds.includes(shape.id)) {
        setSelectedIds([shape.id]);
      }
    }

    pushHistory();
    const ids = e.shiftKey
      ? [...new Set([...selectedIds, shape.id])]
      : selectedIds.includes(shape.id) ? selectedIds : [shape.id];

    const initialShapes = ids
      .map(id => page.shapes.find(s => s.id === id))
      .filter((s): s is DiagramShape => !!s)
      .map(s => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height }));

    setDrag({ type: 'move', startX: pt.x, startY: pt.y, initialShapes });
  }, [activeTool, svgToCanvas, getShapeAt, selectedIds, connectingFrom, page, gridSize,
    addShape, clearSelection, addToSelection, setSelectedIds, pushHistory,
    setActiveTool, startConnect, completeConnect, setConnectingFrom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return;
    const pt = svgToCanvas(e.clientX, e.clientY);

    if (drag.type === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setPan(panX + dx, panY + dy);
      setDrag({ ...drag, startX: e.clientX, startY: e.clientY });
      return;
    }

    if (drag.type === 'select-box') {
      setSelBox({
        x: Math.min(drag.startX, pt.x),
        y: Math.min(drag.startY, pt.y),
        w: Math.abs(pt.x - drag.startX),
        h: Math.abs(pt.y - drag.startY),
      });
      return;
    }

    if (drag.type === 'connect') {
      const src = drag.connectSourceId ? page.shapes.find(s => s.id === drag.connectSourceId) : null;
      if (src && connectLine) {
        setConnectLine({ ...connectLine, x2: pt.x, y2: pt.y });
      }
      return;
    }

    if (drag.type === 'move' && drag.initialShapes) {
      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      for (const init of drag.initialShapes) {
        updateShape(init.id, {
          x: snapToGrid(init.x + dx, gridSize, page.snapToGrid),
          y: snapToGrid(init.y + dy, gridSize, page.snapToGrid),
        });
      }
    }

    if (drag.type === 'resize' && drag.initialShapes?.length === 1) {
      const init = drag.initialShapes[0];
      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      const h = drag.handle!;
      let { x, y, width, height } = init;

      if (h.includes('e')) width = Math.max(20, init.width + dx);
      if (h.includes('s')) height = Math.max(20, init.height + dy);
      if (h.includes('w')) { x = init.x + dx; width = Math.max(20, init.width - dx); }
      if (h.includes('n')) { y = init.y + dy; height = Math.max(20, init.height - dy); }

      updateShape(init.id, {
        x: snapToGrid(x, gridSize, page.snapToGrid),
        y: snapToGrid(y, gridSize, page.snapToGrid),
        width: snapToGrid(width, gridSize, page.snapToGrid),
        height: snapToGrid(height, gridSize, page.snapToGrid),
      });
    }
  }, [drag, svgToCanvas, panX, panY, page, gridSize, connectLine, setPan, updateShape]);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    if (!drag) return;

    if (drag.type === 'select-box' && selBox) {
      const selected = (page?.shapes ?? [])
        .filter(s =>
          s.x + s.width > selBox.x && s.x < selBox.x + selBox.w &&
          s.y + s.height > selBox.y && s.y < selBox.y + selBox.h
        )
        .map(s => s.id);
      setSelectedIds(selected);
    }

    if (drag.type === 'connect') {
      // Connection is committed via clicks, not drag release
      setConnectLine(prev => prev ? { ...prev } : null);
    }

    setDrag(null);
    setSelBox(null);
  }, [drag, selBox, page, setSelectedIds]);

  const handleShapeMouseDown = useCallback((e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();

    if (activeTool === 'connect') {
      if (connectingFrom) {
        completeConnect(shapeId);
      } else {
        const shape = page.shapes.find(s => s.id === shapeId);
        if (shape) startConnect(shapeId, shape.x + shape.width / 2, shape.y + shape.height / 2);
      }
      return;
    }

    if (e.shiftKey) {
      if (selectedIds.includes(shapeId)) {
        setSelectedIds(selectedIds.filter(id => id !== shapeId));
      } else {
        addToSelection(shapeId);
      }
      return;
    }

    if (!selectedIds.includes(shapeId)) {
      setSelectedIds([shapeId]);
    }

    pushHistory();
    const ids = selectedIds.includes(shapeId) ? selectedIds : [shapeId];
    const pt = svgToCanvas(e.clientX, e.clientY);
    const initialShapes = ids
      .map(id => page.shapes.find(s => s.id === id))
      .filter((s): s is DiagramShape => !!s)
      .map(s => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height }));

    setDrag({ type: 'move', startX: pt.x, startY: pt.y, initialShapes });
  }, [activeTool, selectedIds, connectingFrom, page, svgToCanvas,
    setSelectedIds, addToSelection, pushHistory, startConnect, completeConnect]);

  const handlePortMouseDown = useCallback((e: React.MouseEvent, shapeId: string, portX: number, portY: number) => {
    e.stopPropagation();
    if (connectingFrom) {
      completeConnect(shapeId);
    } else {
      startConnect(shapeId, portX, portY);
    }
  }, [connectingFrom, startConnect, completeConnect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, shapeId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    pushHistory();
    const pt = svgToCanvas(e.clientX, e.clientY);
    const shape = page.shapes.find(s => s.id === shapeId)!;
    setDrag({
      type: 'resize', startX: pt.x, startY: pt.y, handle,
      initialShapes: [{ id: shape.id, x: shape.x, y: shape.y, width: shape.width, height: shape.height }],
    });
  }, [page, svgToCanvas, pushHistory]);

  const handleShapeDoubleClick = useCallback((e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    const shape = page.shapes.find(s => s.id === shapeId);
    if (!shape) return;
    setEditingId(shapeId);
    setEditValue(shape.label);
    setTimeout(() => {
      editRef.current?.focus();
      editRef.current?.select();
    }, 10);
  }, [page]);

  const commitEdit = useCallback(() => {
    if (editingId) {
      updateShape(editingId, { label: editValue });
      setEditingId(null);
    }
  }, [editingId, editValue, updateShape]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingId) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    const { selectedIds: sids, removeShapes: rmShapes, removeConnections: rmConns,
      undo, redo, copy, paste, cut, duplicateShapes, selectAll, setActiveTool: sat } = useStore.getState();

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (sids.length > 0) {
        const page = useStore.getState().file.pages.find(
          p => p.id === useStore.getState().file.activePageId
        );
        const shapeIds = sids.filter(id => page?.shapes.find(s => s.id === id));
        const connIds = sids.filter(id => page?.connections.find(c => c.id === id));
        if (shapeIds.length > 0) rmShapes(shapeIds);
        if (connIds.length > 0) rmConns(connIds);
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copy(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); paste(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') { e.preventDefault(); cut(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateShapes(sids); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); selectAll(); }
    if (e.key === 'Escape') {
      useStore.getState().clearSelection();
      sat('select');
      setConnectingFrom(null);
      setConnectLine(null);
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === 'v' || e.key === 'V') sat('select');
      if (e.key === 'h' || e.key === 'H') sat('pan');
      if (e.key === 'c' || e.key === 'C') sat('connect');
      if (e.key === 't' || e.key === 'T') sat('text');
    }
  }, [editingId, setConnectingFrom]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('shape-type') as ShapeType;
    if (!type) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const cx = (e.clientX - rect.left - panX) / zoom;
    const cy = (e.clientY - rect.top - panY) / zoom;
    addShape(type, snapToGrid(cx - 60, gridSize, page?.snapToGrid ?? true),
      snapToGrid(cy - 40, gridSize, page?.snapToGrid ?? true));
  }, [panX, panY, zoom, gridSize, page, addShape]);

  const sortedShapes = [...(page?.shapes ?? [])].sort((a, b) => a.zIndex - b.zIndex);

  const getResizeHandles = (shape: DiagramShape) => {
    const { x, y, width: w, height: h } = shape;
    return [
      { id: 'nw', cx: x, cy: y }, { id: 'n', cx: x + w / 2, cy: y }, { id: 'ne', cx: x + w, cy: y },
      { id: 'e', cx: x + w, cy: y + h / 2 }, { id: 'se', cx: x + w, cy: y + h },
      { id: 's', cx: x + w / 2, cy: y + h }, { id: 'sw', cx: x, cy: y + h },
      { id: 'w', cx: x, cy: y + h / 2 },
    ] as const;
  };

  const getCursor = () => {
    if (activeTool === 'pan' || drag?.type === 'pan') return 'grabbing';
    if (activeTool === 'connect') return 'crosshair';
    if (activeTool !== 'select') return 'crosshair';
    return 'default';
  };

  const showPorts = activeTool === 'connect' || (activeTool === 'select' && hoveredShape !== null);

  return (
    <div ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', background: '#f5f5f7', position: 'relative' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#00000020" />
          </filter>
          {showGrid && (
            <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse"
              x={panX % (gridSize * zoom)} y={panY % (gridSize * zoom)}
              patternTransform={`scale(${zoom})`}>
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#e2e2e8" strokeWidth="0.5" />
            </pattern>
          )}
        </defs>

        <rect width="100%" height="100%" fill={page?.background ?? '#ffffff'} />
        {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Connections */}
          {page?.connections.map(conn => (
            <ConnectionRenderer
              key={conn.id}
              connection={conn}
              shapes={page.shapes}
              isSelected={selectedIds.includes(conn.id)}
              onClick={(id, e) => {
                if (e.shiftKey) addToSelection(id);
                else setSelectedIds([id]);
              }}
              onDoubleClick={(id) => {
                const c = page.connections.find(c => c.id === id);
                if (c) { setEditingId(id); setEditValue(c.label); }
              }}
            />
          ))}

          {/* Shapes */}
          {sortedShapes.map(shape => {
            const isSelected = selectedIds.includes(shape.id);
            const isHovered = hoveredShape === shape.id;
            const showPortsForShape = (isHovered || isSelected || connectingFrom === shape.id) && showPorts;

            return (
              <g
                key={shape.id}
                transform={`translate(${shape.x}, ${shape.y})`}
                style={{ cursor: activeTool === 'select' ? 'move' : 'crosshair' }}
                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)}
                onMouseEnter={() => setHoveredShape(shape.id)}
                onMouseLeave={() => setHoveredShape(null)}
              >
                <ShapeRenderer shape={shape} />

                {/* Invisible larger hit area for easy selection */}
                <rect
                  x={-4} y={-4}
                  width={shape.width + 8} height={shape.height + 8}
                  fill="transparent"
                  stroke="none"
                />

                {isSelected && (
                  <rect x={-2} y={-2} width={shape.width + 4} height={shape.height + 4}
                    fill="none" stroke="#0066CC" strokeWidth={1.5 / zoom}
                    strokeDasharray={`${4 / zoom} ${2 / zoom}`}
                    pointerEvents="none" rx={2} />
                )}

                {isHovered && !isSelected && (
                  <rect x={-1} y={-1} width={shape.width + 2} height={shape.height + 2}
                    fill="none" stroke={activeTool === 'connect' ? '#0066CC' : '#c7c7cc'}
                    strokeWidth={1.5 / zoom} pointerEvents="none" rx={2} />
                )}
              </g>
            );
          })}

          {/* Connection ports — rendered ABOVE shapes so they're always clickable */}
          {showPorts && sortedShapes.map(shape => {
            const isHovered = hoveredShape === shape.id;
            const isSelected = selectedIds.includes(shape.id);
            if (!isHovered && !isSelected && connectingFrom !== shape.id) return null;

            return getShapePorts(shape).map(port => (
              <g key={`${shape.id}-${port.side}`}>
                {/* Large invisible hit area */}
                <circle
                  cx={port.cx} cy={port.cy}
                  r={PORT_HIT_RADIUS / zoom}
                  fill="transparent"
                  stroke="none"
                  style={{ cursor: 'crosshair' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handlePortMouseDown(e, shape.id, port.cx, port.cy);
                  }}
                />
                {/* Visual port circle */}
                <circle
                  cx={port.cx} cy={port.cy}
                  r={PORT_RADIUS / zoom}
                  fill="white"
                  stroke="#0066CC"
                  strokeWidth={2 / zoom}
                  pointerEvents="none"
                />
                <circle
                  cx={port.cx} cy={port.cy}
                  r={3 / zoom}
                  fill="#0066CC"
                  pointerEvents="none"
                />
              </g>
            ));
          })}

          {/* Resize handles */}
          {selectedIds.length === 1 && (() => {
            const shape = page?.shapes.find(s => s.id === selectedIds[0]);
            if (!shape) return null;
            return getResizeHandles(shape).map(h => (
              <rect
                key={h.id}
                x={h.cx - HANDLE_SIZE / 2 / zoom} y={h.cy - HANDLE_SIZE / 2 / zoom}
                width={HANDLE_SIZE / zoom} height={HANDLE_SIZE / zoom}
                fill="white" stroke="#0066CC" strokeWidth={1.5 / zoom} rx={1 / zoom}
                style={{ cursor: `${h.id}-resize`, pointerEvents: activeTool === 'select' ? 'all' : 'none' }}
                onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDown(e, shape.id, h.id as ResizeHandle); }}
              />
            ));
          })()}

          {/* Multi-select bounding box */}
          {selectedIds.length > 1 && (() => {
            const sel = page?.shapes.filter(s => selectedIds.includes(s.id)) ?? [];
            if (sel.length === 0) return null;
            const minX = Math.min(...sel.map(s => s.x)) - 4;
            const minY = Math.min(...sel.map(s => s.y)) - 4;
            const maxX = Math.max(...sel.map(s => s.x + s.width)) + 4;
            const maxY = Math.max(...sel.map(s => s.y + s.height)) + 4;
            return (
              <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY}
                fill="none" stroke="#0066CC" strokeWidth={1.5 / zoom}
                strokeDasharray={`${6 / zoom} ${3 / zoom}`} pointerEvents="none" />
            );
          })()}

          {/* Selection rubber-band */}
          {selBox && (
            <rect x={selBox.x} y={selBox.y} width={selBox.w} height={selBox.h}
              fill="rgba(0,102,204,0.07)" stroke="#0066CC"
              strokeWidth={1 / zoom} pointerEvents="none" />
          )}

          {/* Connection preview line */}
          {connectLine && (
            <line
              x1={connectLine.x1} y1={connectLine.y1}
              x2={connectLine.x2} y2={connectLine.y2}
              stroke="#0066CC" strokeWidth={1.5 / zoom}
              strokeDasharray={`${6 / zoom} ${3 / zoom}`}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Connect-mode status indicator */}
      {activeTool === 'connect' && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          background: connectingFrom ? '#0066CC' : '#1a1a2e',
          color: 'white', padding: '5px 14px', borderRadius: 20,
          fontSize: 12, fontFamily: 'Inter, sans-serif', pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          {connectingFrom ? 'Click destination shape to connect • Esc to cancel' : 'Click a shape to start a connection'}
        </div>
      )}

      {/* Inline text editor — TEXTAREA with Shift+Enter support */}
      {editingId && (() => {
        const shape = page?.shapes.find(s => s.id === editingId);
        if (!shape) return null;
        const sx = shape.x * zoom + panX;
        const sy = shape.y * zoom + panY;
        const lines = editValue.split('\n').length;
        const minH = Math.max(shape.height * zoom, lines * shape.textStyle.fontSize * zoom * 1.4 + 16);
        return (
          <textarea
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
              if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
              // Shift+Enter → newline (default textarea behavior, no need to handle)
            }}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              width: shape.width * zoom,
              minHeight: minH,
              fontSize: shape.textStyle.fontSize * zoom,
              fontFamily: shape.textStyle.fontFamily,
              fontWeight: shape.textStyle.fontWeight,
              textAlign: shape.textStyle.align,
              color: shape.textStyle.color,
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid #0066CC',
              borderRadius: 4,
              outline: 'none',
              padding: '4px 8px',
              boxSizing: 'border-box',
              zIndex: 1000,
              resize: 'none',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
            autoFocus
          />
        );
      })()}
    </div>
  );
};
