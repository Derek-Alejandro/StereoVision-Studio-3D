import {drawSbsImage} from './sbsImage.js';
import {drawSbsVideoFrame} from './sbsVideo.js';

// Previsualización Cardboard: dos regiones horizontales, un único origen de video.
// No crea otro reproductor ni modifica los ajustes/calibraciones del Studio.
export class VRViewer {
  constructor(resource, calibration) {
    if (!['sbs-image', 'sbs-video'].includes(resource?.mode)) {
      throw new Error('La vista Cardboard solo admite imágenes y videos SBS.');
    }
    this.resource = resource;
    this.calibration = calibration;
    this.video = resource.mode === 'sbs-video' ? resource.element : null;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vr-canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Vista Cardboard en paralelo: ojo izquierdo a la izquierda y ojo derecho a la derecha.');
    this.host = null;
    this.raf = 0;
    this.closed = false;
    this.observer = new ResizeObserver(() => this.requestDraw());
    this.onResize = () => this.requestDraw();
    this.onMediaEvent = () => this.requestDraw();
    if (this.video) {
      for (const event of ['loadeddata','loadedmetadata','playing','pause','seeked','timeupdate','ended','error','resize']) {
        this.video.addEventListener(event, this.onMediaEvent);
      }
    }
  }

  mount(host) {
    if (this.closed) return;
    this.host = host;
    host.replaceChildren(this.canvas);
    this.observer.observe(host);
    window.addEventListener('resize', this.onResize);
    window.visualViewport?.addEventListener('resize', this.onResize);
    this.requestDraw();
  }

  requestDraw() {
    if (this.closed || this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
      if (this.video && !this.video.paused && !this.video.ended && this.video.readyState >= 2) {
        this.requestDraw();
      }
    });
  }

  draw() {
    if (this.closed || !this.host) return;
    const bounds = this.host.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const limit = Math.min(1, Math.sqrt(4_000_000 / (bounds.width * bounds.height * dpr * dpr)));
    // Mantener paridad para que cada ojo ocupe exactamente la mitad.
    const width = Math.max(2, 2 * Math.round(bounds.width * dpr * limit / 2));
    const height = Math.max(1, Math.round(bounds.height * dpr * limit));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const context = this.canvas.getContext('2d', {alpha:false});
    if (!context) return;
    context.fillStyle = '#050607';
    context.fillRect(0, 0, width, height);
    const size = {
      width, height,
      scaleX: width / bounds.width,
      scaleY: height / bounds.height,
    };
    try {
      if (this.video) {
        if (this.video.readyState >= 2) {
          drawSbsVideoFrame(context, this.resource, size, this.calibration);
        } else {
          context.fillStyle = '#e3e9e4';
          context.textAlign = 'center';
          context.font = `${Math.max(13, Math.min(25, Math.round(height / 18)))}px system-ui`;
          for (let eye=0; eye<2; eye++) {
            context.fillText('Pulsa reproducir', (eye + .5) * width / 2, height / 2);
          }
        }
      } else {
        drawSbsImage(context, this.resource, size, this.calibration);
      }
    } catch (error) {
      // El error de un fotograma durante un seek no debe cerrar el visor.
      if (this.video && !this.video.paused) return;
      context.fillStyle = '#dce8dd';
      context.font = '14px system-ui';
      context.textAlign = 'center';
      context.fillText('No se pudo mostrar este fotograma', width/2, height/2);
    }
  }

  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.observer.disconnect();
    window.removeEventListener('resize', this.onResize);
    window.visualViewport?.removeEventListener('resize', this.onResize);
    if (this.video) {
      for (const event of ['loadeddata','loadedmetadata','playing','pause','seeked','timeupdate','ended','error','resize']) {
        this.video.removeEventListener(event, this.onMediaEvent);
      }
    }
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.canvas.remove();
    this.canvas.width = this.canvas.height = 0;
    this.host = null;
  }
}
