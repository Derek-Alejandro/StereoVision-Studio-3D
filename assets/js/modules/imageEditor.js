import { drawAnaglyph } from './anaglyph.js';
import { drawSbsImage } from './sbsImage.js';
import { clamp } from './calibration.js';

function canvasResolution(cssW, cssH, scale = 1) {
  // Limita la asignación de memoria en teléfonos sin reducir el tamaño CSS.
  const dpr = Math.min(window.devicePixelRatio || 1, 2.25);
  const limit = Math.min(1, Math.sqrt(4_200_000 / Math.max(1, cssW * cssH * dpr * dpr)));
  return { width: Math.max(1, Math.round(cssW * dpr * limit * scale)), height: Math.max(1, Math.round(cssH * dpr * limit * scale)) };
}

export class ImageEditor {
  constructor(resource, calibration, onChange) {
    this.resource = resource;
    this.settings = calibration;
    this.onChange = onChange;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'editor-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.role = 'img';
    this.canvas.setAttribute('aria-label', 'Imagen ajustable. Arrastra para mover, pellizca para zoom. Flechas para mover y teclas más y menos para zoom.');
    this.host = null;
    this.observer = new ResizeObserver(() => this.requestDraw());
    this.pointers = new Map();
    this.startGesture = null;
    this.dragStart = null;
    this.raf = 0;
    this.closed = false;
    this.onPointerDown = (event) => this.pointerDown(event);
    this.onPointerMove = (event) => this.pointerMove(event);
    this.onPointerEnd = (event) => this.pointerEnd(event);
    this.onWheel = (event) => this.wheel(event);
    this.onKey = (event) => this.key(event);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerEnd);
    this.canvas.addEventListener('pointercancel', this.onPointerEnd);
    this.canvas.addEventListener('lostpointercapture', this.onPointerEnd);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('keydown', this.onKey);
  }
  mount(host) {
    this.observer.disconnect();
    this.host = host;
    host.replaceChildren(this.canvas);
    this.observer.observe(host);
    this.requestDraw();
  }
  requestDraw() {
    if (this.closed || this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
  }
  draw() {
    if (!this.host || this.closed) return;
    const bounds = this.host.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2) return;
    const { width, height } = canvasResolution(bounds.width, bounds.height);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    this.paint(ctx, width, height, bounds.width, bounds.height);
    this.canvas.classList.toggle('is-locked', this.settings.locked);
  }
  paint(ctx, width, height, cssWidth, cssHeight) {
    ctx.fillStyle = '#111518';
    ctx.fillRect(0, 0, width, height);
    const scaled = { width, height, scaleX: width / cssWidth, scaleY: height / cssHeight };
    if (this.resource.mode === 'anaglyph') drawAnaglyph(ctx, this.resource, scaled, this.settings);
    else drawSbsImage(ctx, this.resource, scaled, this.settings);
  }
  setZoom(next, anchor) {
    const value = clamp(next, 0.5, 4);
    const previous = this.settings.zoom;
    if (value === previous) return;
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2; const cy = rect.height / 2;
    const ax = anchor?.x ?? cx; const ay = anchor?.y ?? cy;
    this.settings.panX = ax - cx - value / previous * (ax - cx - this.settings.panX);
    this.settings.panY = ay - cy - value / previous * (ay - cy - this.settings.panY);
    this.settings.zoom = value;
    this.changed();
  }
  pointerDown(event) {
    if (this.settings.locked || event.button !== 0 || this.closed) return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.initGesture();
  }
  pointerMove(event) {
    if (!this.pointers.has(event.pointerId) || this.settings.locked) return;
    event.preventDefault();
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      const [a,b] = [...this.pointers.values()];
      const mid = { x: (a.x+b.x)/2, y: (a.y+b.y)/2 };
      const dist = Math.hypot(a.x-b.x, a.y-b.y);
      const g = this.startGesture;
      if (!g) { this.initGesture(); return; }
      const zoom = clamp(g.zoom * dist / Math.max(5,g.distance),0.5,4);
      const ratio = zoom / g.zoom;
      const r = this.canvas.getBoundingClientRect();
      const centerX = r.left + r.width/2, centerY = r.top + r.height/2;
      this.settings.zoom = zoom;
      this.settings.panX = mid.x-centerX -ratio*(g.mid.x-centerX-g.panX);
      this.settings.panY = mid.y-centerY -ratio*(g.mid.y-centerY-g.panY);
    } else if (this.dragStart) {
      const p = [...this.pointers.values()][0];
      this.settings.panX = this.dragStart.panX + p.x-this.dragStart.x;
      this.settings.panY = this.dragStart.panY + p.y-this.dragStart.y;
    }
    this.changed();
  }
  pointerEnd(event) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    try { if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId); } catch {}
    this.initGesture();
  }
  initGesture() {
    this.startGesture = null; this.dragStart = null;
    if (this.pointers.size >= 2) {
      const [a,b] = [...this.pointers.values()];
      this.startGesture = { distance: Math.hypot(a.x-b.x,a.y-b.y), mid: {x:(a.x+b.x)/2,y:(a.y+b.y)/2}, zoom: this.settings.zoom, panX: this.settings.panX, panY: this.settings.panY };
    } else if (this.pointers.size === 1) {
      const p=[...this.pointers.values()][0];
      this.dragStart = { x:p.x,y:p.y,panX:this.settings.panX,panY:this.settings.panY };
    }
  }
  wheel(event) {
    if (this.settings.locked) return;
    event.preventDefault();
    const r=this.canvas.getBoundingClientRect();
    this.setZoom(this.settings.zoom * Math.exp(-event.deltaY * 0.0015), {x:event.clientX-r.left,y:event.clientY-r.top});
  }
  key(event) {
    if (this.settings.locked) return;
    const step = event.shiftKey ? 30 : 12;
    switch (event.key) {
      case 'ArrowLeft': this.settings.panX -= step; break;
      case 'ArrowRight': this.settings.panX += step; break;
      case 'ArrowUp': this.settings.panY -= step; break;
      case 'ArrowDown': this.settings.panY += step; break;
      case '+': case '=': this.setZoom(this.settings.zoom + .1); event.preventDefault(); return;
      case '-': case '_': this.setZoom(this.settings.zoom - .1); event.preventDefault(); return;
      default: return;
    }
    event.preventDefault(); this.changed();
  }
  changed() { this.requestDraw(); this.onChange?.(); }
  async download() {
    if (this.closed) throw new Error('La imagen ya no está disponible.');
    const rect = this.host?.getBoundingClientRect();
    if (!rect || rect.width < 2 || rect.height < 2) throw new Error('No se puede exportar una vista vacía.');
    const baseW = Math.max(this.resource.width, Math.ceil(rect.width * 2));
    const aspect = rect.width / rect.height;
    const maxPixels = 10_000_000;
    const outW = Math.max(1, Math.floor(Math.min(4096, baseW, Math.sqrt(maxPixels * aspect))));
    const outH = Math.max(1, Math.round(outW / aspect));
    const output = document.createElement('canvas'); output.width = outW; output.height = outH;
    const ctx = output.getContext('2d', {alpha:false});
    if (!ctx) throw new Error('Tu navegador no pudo preparar la descarga PNG.');
    this.paint(ctx, outW, outH, rect.width, rect.height);
    const blob = await new Promise((resolve,reject) => output.toBlob(v => v ? resolve(v) : reject(new Error('No se pudo codificar la imagen PNG.')), 'image/png'));
    output.width=0; output.height=0;
    return blob;
  }
  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.observer.disconnect();
    cancelAnimationFrame(this.raf); this.raf=0;
    for (const id of this.pointers.keys()) try { this.canvas.releasePointerCapture(id); } catch {}
    this.pointers.clear();
    this.canvas.removeEventListener('pointerdown',this.onPointerDown);
    this.canvas.removeEventListener('pointermove',this.onPointerMove);
    this.canvas.removeEventListener('pointerup',this.onPointerEnd);
    this.canvas.removeEventListener('pointercancel',this.onPointerEnd);
    this.canvas.removeEventListener('lostpointercapture',this.onPointerEnd);
    this.canvas.removeEventListener('wheel',this.onWheel);
    this.canvas.removeEventListener('keydown',this.onKey);
    this.canvas.remove();
    this.canvas.width=0; this.canvas.height=0; this.host=null;
  }
}
