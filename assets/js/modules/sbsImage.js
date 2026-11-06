import { drawContained } from './canvasUtils.js';
export function drawSbsImage(ctx, resource, size, calibration) {
  const half = size.width / 2;
  const verticalShift = size.height * calibration.vertical / 200;
  const horizontalShift = half * calibration.disparity / 200;
  for (let eye = 0; eye < 2; eye++) {
    const sourceEye = calibration.swap ? 1 - eye : eye;
    const sign = eye === 0 ? 1 : -1;
    drawContained(ctx, resource.element, sourceEye * resource.width / 2, 0, resource.width / 2, resource.height,
      { x: eye * half, y: 0, w: half, h: size.height },
      { zoom: calibration.zoom, panX: calibration.panX * size.scaleX,
        panY: calibration.panY * size.scaleY,
        offsetX: sign * horizontalShift, offsetY: sign * verticalShift });
  }
  ctx.save();
  ctx.fillStyle = '#777b81';
  ctx.fillRect(Math.floor(half), 0, Math.max(1, size.scaleX), size.height);
  ctx.restore();
}
