import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { EMBED_PROCESS_ID } from '../store';
import type { QualyProMeta } from '../types';

interface QProcess {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
  raci: {
    R: { id: string; name: string }[];
    A: { id: string; name: string }[];
    C: { id: string; name: string }[];
    I: { id: string; name: string }[];
  };
}

interface Props {
  mode: 'raci' | 'info';
}

const RACI_COLORS: Record<string, string> = {
  R: '#3b82f6', A: '#8b5cf6', C: '#f59e0b', I: '#10b981',
};

export const QualyProPanel: React.FC<Props> = ({ mode }) => {
  const { file, raciPersonFilter, setRaciPersonFilter, addShape, updateShape } = useStore();
  const [processes, setProcesses] = useState<QProcess[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'processes' | 'raci'>(mode === 'raci' ? 'raci' : 'processes');

  useEffect(() => {
    fetch('/qualypro/api/processes/map-data', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProcesses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Collect all people from processes
  const allPeople = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; roles: Record<string, string[]> }>();
    for (const p of processes) {
      const add = (role: string, people: { id: string; name: string }[]) => {
        for (const u of people) {
          if (!map.has(u.id)) map.set(u.id, { id: u.id, name: u.name, roles: {} });
          const entry = map.get(u.id)!;
          if (!entry.roles[role]) entry.roles[role] = [];
          if (!entry.roles[role].includes(p.name)) entry.roles[role].push(p.name);
        }
      };
      add('R', p.raci.R); add('A', p.raci.A); add('C', p.raci.C); add('I', p.raci.I);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [processes]);

  // Which processes match selected person + which roles
  const filteredProcesses = React.useMemo(() => {
    if (!raciPersonFilter) return [];
    return processes.map(p => {
      const roles: string[] = [];
      if (p.raci.R.some(u => u.id === raciPersonFilter)) roles.push('R');
      if (p.raci.A.some(u => u.id === raciPersonFilter)) roles.push('A');
      if (p.raci.C.some(u => u.id === raciPersonFilter)) roles.push('C');
      if (p.raci.I.some(u => u.id === raciPersonFilter)) roles.push('I');
      return roles.length ? { ...p, myRoles: roles } : null;
    }).filter(Boolean) as (QProcess & { myRoles: string[] })[];
  }, [raciPersonFilter, processes]);

  // Drag from panel to canvas
  const handleDragStart = (e: React.DragEvent, proc: QProcess) => {
    e.dataTransfer.setData('application/qualypro-process', JSON.stringify(proc));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Add process shape to center of canvas when clicked
  const addProcessShape = (proc: QProcess) => {
    const meta: QualyProMeta = {
      processId: proc.id, processName: proc.name,
      processCode: proc.code, category: proc.category, raci: proc.raci,
    };
    const canvas = useStore.getState().canvas;
    const cx = (600 - canvas.panX) / canvas.zoom;
    const cy = (300 - canvas.panY) / canvas.zoom;
    const id = addShape('rounded-rectangle', cx - 80, cy - 30, 160, 60);
    setTimeout(() => {
      updateShape(id, {
        label: `▶ ${proc.code}\n${proc.name}`,
        qualypro: meta,
        style: {
          fill: '#eff6ff',
          stroke: '#3b82f6',
          strokeWidth: 2,
          strokeDasharray: '',
          opacity: 1,
          shadow: false,
          cornerRadius: 8,
        },
      });
    }, 10);
  };

  const panelStyle: React.CSSProperties = {
    width: 260,
    minWidth: 260,
    background: '#fff',
    borderLeft: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontSize: 12,
  };

  const tabs = mode === 'raci'
    ? [{ key: 'raci', label: 'Filtru RACI' }, { key: 'processes', label: 'Procese' }]
    : [{ key: 'processes', label: 'Procese QP' }];

  const searchedProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPerson = allPeople.find(p => p.id === raciPersonFilter);

  return (
    <div style={panelStyle}>
      {/* Tab header */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', fontSize: 11,
              fontWeight: activeTab === t.key ? 700 : 400,
              color: activeTab === t.key ? '#3b82f6' : '#64748b',
              background: activeTab === t.key ? '#eff6ff' : 'transparent',
              borderBottom: activeTab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>
          Se încarcă procesele...
        </div>
      )}

      {/* RACI filter tab */}
      {activeTab === 'raci' && !loading && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ padding: '8px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Filtrează după persoană
            </div>
            <select
              value={raciPersonFilter ?? ''}
              onChange={e => setRaciPersonFilter(e.target.value || null)}
              style={{ width: '100%', padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, background: '#fff' }}
            >
              <option value="">— Toate persoanele —</option>
              {allPeople.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPerson && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{selectedPerson.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {Object.entries(selectedPerson.roles).map(([role, procs]) => (
                  <span key={role} style={{
                    padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: RACI_COLORS[role] + '20', color: RACI_COLORS[role],
                  }}>
                    {role}: {procs.length} proces{procs.length !== 1 ? 'e' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {raciPersonFilter ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {filteredProcesses.length === 0 && (
                <div style={{ padding: 12, color: '#94a3b8', textAlign: 'center' }}>
                  Persoana nu apare în niciun proces.
                </div>
              )}
              {filteredProcesses.map(p => (
                <div key={p.id} style={{
                  padding: '8px 10px', borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 3, lineHeight: 1.3 }}>
                    <span style={{ fontSize: 10, color: '#64748b', marginRight: 4 }}>{p.code}</span>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.myRoles.map(role => (
                      <span key={role} style={{
                        padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: RACI_COLORS[role] + '20', color: RACI_COLORS[role],
                      }}>
                        {role === 'R' ? 'Responsabil' : role === 'A' ? 'Accountable' : role === 'C' ? 'Consultat' : 'Informat'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '10px', fontSize: 11, color: '#94a3b8' }}>
                Selectează o persoană pentru a vedea procesele sale RACI.
              </div>
              {/* Show legend */}
              <div style={{ padding: '0 10px 10px' }}>
                {(['R','A','C','I'] as const).map(role => (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, background: RACI_COLORS[role] + '20', color: RACI_COLORS[role],
                    }}>{role}</span>
                    <span style={{ color: '#475569', fontSize: 11 }}>
                      {role === 'R' ? 'Responsabil — execută' : role === 'A' ? 'Accountable — răspunde' : role === 'C' ? 'Consultat — are input' : 'Informat — e notificat'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processes tab */}
      {activeTab === 'processes' && !loading && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută proces..."
              style={{ width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {!EMBED_PROCESS_ID && (
              <div style={{ padding: '8px 10px', fontSize: 10, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                Trage un proces pe canvas sau click pentru a-l adăuga
              </div>
            )}
            {searchedProcesses.map(proc => (
              <div key={proc.id}
                draggable={!EMBED_PROCESS_ID}
                onDragStart={e => handleDragStart(e, proc)}
                onClick={() => !EMBED_PROCESS_ID && addProcessShape(proc)}
                style={{
                  padding: '8px 10px', borderBottom: '1px solid #f1f5f9',
                  cursor: EMBED_PROCESS_ID ? 'default' : 'grab',
                  transition: 'background 0.15s',
                  background: proc.id === EMBED_PROCESS_ID ? '#eff6ff' : 'transparent',
                }}
                onMouseEnter={e => { if (!EMBED_PROCESS_ID) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!EMBED_PROCESS_ID) e.currentTarget.style.background = proc.id === EMBED_PROCESS_ID ? '#eff6ff' : ''; }}
              >
                <div style={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.3, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 4 }}>{proc.code}</span>
                  {proc.name}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {proc.category && (
                    <span style={{ fontSize: 9, color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                      {proc.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {searchedProcesses.length === 0 && (
              <div style={{ padding: 12, color: '#94a3b8', textAlign: 'center', fontSize: 11 }}>
                Niciun proces găsit
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
