// Todos los desplazamientos se expresan en píxeles CSS (no en %).
// Cada importación crea un objeto nuevo para cumplir RN-08.
export const DEFAULT_CALIBRATION = Object.freeze({
  zoom: 1, panX: 0, panY: 0,
  brightness: 100, contrast: 100,
  disparity: 0, vertical: 0, swap: false,
  leftX: 0, leftY: 0, rightX: 0, rightY: 0,
  moveTarget: 'both', locked: false,
});
export function newCalibration() { return { ...DEFAULT_CALIBRATION }; }
export function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
export const VISUAL_FIELDS = Object.freeze([
  'zoom','panX','panY','brightness','contrast','disparity','vertical',
  'swap','leftX','leftY','rightX','rightY','moveTarget',
]);
export function cleanCalibration(raw={}) {
  const out=newCalibration();
  const ranges={zoom:[.5,4],panX:[-1800,1800],panY:[-1800,1800],
    brightness:[50,150],contrast:[50,150],disparity:[-80,80],vertical:[-80,80],
    leftX:[-180,180],leftY:[-180,180],rightX:[-180,180],rightY:[-180,180]};
  for(const [key,[lo,hi]] of Object.entries(ranges)) {
    if(raw[key] !== undefined && Number.isFinite(Number(raw[key]))) out[key]=clamp(raw[key],lo,hi);
  }
  out.swap=raw.swap===true;
  out.moveTarget=['both','left','right'].includes(raw.moveTarget)?raw.moveTarget:'both';
  return out;
}
