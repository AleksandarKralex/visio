import React, { useState, useCallback } from 'react';
import { useStore } from './store';
import { Toolbar } from './components/Toolbar';
import { ShapePanel } from './components/ShapePanel';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PageTabs } from './components/PageTabs';
import { ContextMenu } from './components/ContextMenu';

const App: React.FC = () => {
  const { file, selectedIds } = useStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeIds: string[]; connIds: string[] } | null>(null);

  const page = file.pages.find(p => p.id === file.activePageId);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const shapeIds = selectedIds.filter(id => page?.shapes.find(s => s.id === id));
    const connIds = selectedIds.filter(id => page?.connections.find(c => c.id === id));
    setContextMenu({ x: e.clientX, y: e.clientY, shapeIds, connIds });
  }, [selectedIds, page]);

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
        <PropertiesPanel />
      </div>

      <PageTabs />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          shapeIds={contextMenu.shapeIds}
          connIds={contextMenu.connIds}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default App;
