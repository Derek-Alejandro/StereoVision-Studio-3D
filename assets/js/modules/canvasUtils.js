// Este módulo opera en unidades de la superficie de salida sin deformar las imágenes.
export function fitRect(sourceWidth, sourceHeight, boxWidth, boxHeight) {
  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}
export function drawContained(ctx, image, sx, sy, sw, sh, box, config) {
  const fitted = fitRect(sw, sh, box.w, box.h);
  const w = fitted.width * config.zoom;
  const h = fitted.height * config.zoom;
  const cx = box.x + box.w / 2 + config.panX + (config.offsetX || 0);
  const cy = box.y + box.h / 2 + config.panY + (config.offsetY || 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  if (config.filter) ctx.filter = config.filter;
  ctx.drawImage(image, sx, sy, sw, sh, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}
