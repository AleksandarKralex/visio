import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from './store';
import { IS_EMBEDDED, EMBED_MAP_MODE, apiSaveDiagram } from './store';
import { Toolbar } from './components/Toolbar';
import { ShapePanel } from './components/ShapePanel';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PageTabs } from './components/PageTabs';
import { ContextMenu } from './components/ContextMenu';
import { QualyProPanel } from './components/QualyProPanel';

const AUTO_SAVE_INTERVAL_MS = 30 * 1000; // 30 seconds when embedded, 5 min otherwise

const App: React.FC = () => {
  const { file, selectedIds, loadEmbedDiagram, embedLoading } = useStore();

  // Load diagram from QualyPro API on mount (embed mode only)
  useEffect(() => {
    if (IS_EMBEDDED) loadEmbedDiagram();
  }, []);

  // Auto-save
  useEffect(() => {
    const tick = () => {
      const { file, lastSavedAt, autoSave } = useStore.getState();
      if (!lastSavedAt || file.updatedAt > lastSavedAt) {
        autoSave();
      }
    };
    const interval = IS_EMBEDDED ? AUTO_SAVE_INTERVAL_MS : 5 * 60 * 1000;
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, []);

  // Save on page unload when embedded
  useEffect(() => {
    if (!IS_EMBEDDED) return;
    const onUnload = () => {
      const { file, mapFileId } = useStore.getState();
      apiSaveDiagram(file, mapFileId);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeIds: string[]; connIds: string[] } | null>(null);

  const page = file.pages.find(p => p.id === file.activePageId);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const shapeIds = selectedIds.filter(id => page?.shapes.find(s => s.id === id));
    const connIds = selectedIds.filter(id => page?.connections.find(c => c.id === id));
    setContextMenu({ x: e.clientX, y: e.clientY, shapeIds, connIds });
  }, [selectedIds, page]);

  if (embedLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100vw', background: '#f5f5f7',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#64748b', fontSize: 14,
      }}>
        <div style={{ textAlign: 'center', gap: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Se încarcă diagrama...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        background: '#f5f5f7',
      }}
      onContextMenu={handleContextMenu}
    >
      <Toolbar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ShapePanel />
        <Canvas />
        {IS_EMBEDDED && EMBED_MAP_MODE
          ? <QualyProPanel mode="raci" />
          : <PropertiesPanel />
        }
      </div>

      {!IS_EMBEDDED && <PageTabs />}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          shapeIds={contextMenu.shapeIds}
          connIds={contextMenu.connIds}
          onClose={() => setContextMenu(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default App;
