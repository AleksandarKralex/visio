import React, { useState } from 'react';
import { useStore } from '../store';

export const PageTabs: React.FC = () => {
  const { file, addPage, removePage, renamePage, setActivePage, duplicatePage } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renamePage(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pageId });
  };

  return (
    <div
      style={{
        height: 40,
        background: '#f5f5f7',
        borderTop: '1px solid #e5e5ea',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 8px',
        gap: 2,
        flexShrink: 0,
        position: 'relative',
      }}
      onClick={() => setContextMenu(null)}
    >
      {file.pages.map(page => (
        <div
          key={page.id}
          onContextMenu={(e) => handleContextMenu(e, page.id)}
          onDoubleClick={() => {
            setEditingId(page.id);
            setEditValue(page.name);
          }}
          onClick={() => setActivePage(page.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 12px',
            height: 34,
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            background: file.activePageId === page.id ? '#ffffff' : 'transparent',
            border: file.activePageId === page.id ? '1px solid #e5e5ea' : '1px solid transparent',
            borderBottom: file.activePageId === page.id ? '1px solid #ffffff' : '1px solid transparent',
            marginBottom: file.activePageId === page.id ? -1 : 0,
            transition: 'all 0.12s',
          }}
        >
          {editingId === page.id ? (
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: 12, fontFamily: 'Inter, sans-serif',
                border: 'none', outline: 'none', background: 'transparent',
                width: 80, color: '#1a1a2e',
              }}
            />
          ) : (
            <span style={{
              fontSize: 12, fontFamily: 'Inter, sans-serif',
              color: file.activePageId === page.id ? '#1a1a2e' : '#86868b',
              fontWeight: file.activePageId === page.id ? 500 : 400,
              whiteSpace: 'nowrap',
            }}>
              {page.name}
            </span>
          )}

          {file.pages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: 4, border: 'none',
                background: 'transparent', cursor: 'pointer', color: '#86868b',
                fontSize: 14, lineHeight: 1, padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ff3b3020')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* Add page button */}
      <button
        onClick={addPage}
        title="Add page"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 6, border: '1px dashed #c7c7cc',
          background: 'transparent', cursor: 'pointer', color: '#86868b',
          fontSize: 18, lineHeight: 1, alignSelf: 'center', marginLeft: 4,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = '#e5e5ea';
          (e.currentTarget as HTMLElement).style.color = '#1a1a2e';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = '#86868b';
        }}
      >
        +
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#fff',
            border: '1px solid #e5e5ea',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 9999,
            minWidth: 160,
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Rename', action: () => { setEditingId(contextMenu.pageId); setEditValue(file.pages.find(p => p.id === contextMenu.pageId)?.name ?? ''); } },
            { label: 'Duplicate', action: () => duplicatePage(contextMenu.pageId) },
            { label: 'Delete', action: () => removePage(contextMenu.pageId), danger: true },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { item.action(); setContextMenu(null); }}
              style={{
                display: 'block', width: '100%', padding: '9px 16px', textAlign: 'left',
                border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: 'Inter, sans-serif',
                color: item.danger ? '#ff3b30' : '#1a1a2e',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
