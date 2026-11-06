import { drawContained } from './canvasUtils.js';
export function drawAnaglyph(ctx, resource, size, calibration) {
  drawContained(ctx, resource.element, 0, 0, resource.width, resource.height,
    { x: 0, y: 0, w: size.width, h: size.height },
    { zoom: calibration.zoom, panX: calibration.panX * size.scaleX,
      panY: calibration.panY * size.scaleY,
      filter: `brightness(${calibration.brightness}%) contrast(${calibration.contrast}%)` });
}
