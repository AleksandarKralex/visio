import React from 'react';
import type { DiagramShape } from '../types';

export function getShapePath(type: string, w: number, h: number): string {
  switch (type) {
    case 'rectangle':
      return `M 0 0 H ${w} V ${h} H 0 Z`;

    case 'rounded-rectangle':
    case 'process': {
      const r = Math.min(8, w / 4, h / 4);
      return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
    }

    case 'circle':
    case 'ellipse':
      return `M ${w / 2} 0 A ${w / 2} ${h / 2} 0 1 1 ${w / 2 - 0.01} 0 Z`;

    case 'diamond':
    case 'decision':
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;

    case 'triangle':
      return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;

    case 'pentagon': {
      const cx = w / 2;
      const pts = Array.from({ length: 5 }, (_, i) => {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        return `${cx + (w / 2) * Math.cos(a)} ${h / 2 + (h / 2) * Math.sin(a)}`;
      });
      return `M ${pts.join(' L ')} Z`;
    }

    case 'hexagon': {
      const r = Math.min(w, h) / 2;
      const cx = w / 2, cy = h / 2;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
      });
      return `M ${pts.join(' L ')} Z`;
    }

    case 'star': {
      const cx = w / 2, cy = h / 2;
      const outerR = Math.min(w, h) / 2, innerR = outerR * 0.4;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
      });
      return `M ${pts.join(' L ')} Z`;
    }

    case 'parallelogram':
    case 'data': {
      const off = w * 0.15;
      return `M ${off} 0 L ${w} 0 L ${w - off} ${h} L 0 ${h} Z`;
    }

    case 'trapezoid': {
      const off = w * 0.15;
      return `M ${off} 0 L ${w - off} 0 L ${w} ${h} L 0 ${h} Z`;
    }

    case 'cylinder':
    case 'database': {
      const rx = w / 2, ry = Math.min(h * 0.15, 15);
      return `M 0 ${ry} A ${rx} ${ry} 0 0 1 ${w} ${ry} V ${h - ry} A ${rx} ${ry} 0 0 1 0 ${h - ry} Z M 0 ${ry} A ${rx} ${ry} 0 0 0 ${w} ${ry}`;
    }

    case 'cloud': {
      return `M ${w * 0.15} ${h * 0.55}
        A ${w * 0.15} ${h * 0.2} 0 0 1 ${w * 0.25} ${h * 0.32}
        A ${w * 0.15} ${h * 0.2} 0 0 1 ${w * 0.45} ${h * 0.22}
        A ${w * 0.12} ${h * 0.18} 0 0 1 ${w * 0.65} ${h * 0.24}
        A ${w * 0.18} ${h * 0.22} 0 0 1 ${w * 0.85} ${h * 0.4}
        A ${w * 0.15} ${h * 0.2} 0 0 1 ${w * 0.85} ${h * 0.62}
        A ${w * 0.15} ${h * 0.18} 0 0 1 ${w * 0.65} ${h * 0.78}
        A ${w * 0.2} ${h * 0.15} 0 0 1 ${w * 0.35} ${h * 0.82}
        A ${w * 0.18} ${h * 0.18} 0 0 1 ${w * 0.15} ${h * 0.78}
        A ${w * 0.15} ${h * 0.2} 0 0 1 ${w * 0.05} ${h * 0.62}
        A ${w * 0.12} ${h * 0.2} 0 0 1 ${w * 0.15} ${h * 0.55} Z`;
    }

    case 'terminal': {
      const r = h / 2;
      return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }

    case 'document': {
      const wave = h * 0.15;
      return `M 0 0 H ${w} V ${h - wave} Q ${w * 0.75} ${h - wave * 2} ${w * 0.5} ${h - wave} Q ${w * 0.25} ${h} 0 ${h - wave} Z`;
    }

    case 'arrow-right': {
      const ah = h * 0.4, ay = (h - ah) / 2, tip = w * 0.7;
      return `M 0 ${ay} H ${tip} V 0 L ${w} ${h / 2} L ${tip} ${h} V ${h - ay} H 0 Z`;
    }
    case 'arrow-left': {
      const ah = h * 0.4, ay = (h - ah) / 2, tip = w * 0.3;
      return `M ${w} ${ay} H ${tip} V 0 L 0 ${h / 2} L ${tip} ${h} V ${h - ay} H ${w} Z`;
    }
    case 'arrow-up': {
      const aw = w * 0.4, ax = (w - aw) / 2, tip = h * 0.3;
      return `M ${ax} ${h} V ${tip} H 0 L ${w / 2} 0 L ${w} ${tip} H ${w - ax} V ${h} Z`;
    }
    case 'arrow-down': {
      const aw = w * 0.4, ax = (w - aw) / 2, tip = h * 0.7;
      return `M ${ax} 0 V ${tip} H 0 L ${w / 2} ${h} L ${w} ${tip} H ${w - ax} V 0 Z`;
    }
    case 'double-arrow': {
      const ah = h * 0.4, ay = (h - ah) / 2, tipL = w * 0.25, tipR = w * 0.75;
      return `M ${tipL} 0 L 0 ${h / 2} L ${tipL} ${h} V ${h - ay} H ${tipR} V ${h} L ${w} ${h / 2} L ${tipR} 0 V ${ay} H ${tipL} Z`;
    }

    case 'callout': {
      const tailX = w * 0.2;
      return `M 0 0 H ${w} V ${h * 0.75} H ${tailX + w * 0.1} L ${tailX} ${h} L ${tailX + w * 0.05} ${h * 0.75} H 0 Z`;
    }

    case 'note': {
      const fold = Math.min(w * 0.15, 20);
      return `M 0 0 H ${w - fold} L ${w} ${fold} V ${h} H 0 Z M ${w - fold} 0 L ${w - fold} ${fold} H ${w}`;
    }

    case 'actor': {
      const headR = w * 0.25;
      const headCY = headR + 2;
      const bodyTop = headCY * 2 + 2;
      const midY = bodyTop + h * 0.3;
      return `M ${w / 2} ${headCY} m ${-headR} 0 a ${headR} ${headR} 0 1 0 ${headR * 2} 0 a ${headR} ${headR} 0 1 0 ${-headR * 2} 0 M ${w / 2} ${bodyTop} V ${midY} M 0 ${bodyTop + h * 0.1} H ${w} M ${w / 2} ${midY} L 0 ${h} M ${w / 2} ${midY} L ${w} ${h}`;
    }

    case 'swimlane':
      return `M 0 0 H ${w} V ${h} H 0 Z M 0 30 H ${w}`;

    // ── NETWORK DEVICES ─────────────────────────────────────────────────
    case 'router': {
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.28;
      const ar = r * 0.55;
      return [
        `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`,
        `M ${cx - r - ar} ${cy} L ${cx - r} ${cy}`,
        `M ${cx - r - ar} ${cy} L ${cx - r - ar * 0.4} ${cy - ar * 0.5} M ${cx - r - ar} ${cy} L ${cx - r - ar * 0.4} ${cy + ar * 0.5}`,
        `M ${cx + r + ar} ${cy} L ${cx + r} ${cy}`,
        `M ${cx + r + ar} ${cy} L ${cx + r + ar * 0.4} ${cy - ar * 0.5} M ${cx + r + ar} ${cy} L ${cx + r + ar * 0.4} ${cy + ar * 0.5}`,
        `M ${cx} ${cy - r - ar} L ${cx} ${cy - r}`,
        `M ${cx} ${cy + r + ar} L ${cx} ${cy + r}`,
      ].join(' ');
    }

    case 'network-switch': {
      const body = `M 0 0 H ${w} V ${h * 0.65} H 0 Z`;
      const nPorts = 6;
      const portW = (w * 0.8) / nPorts;
      const startX = w * 0.1;
      let ports = '';
      for (let i = 0; i < nPorts; i++) {
        const px = startX + i * portW + portW * 0.1;
        const pw = portW * 0.75;
        ports += ` M ${px} ${h * 0.65} H ${px + pw} V ${h * 0.92} H ${px} Z`;
      }
      const light = ` M ${w * 0.82} ${h * 0.2} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`;
      return body + ports + light;
    }

    case 'firewall': {
      // Brick wall pattern
      const bh = h / 4;
      let d = `M 0 0 H ${w} V ${h} H 0 Z`;
      // Horizontal lines
      for (let row = 1; row < 4; row++) d += ` M 0 ${row * bh} H ${w}`;
      // Vertical lines alternating rows
      for (let row = 0; row < 4; row++) {
        const offset = row % 2 === 0 ? 0 : w / 4;
        for (let col = 1; col < 4; col++) {
          const x = offset + col * (w / 4);
          if (x > 0 && x < w) d += ` M ${x} ${row * bh} V ${(row + 1) * bh}`;
        }
      }
      return d;
    }

    case 'hub': {
      const cx = w / 2, cy = h * 0.45;
      const r = Math.min(w, h) * 0.18;
      const legLen = Math.min(w, h) * 0.28;
      const angles = [-90, -30, 30, 90, 150, -150].map(a => a * Math.PI / 180);
      let d = `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
      for (const a of angles) {
        const ex = cx + (r + legLen) * Math.cos(a);
        const ey = cy + (r + legLen) * Math.sin(a);
        d += ` M ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} L ${ex} ${ey}`;
        d += ` M ${ex} ${ey} m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`;
      }
      return d;
    }

    case 'access-point': {
      const cx = w / 2, baseY = h * 0.75;
      const antH = h * 0.55;
      let d = `M ${cx - w * 0.06} ${baseY} V ${baseY - antH} M ${cx + w * 0.06} ${baseY} V ${baseY - antH}`;
      const radii = [0.25, 0.38, 0.5];
      for (const rf of radii) {
        const rx = w * rf, ry = h * rf * 0.6;
        const sy = baseY - antH * 0.15;
        d += ` M ${cx - rx} ${sy + ry * 0.5} A ${rx} ${ry} 0 0 1 ${cx + rx} ${sy + ry * 0.5}`;
      }
      d += ` M 0 ${baseY} H ${w} V ${h} H 0 Z`;
      return d;
    }

    case 'vpn-gateway': {
      const cx = w / 2, top = 0, bw = w * 0.85, bh2 = h * 0.6;
      const bx = (w - bw) / 2;
      return `M ${cx} ${top} L ${bx + bw} ${h * 0.28} V ${top + bh2} Q ${cx} ${h} ${bx} ${top + bh2} V ${h * 0.28} Z`
        + ` M ${cx - w * 0.1} ${h * 0.42} a ${w * 0.1} ${h * 0.1} 0 1 0 ${w * 0.2} 0`
        + ` M ${cx} ${h * 0.52} V ${h * 0.64} M ${cx - w * 0.08} ${h * 0.64} H ${cx + w * 0.08} V ${h * 0.72} H ${cx - w * 0.08} Z`;
    }

    case 'proxy': {
      const midX = w * 0.5;
      return `M 0 ${h * 0.1} H ${w * 0.38} V ${h * 0.9} H 0 Z`
        + ` M ${w * 0.62} ${h * 0.1} H ${w} V ${h * 0.9} H ${w * 0.62} Z`
        + ` M ${w * 0.38} ${h * 0.3} L ${midX} ${h * 0.2} L ${w * 0.62} ${h * 0.3}`
        + ` M ${w * 0.38} ${h * 0.5} H ${w * 0.62}`
        + ` M ${w * 0.38} ${h * 0.7} L ${midX} ${h * 0.8} L ${w * 0.62} ${h * 0.7}`;
    }

    // ── SERVERS ──────────────────────────────────────────────────────────
    case 'server':
    case 'web-server':
    case 'app-server':
    case 'file-server':
    case 'mail-server':
    case 'db-server': {
      const unit = h / 4;
      let d = `M 0 0 H ${w} V ${h} H 0 Z`;
      for (let i = 1; i < 4; i++) d += ` M 0 ${i * unit} H ${w}`;
      // Status LEDs
      d += ` M ${w - 14} ${unit * 0.5} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`;
      d += ` M ${w - 24} ${unit * 0.5} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`;
      // Drive slots
      d += ` M ${w * 0.05} ${unit * 1.15} H ${w * 0.6} V ${unit * 1.85} H ${w * 0.05} Z`;
      d += ` M ${w * 0.05} ${unit * 2.15} H ${w * 0.6} V ${unit * 2.85} H ${w * 0.05} Z`;
      return d;
    }

    case 'load-balancer': {
      const cx = w / 2;
      return `M ${cx} 0 L ${w} ${h * 0.45} H ${w * 0.7} L ${w} ${h} H ${w * 0.4} L ${cx} ${h * 0.65} L ${w * 0.6 - (w * 0.6 - w * 0.4)} ${h} H 0 L ${w * 0.3} ${h * 0.45} H 0 Z`
        || `M 0 0 H ${w} V ${h * 0.45} L ${w * 0.65} ${h * 0.45} L ${w * 0.8} ${h} H ${w * 0.55} L ${cx} ${h * 0.62} L ${w * 0.45} ${h} H ${w * 0.2} L ${w * 0.35} ${h * 0.45} H 0 Z`;
    }

    case 'dns-server': {
      const cx = w / 2, cy = h / 2;
      const rx = w * 0.48, ry = h * 0.48;
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
        + ` M ${cx - rx} ${cy} H ${cx + rx}`
        + ` M ${cx} ${cy - ry} A ${rx * 0.5} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx * 0.5} ${ry} 0 1 0 ${cx} ${cy - ry}`
        + ` M ${cx - rx} ${cy - ry * 0.5} Q ${cx} ${cy - ry * 0.3} ${cx + rx} ${cy - ry * 0.5}`
        + ` M ${cx - rx} ${cy + ry * 0.5} Q ${cx} ${cy + ry * 0.3} ${cx + rx} ${cy + ry * 0.5}`;
    }

    // ── STORAGE & DATA ───────────────────────────────────────────────────
    case 'storage': {
      const rx = w / 2, ry = Math.min(h * 0.12, 12);
      const shelves = 3;
      let d = `M 0 ${ry} A ${rx} ${ry} 0 0 1 ${w} ${ry} V ${h - ry} A ${rx} ${ry} 0 0 1 0 ${h - ry} Z M 0 ${ry} A ${rx} ${ry} 0 0 0 ${w} ${ry}`;
      for (let i = 1; i < shelves; i++) {
        const y = ry + (h - 2 * ry) * (i / shelves);
        d += ` M 0 ${y} A ${rx} ${ry * 0.6} 0 0 0 ${w} ${y}`;
        d += ` M 0 ${y} A ${rx} ${ry * 0.6} 0 0 1 ${w} ${y}`;
      }
      return d;
    }

    case 'data-warehouse': {
      const bw = w * 0.7, bx = (w - bw) / 2;
      return `M ${bx} ${h * 0.3} H ${bx + bw} V ${h} H ${bx} Z`
        + ` M ${bx} ${h * 0.3} L ${w / 2} 0 L ${bx + bw} ${h * 0.3}`
        + ` M ${bx} ${h * 0.5} H ${bx + bw}`
        + ` M ${bx} ${h * 0.7} H ${bx + bw}`;
    }

    case 'cache-store': {
      const cx = w / 2, cy = h / 2;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return `${cx + (w * 0.47) * Math.cos(a)} ${cy + (h * 0.47) * Math.sin(a)}`;
      });
      return `M ${pts.join(' L ')} Z M ${cx} ${cy - h * 0.18} V ${cy} L ${cx + w * 0.12} ${cy + h * 0.08}`;
    }

    case 'message-queue': {
      const envW = w * 0.55, envH = h * 0.4;
      const envX = (w - envW) / 2, envY = h * 0.05;
      let d = `M ${envX} ${envY} H ${envX + envW} V ${envY + envH} H ${envX} Z`;
      d += ` M ${envX} ${envY} L ${envX + envW / 2} ${envY + envH * 0.5} L ${envX + envW} ${envY}`;
      // Queue lines below
      const lw = w * 0.8, lx = (w - lw) / 2;
      d += ` M ${lx} ${h * 0.58} H ${lx + lw}`;
      d += ` M ${lx} ${h * 0.72} H ${lx + lw * 0.75}`;
      d += ` M ${lx} ${h * 0.86} H ${lx + lw * 0.5}`;
      return d;
    }

    // ── CLOUD & INTERNET ─────────────────────────────────────────────────
    case 'internet': {
      const cx = w / 2, cy = h / 2;
      const rx = w * 0.46, ry = h * 0.46;
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
        + ` M ${cx - rx} ${cy} H ${cx + rx}`
        + ` M ${cx} ${cy - ry} V ${cy + ry}`
        + ` M ${cx - rx} ${cy - ry * 0.5} Q ${cx} ${cy - ry * 0.25} ${cx + rx} ${cy - ry * 0.5}`
        + ` M ${cx - rx} ${cy + ry * 0.5} Q ${cx} ${cy + ry * 0.25} ${cx + rx} ${cy + ry * 0.5}`
        + ` M ${cx - rx * 0.5} ${cy - ry} A ${rx * 0.5} ${ry} 0 1 0 ${cx - rx * 0.5} ${cy + ry}`
        + ` M ${cx + rx * 0.5} ${cy - ry} A ${rx * 0.5} ${ry} 0 1 1 ${cx + rx * 0.5} ${cy + ry}`;
    }

    case 'cdn': {
      const cx = w / 2;
      return `M 0 ${h * 0.4} H ${w} M ${cx} 0 V ${h}`
        + ` M ${cx} ${h * 0.2} m -${w * 0.15} 0 a ${w * 0.15} ${h * 0.15} 0 1 0 ${w * 0.3} 0 a ${w * 0.15} ${h * 0.15} 0 1 0 ${-w * 0.3} 0`
        + ` M ${w * 0.15} ${h * 0.7} m -${w * 0.12} 0 a ${w * 0.12} ${h * 0.12} 0 1 0 ${w * 0.24} 0 a ${w * 0.12} ${h * 0.12} 0 1 0 ${-w * 0.24} 0`
        + ` M ${w * 0.85} ${h * 0.7} m -${w * 0.12} 0 a ${w * 0.12} ${h * 0.12} 0 1 0 ${w * 0.24} 0 a ${w * 0.12} ${h * 0.12} 0 1 0 ${-w * 0.24} 0`;
    }

    case 'api-gateway': {
      const cx = w / 2, cy = h / 2;
      const rx = w * 0.46, ry = h * 0.46;
      return `M ${cx - rx * 0.5} ${cy - ry} L ${cx + rx * 0.5} ${cy - ry} L ${cx + rx} ${cy} L ${cx + rx * 0.5} ${cy + ry} L ${cx - rx * 0.5} ${cy + ry} L ${cx - rx} ${cy} Z`
        + ` M ${cx - rx * 0.3} ${cy - ry * 0.3} V ${cy + ry * 0.3}`
        + ` M ${cx + rx * 0.1} ${cy - ry * 0.3} L ${cx + rx * 0.35} ${cy} L ${cx + rx * 0.1} ${cy + ry * 0.3}`;
    }

    // ── APPLICATIONS & SERVICES ──────────────────────────────────────────
    case 'microservice': {
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        return `${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}`;
      });
      return `M ${pts.join(' L ')} Z`
        + ` M ${cx} ${cy} m -${R * 0.25} 0 a ${R * 0.25} ${R * 0.25} 0 1 0 ${R * 0.5} 0 a ${R * 0.25} ${R * 0.25} 0 1 0 ${-R * 0.5} 0`;
    }

    case 'container': {
      const r2 = 6;
      return `M ${r2} 0 H ${w - r2} Q ${w} 0 ${w} ${r2} V ${h - r2} Q ${w} ${h} ${w - r2} ${h} H ${r2} Q 0 ${h} 0 ${h - r2} V ${r2} Q 0 0 ${r2} 0 Z`
        + ` M 0 ${h * 0.28} H ${w}`
        + ` M ${w * 0.25} 0 V ${h * 0.28}`
        + ` M ${w * 0.5} 0 V ${h * 0.28}`
        + ` M ${w * 0.75} 0 V ${h * 0.28}`;
    }

    case 'component': {
      const tabW = w * 0.22, tabH = h * 0.16, tabX = -tabW * 0.4;
      return `M ${tabW * 0.5} 0 H ${w} V ${h} H ${tabW * 0.5} Z`
        + ` M ${tabX} ${h * 0.22} H ${tabW * 0.9} V ${h * 0.22 + tabH} H ${tabX} Z`
        + ` M ${tabX} ${h * 0.62} H ${tabW * 0.9} V ${h * 0.62 + tabH} H ${tabX} Z`;
    }

    case 'interface-box': {
      const r3 = Math.min(w, h) * 0.38;
      const cx = w / 2, cy = h / 2;
      return `M ${cx - r3} ${cy} A ${r3} ${r3} 0 1 0 ${cx + r3} ${cy} A ${r3} ${r3} 0 1 0 ${cx - r3} ${cy}`
        + ` M ${cx} ${cy - r3} L ${cx} ${cy - r3 * 1.5}`
        + ` M ${cx - r3} ${cy} L ${cx - r3 * 1.5} ${cy}`
        + ` M ${cx + r3} ${cy} L ${cx + r3 * 1.5} ${cy}`;
    }

    // ── CLIENT DEVICES ───────────────────────────────────────────────────
    case 'workstation': {
      const mw = w * 0.85, mh = h * 0.62;
      const mx = (w - mw) / 2;
      return `M ${mx} 0 H ${mx + mw} V ${mh} H ${mx} Z`
        + ` M ${mx + mw * 0.15} ${mh * 0.12} H ${mx + mw * 0.85} V ${mh * 0.88} H ${mx + mw * 0.15} Z`
        + ` M ${w * 0.3} ${mh} L ${w * 0.2} ${h} M ${w * 0.7} ${mh} L ${w * 0.8} ${h}`
        + ` M ${w * 0.15} ${h} H ${w * 0.85}`;
    }

    case 'laptop': {
      const sw = w * 0.9, sx = (w - sw) / 2;
      const screenH = h * 0.6;
      return `M ${sx + sw * 0.05} 0 H ${sx + sw * 0.95} V ${screenH} H ${sx + sw * 0.05} Z`
        + ` M ${sx + sw * 0.18} ${screenH * 0.12} H ${sx + sw * 0.82} V ${screenH * 0.88} H ${sx + sw * 0.18} Z`
        + ` M 0 ${screenH} H ${w} V ${h} H 0 Z`
        + ` M ${w * 0.35} ${screenH + (h - screenH) * 0.5} H ${w * 0.65}`;
    }

    case 'mobile-device': {
      const mw = w * 0.55, mx = (w - mw) / 2;
      const r4 = Math.min(mw * 0.12, 8);
      return `M ${mx + r4} 0 H ${mx + mw - r4} Q ${mx + mw} 0 ${mx + mw} ${r4} V ${h - r4} Q ${mx + mw} ${h} ${mx + mw - r4} ${h} H ${mx + r4} Q ${mx} ${h} ${mx} ${h - r4} V ${r4} Q ${mx} 0 ${mx + r4} 0 Z`
        + ` M ${mx + mw * 0.15} ${h * 0.12} H ${mx + mw * 0.85} V ${h * 0.82} H ${mx + mw * 0.15} Z`
        + ` M ${w / 2} ${h * 0.9} m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0`;
    }

    case 'printer': {
      const tray = h * 0.35;
      return `M 0 ${tray} H ${w} V ${h * 0.72} H 0 Z`
        + ` M ${w * 0.15} 0 H ${w * 0.85} V ${tray} H ${w * 0.15} Z`
        + ` M ${w * 0.15} ${h * 0.72} H ${w * 0.85} V ${h} H ${w * 0.15} Z`
        + ` M ${w * 0.62} ${tray + (h * 0.72 - tray) * 0.4} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`
        + ` M ${w * 0.75} ${tray + (h * 0.72 - tray) * 0.4} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`;
    }

    default:
      return `M 0 0 H ${w} V ${h} H 0 Z`;
  }
}

// Renders multiline text with tspan support
function MultilineText({
  label, x, y, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, fill, textAnchor, dominantBaseline
}: {
  label: string; x: number; y: number; fontSize: number; fontFamily: string;
  fontWeight: string; fontStyle: string; textDecoration: string; fill: string;
  textAnchor: 'start' | 'middle' | 'end'; dominantBaseline: string;
}) {
  const lines = label.split('\n');
  const lineHeight = fontSize * 1.3;
  const totalH = lines.length * lineHeight;
  let startY = y;
  if (dominantBaseline === 'central') startY = y - (totalH / 2) + lineHeight / 2;
  if (dominantBaseline === 'auto') startY = y - totalH + lineHeight;

  return (
    <text
      x={x}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontWeight={fontWeight}
      fontStyle={fontStyle}
      textDecoration={textDecoration}
      fill={fill}
      textAnchor={textAnchor}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={startY + i * lineHeight}>{line || ' '}</tspan>
      ))}
    </text>
  );
}

interface ShapePathProps {
  shape: DiagramShape;
  isPreview?: boolean;
}

export const ShapeRenderer: React.FC<ShapePathProps> = ({ shape }) => {
  const { type, width: w, height: h, label, style, textStyle, rotation } = shape;
  const path = getShapePath(type, w, h);
  const isActor = type === 'actor';
  const isText = type === 'text';

  const textX = textStyle.align === 'left' ? 8 : textStyle.align === 'right' ? w - 8 : w / 2;
  const textY = textStyle.verticalAlign === 'top' ? textStyle.fontSize * 0.8 + 4 : textStyle.verticalAlign === 'bottom' ? h - 6 : h / 2;
  const textAnchor: 'start' | 'middle' | 'end' = textStyle.align === 'left' ? 'start' : textStyle.align === 'right' ? 'end' : 'middle';
  const dominantBaseline = textStyle.verticalAlign === 'top' ? 'hanging' : textStyle.verticalAlign === 'bottom' ? 'auto' : 'central';

  const textProps = {
    label,
    x: textX,
    y: textY,
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fontWeight: textStyle.fontWeight,
    fontStyle: textStyle.fontStyle,
    textDecoration: textStyle.textDecoration,
    fill: textStyle.color,
    textAnchor,
    dominantBaseline,
  };

  const filter = style.shadow ? 'url(#shadow)' : undefined;

  // Determine if shape uses stroke-only rendering (icons/network shapes)
  const strokeOnlyTypes = new Set(['router', 'hub', 'access-point', 'dns-server', 'internet', 'cdn', 'actor']);
  const isStrokeOnly = strokeOnlyTypes.has(type);

  return (
    <g
      transform={`rotate(${rotation}, ${w / 2}, ${h / 2})`}
      style={{ opacity: style.opacity }}
      filter={filter}
    >
      {isText ? (
        <MultilineText {...textProps} />
      ) : isActor ? (
        <>
          <path d={path} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} strokeDasharray={style.strokeDasharray} />
          {label && <text x={w / 2} y={h + 14} fontSize={textStyle.fontSize} fontFamily={textStyle.fontFamily} fontWeight={textStyle.fontWeight} fill={textStyle.color} textAnchor="middle" dominantBaseline="hanging">{label}</text>}
        </>
      ) : type === 'note' ? (
        <>
          <path d={path.split(' M ')[0]} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} strokeDasharray={style.strokeDasharray} />
          <path d={'M ' + path.split(' M ')[1]} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} />
          {label && <MultilineText {...textProps} />}
        </>
      ) : type === 'swimlane' ? (
        <>
          <path d={`M 0 0 H ${w} V ${h} H 0 Z`} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} />
          <path d={`M 0 30 H ${w}`} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} />
          <text x={w / 2} y={15} fontSize={textStyle.fontSize} fontFamily={textStyle.fontFamily} fontWeight="bold" fill={textStyle.color} textAnchor="middle" dominantBaseline="central">{label}</text>
        </>
      ) : type === 'firewall' ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} />
          <path d={path} fill="none" stroke={style.stroke} strokeWidth={Math.max(0.8, style.strokeWidth * 0.6)} opacity={0.6} />
          {label && <MultilineText {...textProps} />}
        </>
      ) : isStrokeOnly ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill={style.fill} stroke="none" />
          <path d={path} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} strokeDasharray={style.strokeDasharray} strokeLinecap="round" strokeLinejoin="round" />
          {label && <MultilineText {...textProps} />}
        </>
      ) : (
        <>
          <path d={path} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} strokeDasharray={style.strokeDasharray} strokeLinecap="round" strokeLinejoin="round" />
          {label && <MultilineText {...textProps} />}
        </>
      )}
    </g>
  );
};
