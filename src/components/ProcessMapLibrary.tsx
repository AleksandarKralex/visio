import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { apiListProcessMaps, type ProcessMapMeta } from '../store';

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

export const ProcessMapLibrary: React.FC = () => {
  const { mapFileId, file, openProcessMap, saveProcessMapAs } = useStore();
  const [open, setOpen] = useState(false);
  const [maps, setMaps] = useState<ProcessMapMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowSaveAs(false); }
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const refresh = () => {
    setLoading(true);
    apiListProcessMaps().then(list => { setMaps(list); setLoading(false); });
  };

  const toggle = () => {
    if (!open) refresh();
    setOpen(o => !o);
    setShowSaveAs(false);
  };

  const handleOpen = async (id: string) => {
    await openProcessMap(id);
    setOpen(false);
  };

  const handleSaveAs = async () => {
    const name = saveAsName.trim();
    if (!name) return;
    await saveProcessMapAs(name);
    setShowSaveAs(false);
    setSaveAsName('');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={toggle}
        title="Bibliotecă hărți"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 32, padding: '0 10px', borderRadius: 8,
          border: '1px solid #e5e5ea', background: open ? '#EBF2FF' : '#fafafa',
          cursor: 'pointer', color: open ? '#0066CC' : '#1a1a2e',
          fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
          transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 4a1 1 0 011-1h3l1.5 2H12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Bibliotecă
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 9999,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 300,
          display: 'flex', flexDirection: 'column', maxHeight: 420,
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
            Hărți salvate
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && <div style={{ padding: 14, fontSize: 12, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Se încarcă…</div>}
            {!loading && maps.length === 0 && (
              <div style={{ padding: 14, fontSize: 12, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Nicio hartă salvată încă.</div>
            )}
            {!loading && maps.map(m => (
              <button
                key={m.id}
                onClick={() => handleOpen(m.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                  border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                  background: m.id === mapFileId ? '#eff6ff' : 'transparent',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => { if (m.id !== mapFileId) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (m.id !== mapFileId) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>
                  {m.name} {m.id === mapFileId && <span style={{ fontSize: 10, color: '#0066CC', fontWeight: 700 }}>· deschisă</span>}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {formatUpdatedAt(m.updatedAt)}{m.createdBy?.name ? ` · ${m.createdBy.name}` : ''}
                </div>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', padding: 10 }}>
            {!showSaveAs ? (
              <button
                onClick={() => { setSaveAsName(file.name); setShowSaveAs(true); }}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px dashed #cbd5e1',
                  background: '#fafafa', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  color: '#475569', fontFamily: 'Inter, sans-serif',
                }}
              >
                + Salvează ca hartă nouă
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  autoFocus
                  value={saveAsName}
                  onChange={e => setSaveAsName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveAs(); if (e.key === 'Escape') setShowSaveAs(false); }}
                  placeholder="Nume hartă…"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleSaveAs} disabled={!saveAsName.trim()} style={{
                    flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none',
                    background: saveAsName.trim() ? '#0066CC' : '#cbd5e1', color: '#fff',
                    cursor: saveAsName.trim() ? 'pointer' : 'default', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  }}>
                    Salvează
                  </button>
                  <button onClick={() => setShowSaveAs(false)} style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
                    background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontFamily: 'Inter, sans-serif',
                  }}>
                    Anulează
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
