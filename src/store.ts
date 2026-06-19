import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  DiagramFile, Page, DiagramShape, DiagramConnection,
  Tool, CanvasState, ShapeStyle, TextStyle, ShapeType
} from './types';

const defaultTextStyle: TextStyle = {
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#1a1a2e',
  align: 'center',
  verticalAlign: 'middle',
};

const defaultShapeStyle: ShapeStyle = {
  fill: '#ffffff',
  stroke: '#0066CC',
  strokeWidth: 1.5,
  strokeDasharray: '',
  opacity: 1,
  shadow: false,
  cornerRadius: 4,
};

function createDefaultPage(): Page {
  return {
    id: uuidv4(),
    name: 'Page 1',
    shapes: [],
    connections: [],
    background: '#ffffff',
    grid: true,
    gridSize: 20,
    snapToGrid: true,
  };
}

function createDefaultFile(): DiagramFile {
  const page = createDefaultPage();
  return {
    id: uuidv4(),
    name: 'Untitled Diagram',
    pages: [page],
    activePageId: page.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface HistoryEntry {
  pages: Page[];
  activePageId: string;
}

interface AppState {
  file: DiagramFile;
  activeTool: Tool;
  selectedIds: string[];
  canvas: CanvasState;
  history: HistoryEntry[];
  historyIndex: number;
  clipboard: (DiagramShape | DiagramConnection)[];
  showGrid: boolean;
  showRuler: boolean;
  showProperties: boolean;
  showShapePanel: boolean;
  connectingFrom: string | null;

  // File actions
  setFileName: (name: string) => void;
  newFile: () => void;
  exportJSON: () => void;
  importJSON: (json: string) => void;

  // Page actions
  addPage: () => void;
  removePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  setActivePage: (id: string) => void;
  duplicatePage: (id: string) => void;

  // Shape actions
  addShape: (type: ShapeType, x: number, y: number, w?: number, h?: number) => string;
  updateShape: (id: string, updates: Partial<DiagramShape>) => void;
  removeShapes: (ids: string[]) => void;
  duplicateShapes: (ids: string[]) => void;

  // Connection actions
  addConnection: (sourceId: string, targetId: string, sx?: number, sy?: number, tx?: number, ty?: number) => void;
  updateConnection: (id: string, updates: Partial<DiagramConnection>) => void;
  removeConnections: (ids: string[]) => void;

  // Selection
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Tool
  setActiveTool: (tool: Tool) => void;

  // Canvas
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  zoomToFit: () => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Clipboard
  copy: () => void;
  paste: () => void;
  cut: () => void;

  // UI toggles
  toggleGrid: () => void;
  toggleRuler: () => void;
  toggleProperties: () => void;
  toggleShapePanel: () => void;

  // Connect mode
  setConnectingFrom: (id: string | null) => void;

  // Z-order
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;

  // Group
  groupShapes: (ids: string[]) => void;
  ungroupShapes: (groupId: string) => void;

  // Align
  alignShapes: (ids: string[], direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeShapes: (ids: string[], direction: 'horizontal' | 'vertical') => void;

  // Page settings
  updatePageSettings: (settings: Partial<Page>) => void;
}

function getActivePage(file: DiagramFile): Page {
  return file.pages.find(p => p.id === file.activePageId) || file.pages[0];
}

function updateActivePage(file: DiagramFile, updater: (page: Page) => Page): DiagramFile {
  return {
    ...file,
    updatedAt: new Date().toISOString(),
    pages: file.pages.map(p =>
      p.id === file.activePageId ? updater(p) : p
    ),
  };
}

export const useStore = create<AppState>((set, get) => ({
  file: createDefaultFile(),
  activeTool: 'select',
  selectedIds: [],
  canvas: { zoom: 1, panX: 0, panY: 0 },
  history: [],
  historyIndex: -1,
  clipboard: [],
  showGrid: true,
  showRuler: true,
  showProperties: true,
  showShapePanel: true,
  connectingFrom: null,

  setFileName: (name) => set(s => ({ file: { ...s.file, name } })),

  newFile: () => {
    const file = createDefaultFile();
    set({ file, selectedIds: [], history: [], historyIndex: -1 });
  },

  exportJSON: () => {
    const { file } = get();
    const json = JSON.stringify(file, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON: (json) => {
    try {
      const file = JSON.parse(json) as DiagramFile;
      set({ file, selectedIds: [], history: [], historyIndex: -1 });
    } catch (e) {
      console.error('Invalid JSON file');
    }
  },

  addPage: () => {
    get().pushHistory();
    const page = createDefaultPage();
    page.name = `Page ${get().file.pages.length + 1}`;
    set(s => ({
      file: {
        ...s.file,
        pages: [...s.file.pages, page],
        activePageId: page.id,
      },
    }));
  },

  removePage: (id) => {
    const { file } = get();
    if (file.pages.length === 1) return;
    get().pushHistory();
    const newPages = file.pages.filter(p => p.id !== id);
    const newActive = file.activePageId === id
      ? newPages[Math.max(0, file.pages.findIndex(p => p.id === id) - 1)].id
      : file.activePageId;
    set(s => ({ file: { ...s.file, pages: newPages, activePageId: newActive } }));
  },

  renamePage: (id, name) => {
    set(s => ({
      file: { ...s.file, pages: s.file.pages.map(p => p.id === id ? { ...p, name } : p) },
    }));
  },

  setActivePage: (id) => set(s => ({ file: { ...s.file, activePageId: id }, selectedIds: [] })),

  duplicatePage: (id) => {
    get().pushHistory();
    const page = get().file.pages.find(p => p.id === id);
    if (!page) return;
    const newPage: Page = {
      ...page,
      id: uuidv4(),
      name: `${page.name} (Copy)`,
      shapes: page.shapes.map(s => ({ ...s, id: uuidv4() })),
      connections: [],
    };
    set(s => ({
      file: {
        ...s.file,
        pages: [...s.file.pages, newPage],
        activePageId: newPage.id,
      },
    }));
  },

  addShape: (type, x, y, w, h) => {
    get().pushHistory();
    const id = uuidv4();
    const defaults: Record<string, { w: number; h: number; label: string }> = {
      // Basic
      rectangle: { w: 120, h: 80, label: 'Rectangle' },
      'rounded-rectangle': { w: 120, h: 80, label: 'Process' },
      circle: { w: 80, h: 80, label: 'Circle' },
      ellipse: { w: 120, h: 80, label: 'Ellipse' },
      diamond: { w: 100, h: 80, label: 'Decision' },
      triangle: { w: 100, h: 90, label: 'Triangle' },
      pentagon: { w: 100, h: 90, label: 'Pentagon' },
      hexagon: { w: 120, h: 80, label: 'Hexagon' },
      star: { w: 100, h: 100, label: 'Star' },
      parallelogram: { w: 120, h: 70, label: 'Data' },
      trapezoid: { w: 120, h: 70, label: 'Manual Input' },
      cylinder: { w: 80, h: 100, label: 'Database' },
      cloud: { w: 140, h: 100, label: 'Cloud' },
      // Flowchart
      process: { w: 120, h: 60, label: 'Process' },
      decision: { w: 120, h: 80, label: 'Decision' },
      terminal: { w: 120, h: 50, label: 'Start/End' },
      document: { w: 120, h: 80, label: 'Document' },
      data: { w: 120, h: 70, label: 'Data' },
      database: { w: 80, h: 100, label: 'Database' },
      // Arrows
      'arrow-right': { w: 120, h: 50, label: '' },
      'arrow-left': { w: 120, h: 50, label: '' },
      'arrow-up': { w: 50, h: 120, label: '' },
      'arrow-down': { w: 50, h: 120, label: '' },
      'double-arrow': { w: 140, h: 50, label: '' },
      // Annotations
      callout: { w: 140, h: 100, label: 'Note' },
      note: { w: 120, h: 100, label: 'Note' },
      actor: { w: 60, h: 100, label: 'Actor' },
      swimlane: { w: 600, h: 200, label: 'Swimlane' },
      text: { w: 150, h: 40, label: 'Text' },
      image: { w: 120, h: 80, label: '' },
      // Network devices
      router: { w: 100, h: 100, label: 'Router' },
      'network-switch': { w: 120, h: 80, label: 'Switch' },
      firewall: { w: 120, h: 80, label: 'Firewall' },
      hub: { w: 100, h: 100, label: 'Hub' },
      'access-point': { w: 100, h: 100, label: 'Access Point' },
      'vpn-gateway': { w: 90, h: 110, label: 'VPN Gateway' },
      proxy: { w: 120, h: 80, label: 'Proxy' },
      'load-balancer': { w: 120, h: 80, label: 'Load Balancer' },
      'dns-server': { w: 90, h: 90, label: 'DNS' },
      // Servers
      server: { w: 160, h: 100, label: 'Server' },
      'web-server': { w: 160, h: 100, label: 'Web Server' },
      'app-server': { w: 160, h: 100, label: 'App Server' },
      'db-server': { w: 160, h: 100, label: 'DB Server' },
      'file-server': { w: 160, h: 100, label: 'File Server' },
      'mail-server': { w: 160, h: 100, label: 'Mail Server' },
      // Storage & data
      storage: { w: 80, h: 100, label: 'Storage' },
      'data-warehouse': { w: 120, h: 100, label: 'Data Warehouse' },
      'cache-store': { w: 90, h: 90, label: 'Cache' },
      'message-queue': { w: 120, h: 100, label: 'Message Queue' },
      // Cloud & internet
      internet: { w: 100, h: 100, label: 'Internet' },
      cdn: { w: 120, h: 100, label: 'CDN' },
      'api-gateway': { w: 120, h: 80, label: 'API Gateway' },
      // Applications
      microservice: { w: 100, h: 100, label: 'Microservice' },
      container: { w: 130, h: 90, label: 'Container' },
      component: { w: 130, h: 80, label: 'Component' },
      'interface-box': { w: 100, h: 80, label: 'Interface' },
      // Client devices
      workstation: { w: 110, h: 100, label: 'Workstation' },
      laptop: { w: 120, h: 90, label: 'Laptop' },
      'mobile-device': { w: 70, h: 120, label: 'Mobile' },
      printer: { w: 110, h: 90, label: 'Printer' },
    };
    const d = defaults[type] || { w: 120, h: 80, label: type };
    const shape: DiagramShape = {
      id,
      type,
      x,
      y,
      width: w ?? d.w,
      height: h ?? d.h,
      label: d.label,
      style: { ...defaultShapeStyle },
      textStyle: { ...defaultTextStyle },
      rotation: 0,
      locked: false,
      zIndex: get().file.pages.find(p => p.id === get().file.activePageId)?.shapes.length ?? 0,
    };
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: [...page.shapes, shape],
      })),
      selectedIds: [id],
    }));
    return id;
  },

  updateShape: (id, updates) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh => sh.id === id ? { ...sh, ...updates } : sh),
      })),
    }));
  },

  removeShapes: (ids) => {
    get().pushHistory();
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.filter(sh => !ids.includes(sh.id)),
        connections: page.connections.filter(
          c => !ids.includes(c.sourceId) && !ids.includes(c.targetId)
        ),
      })),
      selectedIds: s.selectedIds.filter(id => !ids.includes(id)),
    }));
  },

  duplicateShapes: (ids) => {
    get().pushHistory();
    const page = getActivePage(get().file);
    const newIds: string[] = [];
    const newShapes = ids.flatMap(id => {
      const sh = page.shapes.find(s => s.id === id);
      if (!sh) return [];
      const newId = uuidv4();
      newIds.push(newId);
      return [{ ...sh, id: newId, x: sh.x + 20, y: sh.y + 20 }];
    });
    set(s => ({
      file: updateActivePage(s.file, p => ({ ...p, shapes: [...p.shapes, ...newShapes] })),
      selectedIds: newIds,
    }));
  },

  addConnection: (sourceId, targetId, sx, sy, tx, ty) => {
    get().pushHistory();
    const id = uuidv4();
    const conn: DiagramConnection = {
      id,
      sourceId,
      targetId,
      sourcePoint: sx !== undefined && sy !== undefined ? { x: sx, y: sy } : undefined,
      targetPoint: tx !== undefined && ty !== undefined ? { x: tx, y: ty } : undefined,
      waypoints: [],
      label: '',
      style: {
        stroke: '#666680',
        strokeWidth: 1.5,
        strokeDasharray: '',
        startArrow: 'none',
        endArrow: 'arrow',
        lineStyle: 'elbow',
        opacity: 1,
      },
      textStyle: { ...defaultTextStyle, fontSize: 11 },
      zIndex: 0,
    };
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        connections: [...page.connections, conn],
      })),
    }));
  },

  updateConnection: (id, updates) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        connections: page.connections.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
    }));
  },

  removeConnections: (ids) => {
    get().pushHistory();
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        connections: page.connections.filter(c => !ids.includes(c.id)),
      })),
      selectedIds: s.selectedIds.filter(id => !ids.includes(id)),
    }));
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  addToSelection: (id) => set(s => ({ selectedIds: [...s.selectedIds, id] })),
  clearSelection: () => set({ selectedIds: [] }),

  selectAll: () => {
    const page = getActivePage(get().file);
    const ids = [
      ...page.shapes.map(s => s.id),
      ...page.connections.map(c => c.id),
    ];
    set({ selectedIds: ids });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),

  setZoom: (zoom) => set(s => ({ canvas: { ...s.canvas, zoom: Math.max(0.1, Math.min(5, zoom)) } })),
  setPan: (x, y) => set(s => ({ canvas: { ...s.canvas, panX: x, panY: y } })),
  resetView: () => set({ canvas: { zoom: 1, panX: 0, panY: 0 } }),
  zoomToFit: () => {
    const page = getActivePage(get().file);
    if (page.shapes.length === 0) { get().resetView(); return; }
    const minX = Math.min(...page.shapes.map(s => s.x));
    const minY = Math.min(...page.shapes.map(s => s.y));
    const maxX = Math.max(...page.shapes.map(s => s.x + s.width));
    const maxY = Math.max(...page.shapes.map(s => s.y + s.height));
    const w = maxX - minX + 100;
    const h = maxY - minY + 100;
    const zoom = Math.min(1200 / w, 700 / h, 1);
    set({ canvas: { zoom, panX: -minX * zoom + 50, panY: -minY * zoom + 50 } });
  },

  pushHistory: () => {
    const { file, history, historyIndex } = get();
    const entry: HistoryEntry = { pages: file.pages, activePageId: file.activePageId };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1];
    set(s => ({
      file: { ...s.file, pages: entry.pages, activePageId: entry.activePageId },
      historyIndex: historyIndex - 1,
      selectedIds: [],
    }));
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    set(s => ({
      file: { ...s.file, pages: entry.pages, activePageId: entry.activePageId },
      historyIndex: historyIndex + 1,
      selectedIds: [],
    }));
  },

  copy: () => {
    const { selectedIds, file } = get();
    const page = getActivePage(file);
    const items = [
      ...page.shapes.filter(s => selectedIds.includes(s.id)),
      ...page.connections.filter(c => selectedIds.includes(c.id)),
    ];
    set({ clipboard: items });
  },

  paste: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    get().pushHistory();
    const idMap = new Map<string, string>();
    const newShapes = clipboard
      .filter((item): item is DiagramShape => 'type' in item)
      .map(sh => {
        const newId = uuidv4();
        idMap.set(sh.id, newId);
        return { ...sh, id: newId, x: sh.x + 20, y: sh.y + 20 };
      });
    const newConns = clipboard
      .filter((item): item is DiagramConnection => 'sourceId' in item)
      .filter(c => idMap.has(c.sourceId) && idMap.has(c.targetId))
      .map(c => ({
        ...c,
        id: uuidv4(),
        sourceId: idMap.get(c.sourceId)!,
        targetId: idMap.get(c.targetId)!,
      }));
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: [...page.shapes, ...newShapes],
        connections: [...page.connections, ...newConns],
      })),
      selectedIds: newShapes.map(s => s.id),
    }));
  },

  cut: () => {
    get().copy();
    get().removeShapes(get().selectedIds);
  },

  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  toggleRuler: () => set(s => ({ showRuler: !s.showRuler })),
  toggleProperties: () => set(s => ({ showProperties: !s.showProperties })),
  toggleShapePanel: () => set(s => ({ showShapePanel: !s.showShapePanel })),
  setConnectingFrom: (id) => set({ connectingFrom: id }),

  bringForward: (ids) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh =>
          ids.includes(sh.id) ? { ...sh, zIndex: sh.zIndex + 1 } : sh
        ),
      })),
    }));
  },
  sendBackward: (ids) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh =>
          ids.includes(sh.id) ? { ...sh, zIndex: Math.max(0, sh.zIndex - 1) } : sh
        ),
      })),
    }));
  },
  bringToFront: (ids) => {
    const page = getActivePage(get().file);
    const maxZ = Math.max(...page.shapes.map(s => s.zIndex), 0);
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh =>
          ids.includes(sh.id) ? { ...sh, zIndex: maxZ + 1 } : sh
        ),
      })),
    }));
  },
  sendToBack: (ids) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh =>
          ids.includes(sh.id) ? { ...sh, zIndex: 0 } : sh
        ),
      })),
    }));
  },

  groupShapes: (ids) => {
    const groupId = uuidv4();
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh =>
          ids.includes(sh.id) ? { ...sh, groupId } : sh
        ),
      })),
    }));
  },

  ungroupShapes: (groupId) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh =>
          sh.groupId === groupId ? { ...sh, groupId: undefined } : sh
        ),
      })),
    }));
  },

  alignShapes: (ids, direction) => {
    get().pushHistory();
    const page = getActivePage(get().file);
    const selected = page.shapes.filter(s => ids.includes(s.id));
    if (selected.length < 2) return;
    const minX = Math.min(...selected.map(s => s.x));
    const minY = Math.min(...selected.map(s => s.y));
    const maxX = Math.max(...selected.map(s => s.x + s.width));
    const maxY = Math.max(...selected.map(s => s.y + s.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh => {
          if (!ids.includes(sh.id)) return sh;
          switch (direction) {
            case 'left': return { ...sh, x: minX };
            case 'center': return { ...sh, x: centerX - sh.width / 2 };
            case 'right': return { ...sh, x: maxX - sh.width };
            case 'top': return { ...sh, y: minY };
            case 'middle': return { ...sh, y: centerY - sh.height / 2 };
            case 'bottom': return { ...sh, y: maxY - sh.height };
            default: return sh;
          }
        }),
      })),
    }));
  },

  distributeShapes: (ids, direction) => {
    get().pushHistory();
    const page = getActivePage(get().file);
    const selected = page.shapes.filter(s => ids.includes(s.id)).sort((a, b) =>
      direction === 'horizontal' ? a.x - b.x : a.y - b.y
    );
    if (selected.length < 3) return;
    const first = selected[0];
    const last = selected[selected.length - 1];
    const totalSpace = direction === 'horizontal'
      ? (last.x + last.width) - first.x
      : (last.y + last.height) - first.y;
    const totalShapeSize = selected.reduce((sum, s) =>
      sum + (direction === 'horizontal' ? s.width : s.height), 0);
    const gap = (totalSpace - totalShapeSize) / (selected.length - 1);
    let offset = direction === 'horizontal' ? first.x : first.y;
    const newPositions = new Map<string, number>();
    for (const sh of selected) {
      newPositions.set(sh.id, offset);
      offset += (direction === 'horizontal' ? sh.width : sh.height) + gap;
    }
    set(s => ({
      file: updateActivePage(s.file, page => ({
        ...page,
        shapes: page.shapes.map(sh => {
          const pos = newPositions.get(sh.id);
          if (pos === undefined) return sh;
          return direction === 'horizontal' ? { ...sh, x: pos } : { ...sh, y: pos };
        }),
      })),
    }));
  },

  updatePageSettings: (settings) => {
    set(s => ({
      file: updateActivePage(s.file, page => ({ ...page, ...settings })),
    }));
  },
}));
