import React, { useRef, useState, useEffect } from 'react';
import { useStore, EMBED_MAP_MODE } from '../store';
import { ProcessMapLibrary } from './ProcessMapLibrary';
import type { Tool } from '../types';

const ToolIcon: React.FC<{
  tool: Tool; active: boolean; onClick: () => void; title: string;
  disabled?: boolean; children: React.ReactNode;
}> = ({ active, onClick, title, disabled, children }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 8, border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: active ? '#EBF2FF' : 'transparent',
      color: disabled ? '#c7c7cc' : active ? '#0066CC' : '#86868b',
      transition: 'all 0.12s', flexShrink: 0,
    }}
    onMouseEnter={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = '#f5f5f7'; }}
    onMouseLeave={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: 1, height: 24, background: '#e5e5ea', margin: '0 4px', flexShrink: 0 }} />
);

// ── Alignment dropdown ──────────────────────────────────────────────────────────
interface AlignAction {
  label: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
  minSelected?: number;
}

const AlignDropdown: React.FC<{ selectedCount: number }> = ({ selectedCount }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { selectedIds, alignShapes, distributeShapes } = useStore();

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const disabled = selectedCount < 2;

  const rows: { label: string; actions: AlignAction[] }[] = [
    {
      label: 'Aliniere orizontală',
      actions: [
        {
          label: 'Stânga', title: 'Aliniază la stânga',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="1" width="1.5" height="16" fill="currentColor" rx=".75" />
            <rect x="4" y="3" width="9" height="3.5" rx="1" fill="currentColor" />
            <rect x="4" y="8" width="13" height="3.5" rx="1" fill="currentColor" />
            <rect x="4" y="13" width="6" height="3.5" rx="1" fill="currentColor" />
          </svg>,
          action: () => alignShapes(selectedIds, 'left'),
        },
        {
          label: 'Centru', title: 'Centrează orizontal',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="8.25" y="1" width="1.5" height="16" fill="currentColor" rx=".75" />
            <rect x="2.5" y="3" width="13" height="3.5" rx="1" fill="currentColor" />
            <rect x="4" y="8" width="10" height="3.5" rx="1" fill="currentColor" />
            <rect x="6" y="13" width="6" height="3.5" rx="1" fill="currentColor" />
          </svg>,
          action: () => alignShapes(selectedIds, 'center'),
        },
        {
          label: 'Dreapta', title: 'Aliniază la dreapta',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="14.5" y="1" width="1.5" height="16" fill="currentColor" rx=".75" />
            <rect x="5" y="3" width="9" height="3.5" rx="1" fill="currentColor" />
            <rect x="1" y="8" width="13" height="3.5" rx="1" fill="currentColor" />
            <rect x="8" y="13" width="6" height="3.5" rx="1" fill="currentColor" />
          </svg>,
          action: () => alignShapes(selectedIds, 'right'),
        },
      ],
    },
    {
      label: 'Aliniere verticală',
      actions: [
        {
          label: 'Sus', title: 'Aliniază la sus',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1.5" width="16" height="1.5" fill="currentColor" rx=".75" />
            <rect x="1" y="4" width="3.5" height="9" rx="1" fill="currentColor" />
            <rect x="7" y="4" width="3.5" height="12" rx="1" fill="currentColor" />
            <rect x="13" y="4" width="3.5" height="6" rx="1" fill="currentColor" />
          </svg>,
          action: () => alignShapes(selectedIds, 'top'),
        },
        {
          label: 'Mijloc', title: 'Centrează vertical',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="8.25" width="16" height="1.5" fill="currentColor" rx=".75" />
            <rect x="1" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
            <rect x="7" y="5" width="3.5" height="8" rx="1" fill="currentColor" />
            <rect x="13" y="6" width="3.5" height="6" rx="1" fill="currentColor" />
          </svg>,
          action: () => alignShapes(selectedIds, 'middle'),
        },
        {
          label: 'Jos', title: 'Aliniază la jos',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="15" width="16" height="1.5" fill="currentColor" rx=".75" />
            <rect x="1" y="5" width="3.5" height="9" rx="1" fill="currentColor" />
            <rect x="7" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
            <rect x="13" y="8" width="3.5" height="6" rx="1" fill="currentColor" />
          </svg>,
          action: () => alignShapes(selectedIds, 'bottom'),
        },
      ],
    },
    {
      label: 'Distribuire',
      actions: [
        {
          label: 'Orizontal', title: 'Distribuie orizontal (min 3)',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="1.5" height="16" fill="currentColor" rx=".75" />
            <rect x="15.5" y="1" width="1.5" height="16" fill="currentColor" rx=".75" />
            <rect x="4" y="5" width="3" height="8" rx="1" fill="currentColor" />
            <rect x="7.5" y="5" width="3" height="8" rx="1" fill="currentColor" />
            <rect x="11" y="5" width="3" height="8" rx="1" fill="currentColor" />
          </svg>,
          action: () => distributeShapes(selectedIds, 'horizontal'),
          minSelected: 3,
        },
        {
          label: 'Vertical', title: 'Distribuie vertical (min 3)',
          icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="1.5" fill="currentColor" rx=".75" />
            <rect x="1" y="15.5" width="16" height="1.5" fill="currentColor" rx=".75" />
            <rect x="5" y="4" width="8" height="3" rx="1" fill="currentColor" />
            <rect x="5" y="7.5" width="8" height="3" rx="1" fill="currentColor" />
            <rect x="5" y="11" width="8" height="3" rx="1" fill="currentColor" />
          </svg>,
          action: () => distributeShapes(selectedIds, 'vertical'),
          minSelected: 3,
        },
      ],
    },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        title={disabled ? 'Selectează cel puțin 2 elemente' : 'Aliniere și distribuire'}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          height: 32, padding: '0 8px', borderRadius: 8,
          border: '1px solid #e5e5ea', background: open ? '#EBF2FF' : '#fafafa',
          cursor: disabled ? 'default' : 'pointer',
          color: disabled ? '#c7c7cc' : open ? '#0066CC' : '#1a1a2e',
          fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
          transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
      >
        {/* Align icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="1.2" height="12" fill="currentColor" rx=".6" />
          <rect x="3" y="3" width="7" height="2.5" rx=".8" fill="currentColor" />
          <rect x="3" y="6.5" width="10" height="2.5" rx=".8" fill="currentColor" />
          <rect x="3" y="10" width="5" height="2.5" rx=".8" fill="currentColor" />
        </svg>
        Aliniere
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 9999,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12, width: 260,
        }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ marginBottom: ri < rows.length - 1 ? 12 : 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'Inter, sans-serif',
              }}>
                {row.label}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {row.actions.map((a, ai) => {
                  const isDisabled = selectedCount < (a.minSelected ?? 2);
                  return (
                    <button
                      key={ai}
                      onClick={() => { if (!isDisabled) { a.action(); setOpen(false); } }}
                      title={a.title}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        flex: 1, padding: '8px 4px', border: '1px solid #e2e8f0', borderRadius: 8,
                        background: '#fafafa', cursor: isDisabled ? 'default' : 'pointer',
                        color: isDisabled ? '#cbd5e1' : '#374151',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { if (!isDisabled) { (e.currentTarget as HTMLElement).style.background = '#eff6ff'; (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLElement).style.color = '#1d4ed8'; } }}
                      onMouseLeave={e => { if (!isDisabled) { (e.currentTarget as HTMLElement).style.background = '#fafafa'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#374151'; } }}
                    >
                      {a.icon}
                      <span style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                        {a.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {selectedCount < 2 && (
            <div style={{ marginTop: 8, padding: '6px 8px', background: '#fef9c3', borderRadius: 6, fontSize: 11, color: '#92400e', fontFamily: 'Inter, sans-serif' }}>
              Selectează cel puțin 2 elemente pentru aliniere (3 pentru distribuire).
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Zoom control ────────────────────────────────────────────────────────────────
const ZoomControl: React.FC = () => {
  const { canvas, setZoom, resetView, zoomToFit } = useStore();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button onClick={() => setZoom(canvas.zoom / 1.2)} style={{ ...iconBtnStyle, fontSize: 18, lineHeight: 1 }} title="Zoom out">−</button>
      <button onClick={resetView} style={{ minWidth: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e5ea', background: '#fafafa', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#1a1a2e', fontWeight: 500 }} title="Reset zoom">
        {Math.round(canvas.zoom * 100)}%
      </button>
      <button onClick={() => setZoom(canvas.zoom * 1.2)} style={{ ...iconBtnStyle, fontSize: 18, lineHeight: 1 }} title="Zoom in">+</button>
      <button onClick={zoomToFit} style={{ ...iconBtnStyle, fontSize: 11 }} title="Zoom to fit">Fit</button>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e5ea',
  background: '#fafafa', cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: '#1a1a2e',
};

// ── Save indicator ──────────────────────────────────────────────────────────────
const SaveIndicator: React.FC = () => {
  const { file, lastSavedAt } = useStore();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const isDirty = !lastSavedAt || file.updatedAt > lastSavedAt;
  void tick;
  if (isDirty) return (
    <span style={{ fontSize: 11, color: '#86868b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ color: '#FF9500', fontSize: 8 }}>●</span> Modificat
    </span>
  );
  const diffMs = Date.now() - new Date(lastSavedAt!).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const label = diffMin < 1 ? 'Salvat acum' : `Salvat ${diffMin}m`;
  return (
    <span style={{ fontSize: 11, color: '#34c759', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 10 }}>✓</span> {label}
    </span>
  );
};

// ── Main Toolbar ────────────────────────────────────────────────────────────────
export const Toolbar: React.FC = () => {
  const {
    activeTool, setActiveTool, file, setFileName, newFile, exportJSON, importJSON,
    undo, redo,
    showGrid, showProperties, showShapePanel,
    toggleGrid, toggleProperties, toggleShapePanel,
    copy, paste, cut,
    selectedIds,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: { tool: Tool; title: string; icon: React.ReactNode }[] = [
    {
      tool: 'select', title: 'Selectare (V)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 2l10 6-5 1-2 5z" stroke="currentColor" strokeWidth="1.5" fill={activeTool === 'select' ? '#0066CC' : 'none'} strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      tool: 'pan', title: 'Panoramare (H)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12M5 5l-3 3 3 3M11 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      tool: 'connect', title: 'Conectare (C)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="13" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 5l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      tool: 'text', title: 'Text (T)', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4h10M8 4v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => importJSON(ev.target?.result as string);
    reader.readAsText(f);
    e.target.value = '';
  };

  // Count only shapes (not connections) in selectedIds — align works on shapes
  const shapeCount = selectedIds.length;

  return (
    <div style={{
      height: 52, background: '#ffffff', borderBottom: '1px solid #e5e5ea',
      display: 'flex', alignItems: 'center', padding: '0 12px', gap: 4,
      flexShrink: 0, userSelect: 'none',
    }}>
      {/* File name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          value={file.name}
          onChange={e => setFileName(e.target.value)}
          style={{
            fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            color: '#1a1a2e', border: 'none', outline: 'none', background: 'transparent',
            width: 160, padding: '4px 6px', borderRadius: 6, cursor: 'text',
          }}
          onFocus={e => (e.currentTarget.style.background = '#f5f5f7')}
          onBlur={e => (e.currentTarget.style.background = 'transparent')}
        />
        <SaveIndicator />
      </div>

      <Divider />

      {/* File actions */}
      <ToolIcon tool="select" active={false} onClick={newFile} title="Fișier nou">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={() => fileInputRef.current?.click()} title="Deschide fișier">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 4a1 1 0 011-1h3l1.5 2H12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={exportJSON} title="Exportă JSON">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {EMBED_MAP_MODE && (
        <>
          <Divider />
          <ProcessMapLibrary />
        </>
      )}

      <Divider />

      {/* Undo/redo */}
      <ToolIcon tool="select" active={false} onClick={undo} title="Anulează (Ctrl+Z)">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M3 7.5A4.5 4.5 0 017.5 3h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 7.5L1 5M3 7.5L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 3A4.5 4.5 0 0112 7.5 4.5 4.5 0 017.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={redo} title="Refă (Ctrl+Y)">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M12 7.5A4.5 4.5 0 007.5 3H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 7.5L14 5M12 7.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 3A4.5 4.5 0 013 7.5 4.5 4.5 0 017.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>

      <Divider />

      {/* Drawing tools */}
      {tools.map(t => (
        <ToolIcon key={t.tool} tool={t.tool} active={activeTool === t.tool}
          onClick={() => setActiveTool(t.tool)} title={t.title}>
          {t.icon}
        </ToolIcon>
      ))}

      <Divider />

      {/* Clipboard */}
      <ToolIcon tool="select" active={false} onClick={cut} title="Decupează (Ctrl+X)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 8.5L9 2M10.5 8.5L5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={copy} title="Copiază (Ctrl+C)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 9V3a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={false} onClick={paste} title="Lipește (Ctrl+V)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="3" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </ToolIcon>

      <Divider />

      {/* ── Alignment dropdown ── */}
      <AlignDropdown selectedCount={shapeCount} />

      <Divider />

      {/* View toggles */}
      <ToolIcon tool="select" active={showGrid} onClick={toggleGrid} title="Grilă">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 5h12M1 9h12M5 1v12M9 1v12" stroke="currentColor" strokeWidth="1" opacity={showGrid ? 1 : 0.4} />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={showShapePanel} onClick={toggleShapePanel} title="Panou forme">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </ToolIcon>
      <ToolIcon tool="select" active={showProperties} onClick={toggleProperties} title="Panou proprietăți">
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
