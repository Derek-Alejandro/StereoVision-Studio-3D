import { drawSbsImage } from './sbsImage.js';

// Encapsula el render SBS de video: ambas vistas provienen del mismo fotograma.
// La reproducción y eventos se gestionan exclusivamente desde videoEditor.js.
export function drawSbsVideoFrame(ctx, resource, size, calibration) {
  drawSbsImage(ctx, resource, size, calibration);
}
