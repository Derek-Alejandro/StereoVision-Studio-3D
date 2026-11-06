import { MODES } from '../utils/constants.js';

const $ = id => document.getElementById(id);
function formatBytes(size) {
  if (!Number.isFinite(size)) return '—';
  if (size < 1024) return `${size} B`;
  const units=['KB','MB','GB']; let n=size/1024; let i=0;
  while(n>=1024 && i<2){n/=1024;i++;}
  return `${n.toLocaleString('es-MX',{maximumFractionDigits:2})} ${units[i]}`;
}
function formatTime(seconds){
  if (!Number.isFinite(seconds)) return 'No disponible';
  const s=Math.floor(seconds), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=String(s%60).padStart(2,'0');
  return h ? `${h}:${String(m%60).padStart(2,'0')}:${sec}` : `${m}:${sec}`;
}
export function emptyContent(mode, loading=false) {
  const wrap=document.createElement('div'); wrap.className='empty-state';
  const icon=document.createElement('span'); icon.className='empty-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent=loading?'◌':'◧';
  const strong=document.createElement('strong'); strong.textContent=loading?'Preparando archivo…':'Tu imagen, a tu manera';
  const p=document.createElement('p'); p.textContent=loading?'Estamos verificando el formato.':'Elige un archivo para empezar. Puedes mover y ampliar las imágenes con los dedos.';
  wrap.append(icon,strong,p); return wrap;
}
export function renderStudio(state) {
  const {mode,status,resource,settings}=state;
  const conf=MODES[mode], isImage=!!resource && conf.kind==='image';
  document.querySelectorAll('[data-mode]').forEach(btn=>{
    const selected=btn.dataset.mode===mode; btn.classList.toggle('active',selected); btn.setAttribute('aria-pressed',String(selected));
  });
  $('studio-title').textContent=conf.title;
  $('studio-description').textContent=conf.description;
  $('viewer-mode').textContent=conf.tag;
  $('panel-mode-caption').textContent=mode==='anaglyph'?'Anaglifo':mode==='sbs-image'?'SBS':'Video';
  $('module-help').textContent=conf.help;
  $('file-input').accept=conf.accept;
  $('accepted-formats').textContent=conf.extensions;
  $('active-file-name').textContent=resource?.file.name ?? 'Ningún archivo seleccionado';
  $('active-file-name').title=resource?.file.name ?? '';
  $('clear-button').disabled=!resource && status!=='loading';
  $('import-button').disabled=status==='loading';
  $('state-indicator').dataset.state=status;
  $('state-text').textContent=({empty:'Sin archivo',loading:'Cargando…',ready:'Listo',playing:'Reproduciendo',paused:'Pausado',error:'Error'})[status]||status;
  $('viewer-resolution').textContent=resource?`${resource.width} × ${resource.height}`:'Vista previa';
  $('viewer-note').textContent=resource?'Vista local · El original permanece intacto':'Arrastra una imagen aquí o usa «Elegir archivo»';
  $('viewer-kind').textContent=resource?(conf.kind==='video'?'Video original':'Vista ajustable'):'Vista original';
  $('detail-name').textContent=resource?.file.name??'Ninguno';
  $('detail-format').textContent=resource?.file.name.split('.').pop().toUpperCase()??'—';
  $('detail-size').textContent=resource?formatBytes(resource.file.size):'—';
  $('detail-resolution').textContent=resource?`${resource.width} × ${resource.height} px`:'—';
  $('detail-duration').textContent=resource?.mode==='sbs-video'?formatTime(resource.duration):'—';
  $('no-content-hint').hidden=!!resource;
  $('image-controls').hidden=!isImage;
  $('video-controls').hidden=!(resource?.mode==='sbs-video');
  $('image-actions').hidden=!isImage;
  $('image-extra-actions').hidden=!isImage;
  $('gesture-help').hidden=!isImage;
  $('anaglyph-controls').hidden=mode!=='anaglyph';
  $('sbs-controls').hidden=mode!=='sbs-image';
  if (isImage) renderCalibration(state);
}
export function renderCalibration({settings,resource}) {
  if(!resource || resource.mode==='sbs-video') return;
  $('zoom-slider').value=String(Math.round(settings.zoom*100));
  $('zoom-value').value=`${Math.round(settings.zoom*100)}%`;
  $('zoom-value').textContent=`${Math.round(settings.zoom*100)}%`;
  for(const [id,value,unit] of [
    ['brightness',settings.brightness,'%'],['contrast',settings.contrast,'%'],
    ['disparity',settings.disparity,'%'],['vertical',settings.vertical,'%']]){
      $(id+'-slider').value=String(value);
      $(id+'-value').textContent=`${value>0&&id!=='brightness'&&id!=='contrast'?'+':''}${Number(value.toFixed(2))}${unit}`;
  }
  $('swap-eyes').checked=settings.swap;
  $('lock-button').setAttribute('aria-pressed',String(settings.locked));
  $('lock-button').classList.toggle('locked',settings.locked);
  $('lock-label').textContent=settings.locked?'Desbloquear':'Bloquear';
  $('lock-icon').textContent=settings.locked?'▣':'▢';
  $('lock-description').textContent=settings.locked?
    'Imagen bloqueada. Gestos y controles de ajuste desactivados; puedes abrir la vista limpia o descargar.':
    'Gestos habilitados. Mueve con un dedo y amplía con dos.';
  $('gesture-help').textContent=settings.locked?
    'Imagen bloqueada. Para volver a editar, usa «Desbloquear».':
    'Un dedo para mover · Dos dedos para ampliar · Bloquea para evitar movimientos accidentales.';
  for(const id of ['zoom-slider','zoom-out','zoom-in','brightness-slider','contrast-slider','disparity-slider','vertical-slider','swap-eyes','reset-button']) $(id).disabled=settings.locked;
}
export function setPlaybackState(status){
  $('state-indicator').dataset.state=status;
  $('state-text').textContent=({ready:'Listo',playing:'Reproduciendo',paused:'Pausado',error:'Error'})[status]||status;
}
export function setFeedback(message='',isError=false){
  const node=$('feedback'); node.hidden=!message; node.textContent=message;
  node.classList.toggle('error',isError); node.setAttribute('role',isError?'alert':'status');
}
