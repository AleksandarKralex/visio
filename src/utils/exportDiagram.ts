import { flushSync } from 'react-dom';
import { jsPDF } from 'jspdf';
import { useStore } from '../store';

const SHADOW_FILTER_ID = 'shadow';
const EXPORT_PADDING = 24;
const PDF_RASTER_SCALE = 3;

export type PngScale = 1 | 2 | 4;

interface BuiltExport {
  svgString: string;
  width: number;
  height: number;
}

function getCanvasSvgElement(): SVGSVGElement | null {
  return document.querySelector('svg[data-diagram-canvas]');
}

function getContentGroup(svg: SVGSVGElement): SVGGElement | null {
  return svg.querySelector(':scope > g[data-diagram-content]');
}

function cleanClone(el: SVGGElement): SVGGElement {
  const clone = el.cloneNode(true) as SVGGElement;
  clone.removeAttribute('transform');
  clone.querySelectorAll('[data-export-ignore]').forEach(node => node.remove());
  return clone;
}

/** Measures the tight geometry bounding box of a detached SVG group by briefly mounting it off-screen. */
function measureBBox(clone: SVGGElement): DOMRect | null {
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvg.setAttribute('style', 'position:fixed;left:-99999px;top:-99999px;width:0;height:0;overflow:hidden;');
  tempSvg.appendChild(clone);
  document.body.appendChild(tempSvg);
  let box: DOMRect | null = null;
  try {
    box = clone.getBBox();
  } catch {
    box = null;
  }
  document.body.removeChild(tempSvg);
  return box && box.width > 0 && box.height > 0 ? box : null;
}

/** Deselects everything and forces a synchronous re-render, so selection styling never leaks into the export. */
function ensureCleanSelectionForExport(): void {
  const { selectedIds, clearSelection } = useStore.getState();
  if (selectedIds.length > 0) {
    flushSync(() => clearSelection());
  }
}

/**
 * Builds a self-contained SVG document string cropped tightly to the active page's
 * shapes + connections (not the viewport/zoom/pan), at the given raster scale.
 * scale=1 keeps 1 diagram unit == 1 px, used as-is for the vector .svg export.
 */
function buildExportSvg(scale: number, padding = EXPORT_PADDING): BuiltExport | null {
  ensureCleanSelectionForExport();

  const svg = getCanvasSvgElement();
  if (!svg) return null;
  const contentGroup = getContentGroup(svg);
  if (!contentGroup) return null;

  const bbox = measureBBox(cleanClone(contentGroup));
  if (!bbox) return null;

  const contentW = bbox.width + padding * 2;
  const contentH = bbox.height + padding * 2;
  const pxW = Math.max(1, Math.round(contentW * scale));
  const pxH = Math.max(1, Math.round(contentH * scale));

  const { file } = useStore.getState();
  const page = file.pages.find(p => p.id === file.activePageId);
  const background = page?.background ?? '#ffffff';

  const shadowFilter = svg.querySelector(`#${SHADOW_FILTER_ID}`);

  const outSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  outSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  outSvg.setAttribute('width', String(pxW));
  outSvg.setAttribute('height', String(pxH));
  outSvg.setAttribute('viewBox', `0 0 ${contentW} ${contentH}`);

  if (shadowFilter) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.appendChild(shadowFilter.cloneNode(true));
    outSvg.appendChild(defs);
  }

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(contentW));
  bg.setAttribute('height', String(contentH));
  bg.setAttribute('fill', background);
  outSvg.appendChild(bg);

  const content = cleanClone(contentGroup);
  content.setAttribute('transform', `translate(${-bbox.x + padding}, ${-bbox.y + padding})`);
  outSvg.appendChild(content);

  const svgString = new XMLSerializer().serializeToString(outSvg);
  return { svgString, width: pxW, height: pxH };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Rasterizarea SVG a eșuat.'));
    img.src = src;
  });
}

async function svgStringToPngBlob(svgString: string, width: number, height: number): Promise<Blob> {
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contextul canvas 2D nu este disponibil.');
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Codificarea PNG a eșuat.'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Citirea imaginii a eșuat.'));
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFileName(name: string): string {
  return (name || 'diagram').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'diagram';
}

export function exportDiagramAsSvg(): void {
  const built = buildExportSvg(1);
  if (!built) return;
  const blob = new Blob([built.svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFileName(useStore.getState().file.name)}.svg`);
}

export async function exportDiagramAsPng(scale: PngScale): Promise<void> {
  const built = buildExportSvg(scale);
  if (!built) return;
  const blob = await svgStringToPngBlob(built.svgString, built.width, built.height);
  downloadBlob(blob, `${sanitizeFileName(useStore.getState().file.name)}@${scale}x.png`);
}

export async function exportDiagramAsPdf(): Promise<void> {
  const built = buildExportSvg(PDF_RASTER_SCALE);
  if (!built) return;
  const blob = await svgStringToPngBlob(built.svgString, built.width, built.height);
  const dataUrl = await blobToDataUrl(blob);
  const pdf = new jsPDF({
    orientation: built.width >= built.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [built.width, built.height],
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, built.width, built.height);
  pdf.save(`${sanitizeFileName(useStore.getState().file.name)}.pdf`);
}
