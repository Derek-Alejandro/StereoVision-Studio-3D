import {VISUAL_FIELDS,cleanCalibration} from './calibration.js';
const KEY='StereoVisionStudio3D.presets.v1';
const MAX=12;
function all(){
  try { const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}; }
  catch {return {};}
}
export function listPresets(mode){return Array.isArray(all()[mode])?all()[mode].filter(v=>v&&typeof v.name==='string'):[];}
export function savePreset(mode,name,settings){
  name=(name||'').trim().slice(0,48);
  if(!name) throw new Error('Escribe un nombre para guardar el ajuste.');
  const data=all();const rows=listPresets(mode);
  const previous=rows.findIndex(row=>row.name.toLocaleLowerCase()===name.toLocaleLowerCase());
  const clean=cleanCalibration(settings);
  const values=Object.fromEntries(VISUAL_FIELDS.map(key=>[key,clean[key]]));
  const record={id:previous>=0?rows[previous].id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name,values};
  if(previous>=0)rows.splice(previous,1);
  rows.unshift(record);data[mode]=rows.slice(0,MAX);
  try {localStorage.setItem(KEY,JSON.stringify(data));}
  catch {throw new Error('Este navegador no permite guardar ajustes locales. Revisa el espacio o los permisos de almacenamiento.');}
  return record;
}
export function deletePreset(mode,id){
  const data=all();data[mode]=listPresets(mode).filter(row=>row.id!==id);
  try {localStorage.setItem(KEY,JSON.stringify(data));}
  catch {throw new Error('No se pudo eliminar el ajuste guardado.');}
}
export function getPreset(mode,id){return listPresets(mode).find(row=>row.id===id)||null;}
