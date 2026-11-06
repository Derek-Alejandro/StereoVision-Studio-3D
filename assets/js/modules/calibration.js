export const DEFAULT_CALIBRATION = Object.freeze({
  zoom: 1, panX: 0, panY: 0, brightness: 100, contrast: 100,
  disparity: 0, vertical: 0, swap: false, locked: false,
});
export function newCalibration() { return { ...DEFAULT_CALIBRATION }; }
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
