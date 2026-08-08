import React, { useState } from 'react';
import { useStore } from '../store';
import { getShapePath } from './ShapeRenderer';
import type { ShapeType } from '../types';

interface ShapeCategory {
  name: string;
  icon: string;
  shapes: { type: ShapeType; label: string }[];
}

const categories: ShapeCategory[] = [
  {
    name: 'Basic',
    icon: '◻',
    shapes: [
      { type: 'rectangle', label: 'Rectangle' },
      { type: 'rounded-rectangle', label: 'Rounded' },
      { type: 'circle', label: 'Circle' },
      { type: 'ellipse', label: 'Ellipse' },
      { type: 'diamond', label: 'Diamond' },
      { type: 'triangle', label: 'Triangle' },
      { type: 'pentagon', label: 'Pentagon' },
      { type: 'hexagon', label: 'Hexagon' },
      { type: 'star', label: 'Star' },
      { type: 'parallelogram', label: 'Parallelogram' },
      { type: 'trapezoid', label: 'Trapezoid' },
    ],
  },
  {
    name: 'Flowchart',
    icon: '◇',
    shapes: [
      { type: 'terminal', label: 'Terminal' },
      { type: 'process', label: 'Process' },
      { type: 'decision', label: 'Decision' },
      { type: 'data', label: 'Data' },
      { type: 'document', label: 'Document' },
      { type: 'cylinder', label: 'Cylinder' },
      { type: 'cloud', label: 'Cloud' },
    ],
  },
  {
    name: 'Network Devices',
    icon: '⬡',
    shapes: [
      { type: 'router', label: 'Router' },
      { type: 'network-switch', label: 'Switch' },
      { type: 'firewall', label: 'Firewall' },
      { type: 'hub', label: 'Hub' },
      { type: 'access-point', label: 'Access Point' },
      { type: 'vpn-gateway', label: 'VPN Gateway' },
      { type: 'proxy', label: 'Proxy' },
      { type: 'load-balancer', label: 'Load Balancer' },
      { type: 'dns-server', label: 'DNS' },
    ],
  },
  {
    name: 'Servers',
    icon: '▣',
    shapes: [
      { type: 'server', label: 'Server' },
      { type: 'web-server', label: 'Web Server' },
      { type: 'app-server', label: 'App Server' },
      { type: 'db-server', label: 'DB Server' },
      { type: 'file-server', label: 'File Server' },
      { type: 'mail-server', label: 'Mail Server' },
    ],
  },
  {
    name: 'Storage & Data',
    icon: '🗃',
    shapes: [
      { type: 'database', label: 'Database' },
      { type: 'storage', label: 'Storage' },
      { type: 'data-warehouse', label: 'Data Warehouse' },
      { type: 'cache-store', label: 'Cache' },
      { type: 'message-queue', label: 'Message Queue' },
    ],
  },
  {
    name: 'Cloud & Internet',
    icon: '☁',
    shapes: [
      { type: 'internet', label: 'Internet' },
      { type: 'cloud', label: 'Cloud' },
      { type: 'cdn', label: 'CDN' },
      { type: 'api-gateway', label: 'API Gateway' },
    ],
  },
  {
    name: 'Applications',
    icon: '◈',
    shapes: [
      { type: 'microservice', label: 'Microservice' },
      { type: 'container', label: 'Container' },
      { type: 'component', label: 'Component' },
      { type: 'interface-box', label: 'Interface' },
    ],
  },
  {
    name: 'Client Devices',
    icon: '💻',
    shapes: [
      { type: 'workstation', label: 'Workstation' },
      { type: 'laptop', label: 'Laptop' },
      { type: 'mobile-device', label: 'Mobile' },
      { type: 'printer', label: 'Printer' },
    ],
  },
  {
    name: 'UML',
    icon: '⬜',
    shapes: [
      { type: 'rectangle', label: 'Class' },
      { type: 'rounded-rectangle', label: 'Use Case' },
      { type: 'actor', label: 'Actor' },
      { type: 'note', label: 'Note' },
      { type: 'swimlane', label: 'Swimlane' },
    ],
  },
  {
    name: 'Arrows',
    icon: '→',
    shapes: [
      { type: 'arrow-right', label: 'Right' },
      { type: 'arrow-left', label: 'Left' },
      { type: 'arrow-up', label: 'Up' },
      { type: 'arrow-down', label: 'Down' },
      { type: 'double-arrow', label: 'Both Ways' },
    ],
  },
  {
    name: 'Annotations',
    icon: '💬',
    shapes: [
      { type: 'callout', label: 'Callout' },
      { type: 'note', label: 'Note' },
      { type: 'text', label: 'Text' },
    ],
  },
  {
    name: 'Producție Amestecuri Solide',
    icon: '⚙',
    shapes: [
      { type: 'bag-dump-station', label: 'Stație descărcare saci' },
      { type: 'rotary-valve', label: 'Valvă rotativă' },
      { type: 'butterfly-valve', label: 'Valvă fluture' },
      { type: 'diverter-valve', label: 'Valvă divertor' },
      { type: 'guillotine-valve', label: 'Valvă ghilotină' },
      { type: 'pneumatic-pipe', label: 'Conductă pneumatică' },
      { type: 'vacuum-pump', label: 'Pompă de vid' },
      { type: 'filter', label: 'Filtru' },
      { type: 'vertical-mixer', label: 'Mixer vertical' },
      { type: 'horizontal-mixer', label: 'Mixer orizontal' },
      { type: 'separator', label: 'Separator' },
      { type: 'silo', label: 'Siloz' },
      { type: 'bag-packer', label: 'Mașină ambalat saci' },
      { type: 'conveyor', label: 'Conveior' },
      { type: 'robotic-palletizer', label: 'Braț robotic paletizare' },
      { type: 'bag-sealer', label: 'Mașină sigilare saci' },
      { type: 'pallet-conveyor', label: 'Conveior paleți' },
      { type: 'pallet', label: 'Palet' },
      { type: 'bagged-pallet', label: 'Palet cu saci' },
      { type: 'stretch-wrapper', label: 'Mașină înfoliat' },
    ],
  },
];

const ShapePreview: React.FC<{ type: ShapeType }> = ({ type }) => {
  const w = 44, h = 32;

  if (type === 'text') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central"
          fontSize={13} fontFamily="Inter, sans-serif" fill="#1a1a2e" fontStyle="italic">Aa</text>
      </svg>
    );
  }
  if (type === 'actor') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <circle cx={w / 2} cy={7} r={4.5} fill="none" stroke="#0066CC" strokeWidth={1.5} />
        <line x1={w / 2} y1={11.5} x2={w / 2} y2={22} stroke="#0066CC" strokeWidth={1.5} />
        <line x1={w / 2 - 7} y1={16} x2={w / 2 + 7} y2={16} stroke="#0066CC" strokeWidth={1.5} />
        <line x1={w / 2} y1={22} x2={w / 2 - 5} y2={30} stroke="#0066CC" strokeWidth={1.5} />
        <line x1={w / 2} y1={22} x2={w / 2 + 5} y2={30} stroke="#0066CC" strokeWidth={1.5} />
      </svg>
    );
  }

  const path = getShapePath(type, w, h);
  const strokeOnlyTypes = new Set(['router', 'hub', 'access-point', 'dns-server', 'internet', 'cdn', 'actor']);
  const isStrokeOnly = strokeOnlyTypes.has(type);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {type === 'firewall' ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill="#EBF2FF" stroke="#0066CC" strokeWidth={1.5} />
          <path d={path} fill="none" stroke="#0066CC" strokeWidth={0.8} opacity={0.6} />
        </>
      ) : isStrokeOnly ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill="#EBF2FF" stroke="none" />
          <path d={path} fill="none" stroke="#0066CC" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <path d={path} fill="#EBF2FF" stroke="#0066CC" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

export const ShapePanel: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Basic: true,
    Flowchart: true,
    'Network Devices': true,
    Servers: true,
  });
  const { setActiveTool, showShapePanel } = useStore();

  if (!showShapePanel) return null;

  const filtered = search.trim()
    ? categories.map(cat => ({
        ...cat,
        shapes: cat.shapes.filter(s => s.label.toLowerCase().includes(search.toLowerCase())),
      })).filter(cat => cat.shapes.length > 0)
    : categories;

  const handleDragStart = (e: React.DragEvent, type: ShapeType) => {
    e.dataTransfer.setData('shape-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={{
      width: 228,
      background: '#ffffff',
      borderRight: '1px solid #e5e5ea',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid #f0f0f5' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#86868b" strokeWidth="1.4" />
            <path d="M9.5 9.5L12 12" stroke="#86868b" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shapes..."
            style={{
              width: '100%',
              padding: '7px 10px 7px 28px',
              border: '1px solid #e5e5ea',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              background: '#f5f5f7',
              color: '#1a1a2e',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#0066CC')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e5ea')}
          />
        </div>
      </div>

      {/* Shape list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {filtered.map(cat => (
          <div key={cat.name}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [cat.name]: !prev[cat.name] }))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '5px 12px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 10.5, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.07em',
                userSelect: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{cat.icon}</span>
                {cat.name}
              </span>
              <span style={{
                fontSize: 8,
                transform: expanded[cat.name] || search ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s',
                display: 'inline-block',
              }}>▼</span>
            </button>

            {(expanded[cat.name] || search) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 4,
                padding: '2px 8px 6px',
              }}>
                {cat.shapes.map((shape, idx) => (
                  <div
                    key={`${shape.type}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, shape.type)}
                    onClick={() => setActiveTool(shape.type)}
                    title={shape.label}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      padding: '6px 2px 4px',
                      borderRadius: 8,
                      cursor: 'grab',
                      background: '#fafafa',
                      border: '1px solid #f0f0f5',
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#EBF2FF';
                      (e.currentTarget as HTMLElement).style.borderColor = '#0066CC40';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#fafafa';
                      (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f5';
                    }}
                  >
                    <ShapePreview type={shape.type} />
                    <span style={{
                      fontSize: 9.5, color: '#555', fontFamily: 'Inter, sans-serif',
                      textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word',
                    }}>
                      {shape.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
