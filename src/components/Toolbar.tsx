import React, { useRef } from 'react';
import { useStore } from '../store';
import type { Tool } from '../types';

const ToolIcon: React.FC<{ tool: Tool; active: boolean; onClick: () => void; title: string; children: React.ReactNode }> = ({
  tool, active, onClick, title, children
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      background: active ? '#EBF2FF' : 'transparent',
      color: active ? '#0066CC' : '#86868b',
      transition: 'all 0.12s',
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      if (!active) (e.currentTarget as HTMLElement).style.background = '#f5f5f7';
    }}
    onMouseLeave={e => {
      if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
    }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: 1, height: 24, background: '#e5e5ea', margin: '0 4px', flexShrink: 0 }} />
);

const ZoomControl: React.FC = () => {
  const { canvas, setZoom, resetView, zoomToFit } = useStore();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => setZoom(canvas.zoom / 1.2)}
        style={{ ...iconBtnStyle, fontSize: 18, lineHeight: 1 }}
        title="Zoom out"
      >−</button>
      <button
        onClick={resetView}
        style={{
          minWidth: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e5ea',
          background: '#fafafa', cursor: 'pointer', fontSize: 12,
          fontFamily: 'Inter, sans-serif', color: '#1a1a2e', fontWeight: 500,
        }}
        title="Reset zoom"
      >
        {Math.round(canvas.zoom * 100)}%
      </button>
      <button
        onClick={() => setZoom(canvas.zoom * 1.2)}
        style={{ ...iconBtnStyle, fontSize: 18, lineHeight: 1 }}
        title="Zoom in"
      >+</button>
      <button
        onClick={zoomToFit}
        style={{ ...iconBtnStyle, fontSize: 11 }}
        title="Zoom to fit"
      >Fit</button>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e5ea',
  background: '#fafafa', cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', color: '#1a1a2e',
};

export const Toolbar: React.FC = () => {
  const {
    activeTool, setActiveTool, file, setFileName, newFile, exportJSON, importJSON,
    undo, redo, historyIndex, history,
    showGrid, showRuler, showProperties, showShapePanel,
    toggleGrid, toggleRuler, toggleProperties, toggleShapePanel,
    copy, paste, cut,
    groupShapes, ungroupShapes, selectedIds,
    alignShapes, distributeShapes,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: { tool: Tool; title: string; icon: React.ReactNode }[] = [
    {
      tool: 'select', title: 'Select (V)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 2l10 6-5 1-2 5z" stroke="currentColor" strokeWidth="1.5" fill={activeTool === 'select' ? '#0066CC' : 'none'} strokeLinejoin="round" />
        </svg>
      )
    },
    {
      tool: 'pan', title: 'Pan (H)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12M5 5l-3 3 3 3M11 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      tool: 'connect', title: 'Connect (C)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="13" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 5l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 11l1.5-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )
    },
    {
      tool: 'text', title: 'Text (T)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4h10M8 4v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    },
  ];

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importJSON(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{
      height: 52,
      background: '#ffffff',
      borderBottom: '1px solid #e5e5ea',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 4,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* File name */}
      <input
        value={file.name}
        onChange={e => setFileName(e.target.value)}
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          color: '#1a1a2e',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          width: 180,
          padding: '4px 6px',
          borderRadius: 6,
          cursor: 'text',
        }}
        onFocus={e => (e.currentTarget.style.background = '#f5f5f7')}
        onBlur={e => (e.currentTarget.style.background = 'transparent')}
      />

      <Divider />

      {/* File actions */}
      <ToolIcon tool="select" active={false} onClick={newFile} title="New file">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={() => fileInputRef.current?.click()} title="Open file">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 4a1 1 0 011-1h3l1.5 2H12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={exportJSON} title="Export JSON">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      <Divider />

      {/* Undo/redo */}
      <ToolIcon tool="select" active={false} onClick={undo} title="Undo (Ctrl+Z)">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M3 7.5A4.5 4.5 0 017.5 3h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 7.5L1 5M3 7.5L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 3A4.5 4.5 0 0112 7.5 4.5 4.5 0 017.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={redo} title="Redo (Ctrl+Y)">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M12 7.5A4.5 4.5 0 007.5 3H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 7.5L14 5M12 7.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 3A4.5 4.5 0 003 7.5 4.5 4.5 0 007.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>

      <Divider />

      {/* Tools */}
      {tools.map(t => (
        <ToolIcon
          key={t.tool}
          tool={t.tool}
          active={activeTool === t.tool}
          onClick={() => setActiveTool(t.tool)}
          title={t.title}
        >
          {t.icon}
        </ToolIcon>
      ))}

      <Divider />

      {/* Clipboard */}
      <ToolIcon tool="select" active={false} onClick={cut} title="Cut (Ctrl+X)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 8.5L9 2M10.5 8.5L5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={copy} title="Copy (Ctrl+C)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 9V3a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={paste} title="Paste (Ctrl+V)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="3" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </ToolIcon>

      <Divider />

      {/* View toggles */}
      <ToolIcon tool="select" active={showGrid} onClick={toggleGrid} title="Toggle grid">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 5h12M1 9h12M5 1v12M9 1v12" stroke="currentColor" strokeWidth="1" opacity={showGrid ? 1 : 0.4} />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={showShapePanel} onClick={toggleShapePanel} title="Toggle shape panel">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={showProperties} onClick={toggleProperties} title="Toggle properties panel">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4h10M2 7h10M2 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>

      <Divider />

      {/* Zoom */}
      <ZoomControl />
    </div>
  );
};
