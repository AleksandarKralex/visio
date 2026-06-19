import React, { useState } from 'react';
import { useStore } from '../store';
import type { DiagramShape, DiagramConnection } from '../types';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ fontSize: 11, color: '#86868b', fontWeight: 500, fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 4 }}>
    {children}
  </label>
);

const Row: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 8 }) => (
  <div style={{ display: 'flex', gap, alignItems: 'center' }}>{children}</div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid #f0f0f5' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
          color: '#1a1a2e',
        }}
      >
        {title}
        <span style={{ fontSize: 10 }}>{open ? '▼' : '▶'}</span>
      </button>
      {open && <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>}
    </div>
  );
};

const ColorPicker: React.FC<{ value: string; onChange: (v: string) => void; label?: string }> = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, border: '1.5px solid #e5e5ea', overflow: 'hidden', flexShrink: 0 }}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', top: -4, left: -4, width: 40, height: 40, border: 'none', cursor: 'pointer' }}
      />
    </div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        flex: 1, padding: '5px 8px', border: '1px solid #e5e5ea', borderRadius: 6,
        fontSize: 12, fontFamily: 'monospace', color: '#1a1a2e', background: '#fafafa',
      }}
    />
  </div>
);

const NumberInput: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }> = ({
  value, onChange, min, max, step = 1
}) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={e => onChange(Number(e.target.value))}
    style={{
      width: '100%', padding: '5px 8px', border: '1px solid #e5e5ea', borderRadius: 6,
      fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#1a1a2e', background: '#fafafa',
      boxSizing: 'border-box',
    }}
  />
);

const Select: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({
  value, onChange, options
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', padding: '5px 8px', border: '1px solid #e5e5ea', borderRadius: 6,
      fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#1a1a2e', background: '#fafafa',
      cursor: 'pointer',
    }}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const PropertiesPanel: React.FC = () => {
  const {
    file, selectedIds, showProperties, updateShape, updateConnection,
    removeShapes, removeConnections, duplicateShapes,
    bringToFront, sendToBack, bringForward, sendBackward,
    alignShapes, distributeShapes,
  } = useStore();

  if (!showProperties) return null;

  const page = file.pages.find(p => p.id === file.activePageId);
  if (!page) return null;

  const selectedShapes = page.shapes.filter(s => selectedIds.includes(s.id));
  const selectedConns = page.connections.filter(c => selectedIds.includes(c.id));
  const hasSelection = selectedShapes.length > 0 || selectedConns.length > 0;

  if (!hasSelection) {
    return (
      <div style={{
        width: 240,
        background: '#ffffff',
        borderLeft: '1px solid #e5e5ea',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ padding: '14px', borderBottom: '1px solid #f0f0f5' }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1a1a2e' }}>Properties</div>
        </div>
        <div style={{ padding: 14, color: '#86868b', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
          Select a shape or connection to edit its properties.
        </div>
      </div>
    );
  }

  const shape: DiagramShape | undefined = selectedShapes[0];
  const conn: DiagramConnection | undefined = selectedConns[0];

  return (
    <div style={{
      width: 240,
      background: '#ffffff',
      borderLeft: '1px solid #e5e5ea',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ padding: '14px', borderBottom: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1a1a2e' }}>
          {selectedIds.length > 1 ? `${selectedIds.length} Selected` : shape ? shape.type : 'Connection'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Multi-select actions */}
        {selectedShapes.length > 1 && (
          <Section title="Align">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {['left', 'center', 'right', 'top', 'middle', 'bottom'].map(d => (
                <button key={d} onClick={() => alignShapes(selectedIds, d as any)}
                  style={{
                    padding: '5px 4px', borderRadius: 6, border: '1px solid #e5e5ea',
                    background: '#fafafa', cursor: 'pointer', fontSize: 11,
                    fontFamily: 'Inter, sans-serif', color: '#1a1a2e',
                  }}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <Row>
              <button onClick={() => distributeShapes(selectedIds, 'horizontal')}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e5ea', background: '#fafafa', cursor: 'pointer', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                Distribute H
              </button>
              <button onClick={() => distributeShapes(selectedIds, 'vertical')}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e5ea', background: '#fafafa', cursor: 'pointer', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                Distribute V
              </button>
            </Row>
          </Section>
        )}

        {/* Shape properties */}
        {shape && (
          <>
            <Section title="Position & Size">
              <Row>
                <div style={{ flex: 1 }}>
                  <Label>X</Label>
                  <NumberInput value={Math.round(shape.x)} onChange={v => updateShape(shape.id, { x: v })} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Y</Label>
                  <NumberInput value={Math.round(shape.y)} onChange={v => updateShape(shape.id, { y: v })} />
                </div>
              </Row>
              <Row>
                <div style={{ flex: 1 }}>
                  <Label>W</Label>
                  <NumberInput value={Math.round(shape.width)} min={10} onChange={v => updateShape(shape.id, { width: v })} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>H</Label>
                  <NumberInput value={Math.round(shape.height)} min={10} onChange={v => updateShape(shape.id, { height: v })} />
                </div>
              </Row>
              <div>
                <Label>Rotation (°)</Label>
                <NumberInput value={shape.rotation} min={-360} max={360} onChange={v => updateShape(shape.id, { rotation: v })} />
              </div>
            </Section>

            <Section title="Fill & Stroke">
              <div>
                <Label>Fill Color</Label>
                <ColorPicker value={shape.style.fill} onChange={v => updateShape(shape.id, { style: { ...shape.style, fill: v } })} />
              </div>
              <div>
                <Label>Stroke Color</Label>
                <ColorPicker value={shape.style.stroke} onChange={v => updateShape(shape.id, { style: { ...shape.style, stroke: v } })} />
              </div>
              <div>
                <Label>Stroke Width</Label>
                <NumberInput value={shape.style.strokeWidth} min={0} max={20} step={0.5}
                  onChange={v => updateShape(shape.id, { style: { ...shape.style, strokeWidth: v } })} />
              </div>
              <div>
                <Label>Stroke Style</Label>
                <Select value={shape.style.strokeDasharray || 'solid'}
                  onChange={v => updateShape(shape.id, { style: { ...shape.style, strokeDasharray: v === 'solid' ? '' : v } })}
                  options={[
                    { value: 'solid', label: 'Solid' },
                    { value: '5 3', label: 'Dashed' },
                    { value: '2 2', label: 'Dotted' },
                    { value: '8 3 2 3', label: 'Dash-dot' },
                  ]}
                />
              </div>
              <div>
                <Label>Opacity</Label>
                <input type="range" min={0} max={1} step={0.05} value={shape.style.opacity}
                  onChange={e => updateShape(shape.id, { style: { ...shape.style, opacity: Number(e.target.value) } })}
                  style={{ width: '100%' }} />
              </div>
              <Row>
                <input type="checkbox" checked={shape.style.shadow}
                  onChange={e => updateShape(shape.id, { style: { ...shape.style, shadow: e.target.checked } })} />
                <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#1a1a2e' }}>Shadow</span>
              </Row>
            </Section>

            <Section title="Text">
              <div>
                <Label>Label</Label>
                <input
                  value={shape.label}
                  onChange={e => updateShape(shape.id, { label: e.target.value })}
                  style={{
                    width: '100%', padding: '5px 8px', border: '1px solid #e5e5ea', borderRadius: 6,
                    fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#1a1a2e', background: '#fafafa',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <Label>Font Size</Label>
                <NumberInput value={shape.textStyle.fontSize} min={6} max={72}
                  onChange={v => updateShape(shape.id, { textStyle: { ...shape.textStyle, fontSize: v } })} />
              </div>
              <div>
                <Label>Text Color</Label>
                <ColorPicker value={shape.textStyle.color}
                  onChange={v => updateShape(shape.id, { textStyle: { ...shape.textStyle, color: v } })} />
              </div>
              <Row>
                <div style={{ flex: 1 }}>
                  <Label>Align</Label>
                  <Select value={shape.textStyle.align}
                    onChange={v => updateShape(shape.id, { textStyle: { ...shape.textStyle, align: v as any } })}
                    options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Vertical</Label>
                  <Select value={shape.textStyle.verticalAlign}
                    onChange={v => updateShape(shape.id, { textStyle: { ...shape.textStyle, verticalAlign: v as any } })}
                    options={[{ value: 'top', label: 'Top' }, { value: 'middle', label: 'Mid' }, { value: 'bottom', label: 'Bot' }]}
                  />
                </div>
              </Row>
              <Row gap={6}>
                {(['bold', 'italic', 'underline'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => {
                      if (style === 'bold') updateShape(shape.id, { textStyle: { ...shape.textStyle, fontWeight: shape.textStyle.fontWeight === 'bold' ? 'normal' : 'bold' } });
                      if (style === 'italic') updateShape(shape.id, { textStyle: { ...shape.textStyle, fontStyle: shape.textStyle.fontStyle === 'italic' ? 'normal' : 'italic' } });
                      if (style === 'underline') updateShape(shape.id, { textStyle: { ...shape.textStyle, textDecoration: shape.textStyle.textDecoration === 'underline' ? 'none' : 'underline' } });
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e5ea',
                      background: (style === 'bold' && shape.textStyle.fontWeight === 'bold') ||
                        (style === 'italic' && shape.textStyle.fontStyle === 'italic') ||
                        (style === 'underline' && shape.textStyle.textDecoration === 'underline')
                        ? '#EBF2FF' : '#fafafa',
                      cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif',
                      fontWeight: style === 'bold' ? 'bold' : 'normal',
                      fontStyle: style === 'italic' ? 'italic' : 'normal',
                      textDecoration: style === 'underline' ? 'underline' : 'none',
                    }}
                  >
                    {style === 'bold' ? 'B' : style === 'italic' ? 'I' : 'U'}
                  </button>
                ))}
              </Row>
            </Section>

            <Section title="Order">
              <Row>
                <button onClick={() => bringToFront(selectedIds)} style={btnStyle}>Front</button>
                <button onClick={() => bringForward(selectedIds)} style={btnStyle}>Forward</button>
              </Row>
              <Row>
                <button onClick={() => sendBackward(selectedIds)} style={btnStyle}>Backward</button>
                <button onClick={() => sendToBack(selectedIds)} style={btnStyle}>Back</button>
              </Row>
            </Section>
          </>
        )}

        {/* Connection properties */}
        {conn && (
          <>
            <Section title="Connector Style">
              <div>
                <Label>Line Style</Label>
                <Select value={conn.style.lineStyle}
                  onChange={v => updateConnection(conn.id, { style: { ...conn.style, lineStyle: v as any } })}
                  options={[{ value: 'straight', label: 'Straight' }, { value: 'elbow', label: 'Elbow' }, { value: 'curved', label: 'Curved' }]}
                />
              </div>
              <div>
                <Label>Color</Label>
                <ColorPicker value={conn.style.stroke}
                  onChange={v => updateConnection(conn.id, { style: { ...conn.style, stroke: v } })} />
              </div>
              <div>
                <Label>Width</Label>
                <NumberInput value={conn.style.strokeWidth} min={0.5} max={10} step={0.5}
                  onChange={v => updateConnection(conn.id, { style: { ...conn.style, strokeWidth: v } })} />
              </div>
              <div>
                <Label>Stroke Style</Label>
                <Select value={conn.style.strokeDasharray || 'solid'}
                  onChange={v => updateConnection(conn.id, { style: { ...conn.style, strokeDasharray: v === 'solid' ? '' : v } })}
                  options={[{ value: 'solid', label: 'Solid' }, { value: '5 3', label: 'Dashed' }, { value: '2 2', label: 'Dotted' }]}
                />
              </div>
              <div>
                <Label>Start Arrow</Label>
                <Select value={conn.style.startArrow}
                  onChange={v => updateConnection(conn.id, { style: { ...conn.style, startArrow: v as any } })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'arrow', label: 'Arrow' },
                    { value: 'open', label: 'Open' },
                    { value: 'diamond', label: 'Diamond' },
                    { value: 'circle', label: 'Circle' },
                  ]}
                />
              </div>
              <div>
                <Label>End Arrow</Label>
                <Select value={conn.style.endArrow}
                  onChange={v => updateConnection(conn.id, { style: { ...conn.style, endArrow: v as any } })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'arrow', label: 'Arrow' },
                    { value: 'open', label: 'Open' },
                    { value: 'diamond', label: 'Diamond' },
                    { value: 'circle', label: 'Circle' },
                  ]}
                />
              </div>
            </Section>

            <Section title="Label">
              <input
                value={conn.label}
                onChange={e => updateConnection(conn.id, { label: e.target.value })}
                placeholder="Add label..."
                style={{
                  width: '100%', padding: '5px 8px', border: '1px solid #e5e5ea', borderRadius: 6,
                  fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#1a1a2e', background: '#fafafa',
                  boxSizing: 'border-box',
                }}
              />
            </Section>
          </>
        )}

        {/* Actions */}
        <Section title="Actions">
          <Row>
            <button
              onClick={() => { if (selectedShapes.length) duplicateShapes(selectedIds); }}
              style={btnStyle}
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                if (selectedShapes.length) removeShapes(selectedIds);
                if (selectedConns.length) removeConnections(selectedIds);
              }}
              style={{ ...btnStyle, color: '#ff3b30', borderColor: '#ff3b3040' }}
            >
              Delete
            </button>
          </Row>
        </Section>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #e5e5ea',
  background: '#fafafa',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  color: '#1a1a2e',
};
