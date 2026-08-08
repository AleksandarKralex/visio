export type ShapeType =
  // Basic
  | 'rectangle' | 'rounded-rectangle' | 'circle' | 'ellipse'
  | 'diamond' | 'triangle' | 'pentagon' | 'hexagon' | 'star'
  | 'parallelogram' | 'trapezoid' | 'cylinder' | 'cloud'
  // Flowchart
  | 'process' | 'decision' | 'terminal' | 'document'
  | 'data' | 'database'
  // Arrows
  | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'double-arrow'
  // UML / Annotations
  | 'callout' | 'note' | 'actor' | 'swimlane'
  // Network devices
  | 'router' | 'network-switch' | 'firewall' | 'hub' | 'access-point' | 'vpn-gateway' | 'proxy'
  // Servers & infrastructure
  | 'server' | 'web-server' | 'app-server' | 'db-server' | 'file-server' | 'mail-server'
  | 'load-balancer' | 'dns-server'
  // Storage & data
  | 'storage' | 'cache-store' | 'data-warehouse' | 'message-queue'
  // Cloud & internet
  | 'internet' | 'cdn' | 'api-gateway'
  // Applications & services
  | 'microservice' | 'container' | 'component' | 'interface-box'
  // Clients & endpoints
  | 'workstation' | 'laptop' | 'mobile-device' | 'printer'
  // Text / image
  | 'text' | 'image'
  // Solid-mixture production equipment
  | 'bag-dump-station' | 'rotary-valve' | 'butterfly-valve' | 'diverter-valve'
  | 'guillotine-valve' | 'pneumatic-pipe' | 'vacuum-pump' | 'filter'
  | 'vertical-mixer' | 'horizontal-mixer' | 'separator' | 'silo'
  | 'bag-packer' | 'conveyor' | 'robotic-palletizer' | 'bag-sealer'
  | 'pallet-conveyor' | 'pallet' | 'bagged-pallet' | 'stretch-wrapper';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
  shadow: boolean;
  cornerRadius: number;
}

export interface QualyProMeta {
  processId: string;
  processName: string;
  processCode: string;
  category: string;
  raci: {
    R: { id: string; name: string }[];
    A: { id: string; name: string }[];
    C: { id: string; name: string }[];
    I: { id: string; name: string }[];
  };
  expanded?: boolean;
  subShapeIds?: string[];  // IDs of injected shapes+conns when expanded
}

export interface DiagramShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  style: ShapeStyle;
  textStyle: TextStyle;
  rotation: number;
  locked: boolean;
  zIndex: number;
  groupId?: string;
  qualypro?: QualyProMeta;
}

export interface ConnectionPoint {
  shapeId: string;
  side: 'top' | 'right' | 'bottom' | 'left' | 'center';
  offsetX?: number;
  offsetY?: number;
}

export interface DiagramConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceSide?: 'top' | 'right' | 'bottom' | 'left';
  targetSide?: 'top' | 'right' | 'bottom' | 'left';
  sourcePoint?: Point;
  targetPoint?: Point;
  waypoints: Point[];
  label: string;
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray: string;
    startArrow: 'none' | 'arrow' | 'open' | 'diamond' | 'circle';
    endArrow: 'none' | 'arrow' | 'open' | 'diamond' | 'circle';
    lineStyle: 'straight' | 'curved' | 'elbow';
    opacity: number;
  };
  textStyle: TextStyle;
  zIndex: number;
}

export interface Page {
  id: string;
  name: string;
  shapes: DiagramShape[];
  connections: DiagramConnection[];
  background: string;
  grid: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

export interface DiagramFile {
  id: string;
  name: string;
  pages: Page[];
  activePageId: string;
  createdAt: string;
  updatedAt: string;
}

export type Tool =
  | 'select'
  | 'pan'
  | 'connect'
  | 'text'
  | ShapeType;

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}
