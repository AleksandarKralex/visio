import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  shapeIds: string[];
  connIds: string[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, shapeIds, connIds, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    copy, paste, cut, duplicateShapes, removeShapes, removeConnections,
    groupShapes, bringToFront, sendToBack, bringForward, sendBackward,
    setSelectedIds,
  } = useStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const hasShapes = shapeIds.length > 0;
  const hasConns = connIds.length > 0;
  const hasSelection = hasShapes || hasConns;

  const items: MenuItem[] = [
    ...(hasSelection ? [
      { label: 'Cut', shortcut: 'Ctrl+X', action: cut },
      { label: 'Copy', shortcut: 'Ctrl+C', action: copy },
    ] : []),
    { label: 'Paste', shortcut: 'Ctrl+V', action: paste },
    ...(hasSelection ? [
      { separator: true } as MenuItem,
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => useStore.getState().selectAll() },
      { separator: true } as MenuItem,
    ] : []),
    ...(hasShapes ? [
      { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => duplicateShapes(shapeIds) },
      { separator: true } as MenuItem,
      { label: 'Bring to Front', action: () => bringToFront(shapeIds) },
      { label: 'Bring Forward', action: () => bringForward(shapeIds) },
      { label: 'Send Backward', action: () => sendBackward(shapeIds) },
      { label: 'Send to Back', action: () => sendToBack(shapeIds) },
      ...(shapeIds.length > 1 ? [
        { separator: true } as MenuItem,
        { label: 'Group', action: () => groupShapes(shapeIds) },
      ] : []),
      { separator: true } as MenuItem,
    ] : []),
    ...(hasSelection ? [
      {
        label: 'Delete', shortcut: 'Del', danger: true, action: () => {
          if (hasShapes) removeShapes(shapeIds);
          if (hasConns) removeConnections(connIds);
        }
      },
    ] : []),
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: Math.min(x, window.innerWidth - 180),
        top: Math.min(y, window.innerHeight - 300),
        background: '#fff',
        border: '1px solid #e5e5ea',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        zIndex: 9999,
        minWidth: 170,
        padding: '4px 0',
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} style={{ height: 1, background: '#f0f0f5', margin: '3px 0' }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              color: item.danger ? '#ff3b30' : '#1a1a2e',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f7')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span style={{ fontSize: 11, color: '#86868b', marginLeft: 16 }}>{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
};
