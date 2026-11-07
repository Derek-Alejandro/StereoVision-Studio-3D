import {MODES} from '../utils/constants.js';
const $=id=>document.getElementById(id);
function formatBytes(size){if(!Number.isFinite(size))return '—';if(size<1024)return `${size} B`;const units=['KB','MB','GB'];let n=size/1024,i=0;while(n>=1024&&i<2){n/=1024;i++;}return `${n.toLocaleString('es-MX',{maximumFractionDigits:2})} ${units[i]}`;}
export function formatTime(seconds){if(!Number.isFinite(seconds))return '0:00';const n=Math.floor(seconds),h=Math.floor(n/3600),m=Math.floor((n%3600)/60),s=String(n%60).padStart(2,'0');return h?`${h}:${String(m%60).padStart(2,'0')}:${s}`:`${m}:${s}`;}
export function emptyContent(mode,loading=false,pending=false){
  const wrap=document.createElement('div');wrap.className='empty-state';
  const icon=document.createElement('span');icon.className='empty-icon';icon.setAttribute('aria-hidden','true');icon.textContent=loading?'◌':'◧';
  const strong=document.createElement('strong');strong.textContent=loading?'Preparando archivo…':pending?'Falta una perspectiva':'Tu imagen, a tu manera';
  const p=document.createElement('p');p.textContent=loading?'Estamos comprobando el contenido.':pending?'Selecciona la imagen de ambos ojos para formar una sola composición.':'Elige contenido auténticamente estereoscópico para comenzar.';
  wrap.append(icon,strong,p);return wrap;
}
export function renderStudio(state){
  const {mode,status,resource,settings,sourceType,draftFiles}=state;
  const conf=MODES[mode],isImage=!!resource&&conf.kind==='image',isVideo=!!resource&&conf.kind==='video';
  document.querySelectorAll('[data-mode]').forEach(btn=>{const selected=btn.dataset.mode===mode;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));});
  document.querySelectorAll('[data-source]').forEach(btn=>{const selected=btn.dataset.source===sourceType;btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected));});
  $('studio-title').textContent=conf.title;$('studio-description').textContent=conf.description;
  $('viewer-mode').textContent=conf.tag;$('panel-mode-caption').textContent=mode==='anaglyph'?'Anaglifo':mode==='sbs-image'?'SBS':'Video';
  $('module-help').textContent=conf.help;$('file-input').accept=conf.accept;$('accepted-formats').textContent=conf.extensions;
  $('source-choice').hidden=conf.kind==='video';
  $('single-import-actions').hidden=conf.kind==='image'&&sourceType==='pair';
  $('pair-import-actions').hidden=conf.kind!=='image'||sourceType!=='pair';
  $('left-file-label').textContent=draftFiles.left?.name||'+ Elegir imagen';
  $('right-file-label').textContent=draftFiles.right?.name||'+ Elegir imagen';
  $('clear-button').disabled=!resource&&status!=='loading';
  $('pair-clear-button').disabled=!resource&&!draftFiles.left&&!draftFiles.right;
  $('import-button').disabled=status==='loading';
  $('state-indicator').dataset.state=status;
  $('state-text').textContent=({empty:'Sin archivo',awaiting:'Falta un ojo',loading:'Cargando…',ready:'Listo',playing:'Reproduciendo',paused:'Pausado',error:'Error'})[status]||status;
  const fileNames=resource?.type==='pair'?`${resource.left.file.name} + ${resource.right.file.name}`:(resource?.file.name||'Ningún archivo seleccionado');
  $('active-file-name').textContent=fileNames;$('active-file-name').title=fileNames;
  $('viewer-resolution').textContent=resource?`${resource.width} × ${resource.height}`:'Vista previa';
  $('viewer-note').textContent=resource?'Composición local · Archivos originales intactos':'Elige un archivo para empezar';
  $('viewer-kind').textContent=resource?.type==='pair'?'Dos perspectivas':isVideo?'Video calibrable':isImage?'Vista ajustable':'Vista original';
  $('detail-name').textContent=fileNames;
  $('detail-format').textContent=resource?.type==='pair'?'2 fotografías':resource?.file.name.split('.').pop().toUpperCase()||'—';
  $('detail-size').textContent=resource?formatBytes(resource.type==='pair'?resource.left.file.size+resource.right.file.size:resource.file.size):'—';
  $('detail-resolution').textContent=resource?`${resource.width} × ${resource.height} px`:'—';
  $('detail-duration').textContent=isVideo?formatTime(resource.duration):'—';
  $('no-content-hint').hidden=!!resource;
  $('image-controls').hidden=!isImage;$('video-controls').hidden=!isVideo;$('video-playback').hidden=!isVideo;
  $('image-actions').hidden=!isImage;$('image-extra-actions').hidden=!isImage;$('gesture-help').hidden=!isImage;
  $('vr-image-button').hidden=!(isImage&&mode==='sbs-image');
  $('video-vr-actions').hidden=!isVideo;
  $('preset-panel').hidden=!resource;
  $('anaglyph-controls').hidden=mode!=='anaglyph';
  $('swap-eyes-row').hidden=mode==='anaglyph'&&resource?.type!=='pair';
  if(isImage||isVideo)renderCalibration(state);
  if(isVideo)renderPlayback(state);
}
const px=value=>`${value>0?'+':''}${Math.round(value)} px`;
export function renderCalibration({settings,resource}){
  if(!resource)return;
  const isImage=resource.mode!=='sbs-video',locked=!!settings.locked;
  if(isImage){
    $('zoom-slider').value=String(Math.round(settings.zoom*100));$('zoom-value').textContent=`${Math.round(settings.zoom*100)}%`;
    for(const id of ['brightness','contrast']){$(id+'-slider').value=String(settings[id]);$(id+'-value').textContent=`${Math.round(settings[id])}%`;}
    for(const id of ['disparity','vertical','leftX','leftY','rightX','rightY']){$(id+'-slider').value=String(settings[id]);$(id+'-value').textContent=px(settings[id]);}
    $('swap-eyes').checked=settings.swap;
    document.querySelectorAll('[data-move]').forEach(btn=>{const selected=btn.dataset.move===settings.moveTarget;btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected));btn.disabled=locked;});
    $('lock-button').setAttribute('aria-pressed',String(locked));$('lock-button').classList.toggle('locked',locked);
    $('lock-label').textContent=locked?'Desbloquear':'Bloquear';$('lock-icon').textContent=locked?'▣':'▢';
    $('lock-description').textContent=locked?'Imagen bloqueada. Puedes abrir la vista limpia o descargar sin modificar el ajuste.':'Arrastra con un dedo para mover la selección. Pellizca con dos para ampliar.';
    $('gesture-help').textContent=locked?'Imagen bloqueada. Desbloquea desde el panel para editar.':`Mover: ${settings.moveTarget==='both'?'ambos ojos':settings.moveTarget==='left'?'solo izquierdo':'solo derecho'} · Pellizca para ampliar · Bloquea al terminar.`;
    for(const id of ['zoom-slider','zoom-out','zoom-in','brightness-slider','contrast-slider','disparity-slider','vertical-slider','swap-eyes','leftX-slider','leftY-slider','rightX-slider','rightY-slider','reset-button'])$(id).disabled=locked;
  }else{
    $('video-zoom-slider').value=String(Math.round(settings.zoom*100));$('video-zoom-value').textContent=`${Math.round(settings.zoom*100)}%`;
    $('video-disparity-slider').value=String(settings.disparity);$('video-disparity-value').textContent=px(settings.disparity);
    $('video-swap-eyes').checked=settings.swap;
  }
  $('preset-apply').disabled=!$('preset-select').value||locked;
  $('preset-delete').disabled=!$('preset-select').value;
}
export function renderPlayback({resource}){
  if(!resource||resource.mode!=='sbs-video')return;
  const v=resource.element,duration=Number.isFinite(v.duration)?v.duration:0;
  $('video-play').textContent=v.paused?'▶ Reproducir':'❚❚ Pausar';
  $('video-progress').value=duration>0?String(Math.round(v.currentTime/duration*1000)):'0';
  $('video-progress').disabled=duration<=0;
  $('video-time').textContent=`${formatTime(v.currentTime)} / ${formatTime(duration)}`;
  $('video-volume').value=String(Math.round(v.volume*100));$('video-volume-value').textContent=`${Math.round(v.volume*100)}%`;
}
export function setPlaybackState(status){$('state-indicator').dataset.state=status;$('state-text').textContent=({ready:'Listo',playing:'Reproduciendo',paused:'Pausado',error:'Error'})[status]||status;}
export function setFeedback(message='',isError=false){const node=$('feedback');node.hidden=!message;node.textContent=message;node.classList.toggle('error',isError);node.setAttribute('role',isError?'alert':'status');}
