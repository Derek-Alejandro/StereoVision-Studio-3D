import { MODES } from '../utils/constants.js';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4']);

export class MediaLoadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MediaLoadError';
  }
}

function extensionOf(name = '') {
  return name.slice(name.lastIndexOf('.') + 1).toLowerCase();
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw new DOMException('Operación cancelada', 'AbortError');
}

function getSignature(bytes) {
  const matches = (prefix) => prefix.every((byte, i) => bytes[i] === byte);
  const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  if (matches([0xff, 0xd8, 0xff])) return 'jpeg';
  if (matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'webp';
  if (text(4, 8) === 'ftyp') return 'mp4';
  return 'unknown';
}

function waitUntil(element, eventName, signal, begin) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error = null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      element.removeEventListener(eventName, onReady);
      element.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
      error ? reject(error) : resolve();
    };
    const onReady = () => finish();
    const onError = () => finish(new MediaLoadError('No se pudo decodificar el archivo. Comprueba que no esté dañado y que su códec sea compatible con este navegador.'));
    const onAbort = () => finish(new DOMException('Operación cancelada', 'AbortError'));
    const timer = setTimeout(() => finish(new MediaLoadError('El archivo tardó demasiado en abrirse. Intenta con un archivo más pequeño o comprueba su compatibilidad.')), 30000);
    element.addEventListener(eventName, onReady, { once: true });
    element.addEventListener('error', onError, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    begin();
  });
}

export async function openLocalMedia(file, mode, signal) {
  if (!(file instanceof File)) throw new MediaLoadError('Selecciona un archivo local válido.');
  if (file.size === 0) throw new MediaLoadError('El archivo está vacío. Selecciona otro archivo.');
  if (!MODES[mode]) throw new MediaLoadError('Selecciona primero un módulo compatible.');
  const ext = extensionOf(file.name);
  const isVideo = MODES[mode].kind === 'video';
  const allowed = isVideo ? VIDEO_EXTENSIONS : IMAGE_EXTENSIONS;
  if (!allowed.has(ext)) throw new MediaLoadError(`Formato .${ext || 'desconocido'} no admitido en este módulo. Se aceptan: ${MODES[mode].extensions}.`);
  throwIfAborted(signal);
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  throwIfAborted(signal);
  const signature = getSignature(bytes);
  const expected = ext === 'jpg' ? 'jpeg' : ext;
  if (signature !== expected) throw new MediaLoadError('El contenido del archivo no corresponde a su extensión o está dañado. Selecciona un archivo JPG, PNG, WebP o MP4 auténtico.');
  if (isVideo && !document.createElement('video').canPlayType('video/mp4')) {
    throw new MediaLoadError('Este navegador no indica compatibilidad con MP4. Prueba con una versión MP4 H.264/AAC o utiliza otro navegador.');
  }

  const url = URL.createObjectURL(file);
  let element = null;
  try {
    if (isVideo) {
      element = document.createElement('video');
      element.preload = 'metadata';
      element.playsInline = true;
      element.setAttribute('playsinline', '');
      element.controls = true;
      await waitUntil(element, 'loadedmetadata', signal, () => { element.src = url; element.load(); });
    } else {
      element = new Image();
      element.alt = `Archivo local: ${file.name}`;
      await waitUntil(element, 'load', signal, () => { element.src = url; });
    }
    throwIfAborted(signal);
    const width = isVideo ? element.videoWidth : element.naturalWidth;
    const height = isVideo ? element.videoHeight : element.naturalHeight;
    if (width < 1 || height < 1) throw new MediaLoadError('No fue posible leer las dimensiones del contenido.');
    if (mode !== 'anaglyph' && width % 2 !== 0) throw new MediaLoadError('El contenido SBS debe tener un ancho par, para dividirlo en dos mitades iguales.');
    let released = false;
    return {
      file, mode, url, element, width, height,
      duration: isVideo ? element.duration : null,
      dispose() {
        if (released) return;
        released = true;
        if (element instanceof HTMLVideoElement) {
          element.pause();
          element.removeAttribute('src');
          element.load();
        } else {
          element.removeAttribute('src');
        }
        URL.revokeObjectURL(url);
      },
    };
  } catch (error) {
    if (element instanceof HTMLVideoElement) {
      element.pause();
      element.removeAttribute('src');
      element.load();
    } else if (element) {
      element.removeAttribute('src');
    }
    URL.revokeObjectURL(url);
    throw error;
  }
}
