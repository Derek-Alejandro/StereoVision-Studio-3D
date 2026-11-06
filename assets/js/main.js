import { DEFAULT_MODE, MODES } from './utils/constants.js';
import { openLocalMedia } from './modules/fileManager.js';
import { renderSbsVideo } from './modules/sbsVideo.js';
import { ImageEditor } from './modules/imageEditor.js';
import { newCalibration, clamp } from './modules/calibration.js';
import { renderStudio, renderCalibration, emptyContent, setFeedback, setPlaybackState } from './modules/ui.js';

const $=id=>document.getElementById(id);
const stage=$('viewer-stage');
const fileInput=$('file-input');
const state={mode:DEFAULT_MODE,status:'empty',resource:null,controller:null,generation:0,settings:newCalibration(),editor:null,focus:false};
let dragDepth=0;

function clearFocus(){
  if (!state.focus) return;
  state.focus=false;
  document.body.classList.remove('focus-active');
  $('focus-overlay').hidden=true;
  if (state.editor && state.resource) state.editor.mount(stage);
  else $('focus-viewer').replaceChildren();
  $('preview-button').focus();
}
function disposeActive(){
  if(state.focus) clearFocus();
  state.controller?.abort(); state.controller=null;
  state.editor?.dispose(); state.editor=null;
  state.resource?.dispose(); state.resource=null;
  state.settings=newCalibration();
  state.generation++;
  state.status='empty';
  fileInput.value='';
  stage.replaceChildren();
}
function paintStage(){
  if(state.resource){
    if(state.resource.mode==='sbs-video') stage.replaceChildren(renderSbsVideo(state.resource));
    else {
      state.editor=new ImageEditor(state.resource,state.settings,()=>renderCalibration(state));
      state.editor.mount(stage);
    }
  } else stage.replaceChildren(emptyContent(state.mode,state.status==='loading'));
}
function chooseMode(mode){
  if(!MODES[mode] || state.mode===mode) return;
  disposeActive(); state.mode=mode; setFeedback();
  renderStudio(state); paintStage();
}
async function importFile(file){
  if(!file) return;
  disposeActive(); state.status='loading';
  state.controller=new AbortController();
  const generation=state.generation, mode=state.mode, controller=state.controller;
  setFeedback(); renderStudio(state); paintStage();
  try {
    const resource=await openLocalMedia(file,mode,controller.signal);
    if(generation!==state.generation || controller.signal.aborted){resource.dispose();return;}
    state.resource=resource; state.controller=null; state.status='ready';
    renderStudio(state); paintStage();
    if(mode==='sbs-video'){
      const video=resource.element;
      const sync=(status)=>{if(state.resource===resource){state.status=status;setPlaybackState(status);}};
      video.addEventListener('playing',()=>sync('playing'));
      video.addEventListener('pause',()=>sync('paused'));
      video.addEventListener('ended',()=>sync('paused'));
      video.addEventListener('error',()=>{if(state.resource===resource){sync('error');setFeedback('No se pudo reproducir este MP4. Usa un archivo compatible con el navegador (por ejemplo, H.264/AAC).',true);}});
    }
    setFeedback();
  }catch(error){
    if(generation!==state.generation || error.name==='AbortError') return;
    state.controller=null; state.status='error'; renderStudio(state); paintStage();
    setFeedback(error.message||'No se pudo abrir. Intenta con otro archivo.',true);
  }
}
function changeSetting(field,value){
  if(!state.editor || state.settings.locked) return;
  state.settings[field]=value;
  state.editor.requestDraw(); renderCalibration(state);
}
function changeZoom(next){
  if(!state.editor || state.settings.locked) return;
  state.editor.setZoom(next);
}
function resetSettings(){
  if(!state.editor || state.settings.locked) return;
  Object.assign(state.settings,newCalibration());
  state.editor.requestDraw(); renderCalibration(state);
  setFeedback();
}
function toggleLock(){
  if(!state.editor) return;
  state.settings.locked=!state.settings.locked;
  // Al bloquear, olvida cualquier gesto activo; no cambia la calibración.
  state.editor.pointers.clear(); state.editor.initGesture();
  state.editor.requestDraw(); renderCalibration(state);
}
function openFocus(){
  if(!state.editor || state.focus) return;
  state.focus=true;
  document.body.classList.add('focus-active');
  $('focus-overlay').hidden=false;
  state.editor.mount($('focus-viewer'));
  $('focus-hint').textContent=state.settings.locked?'Imagen bloqueada · Sal de la vista limpia para desbloquear.':'Desliza para mover o pellizca para ampliar. Sal de la vista para bloquear.';
  $('focus-exit').focus();
}
async function downloadCurrent(){
  const editor=state.editor, resource=state.resource;
  if(!editor || !resource || resource.mode==='sbs-video') return;
  const btn=$('download-button');
  btn.disabled=true; btn.textContent='Preparando PNG…';
  try{
    const blob=await editor.download();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const basename=resource.file.name.replace(/\.[^.]+$/,'').slice(0,90).replace(/[\\/:*?"<>|]/g,'_');
    a.href=url; a.download=`${basename||'imagen'}-stereovision.png`;
    document.body.append(a); a.click(); a.remove();
    // El archivo descargado es una nueva composición; el original nunca se altera.
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    setFeedback('PNG generado con la vista y calibración actuales. Tu archivo original sigue intacto.');
  }catch(error){setFeedback(error.message||'No se pudo preparar la descarga.',true);}
  finally{btn.disabled=false;btn.innerHTML='<span aria-hidden="true">↓</span> Descargar PNG';}
}

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>chooseMode(b.dataset.mode)));
$('import-button').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',()=>importFile(fileInput.files?.[0]));
$('clear-button').addEventListener('click',()=>{disposeActive();renderStudio(state);paintStage();setFeedback();});
$('zoom-slider').addEventListener('input',e=>changeZoom(Number(e.target.value)/100));
$('zoom-in').addEventListener('click',()=>changeZoom(state.settings.zoom+.1));
$('zoom-out').addEventListener('click',()=>changeZoom(state.settings.zoom-.1));
for(const id of ['brightness','contrast','disparity','vertical']){
  $(id+'-slider').addEventListener('input',e=>changeSetting(id,Number(e.target.value)));
}
$('swap-eyes').addEventListener('change',e=>changeSetting('swap',e.target.checked));
$('reset-button').addEventListener('click',resetSettings);
$('lock-button').addEventListener('click',toggleLock);
$('preview-button').addEventListener('click',openFocus);
$('focus-exit').addEventListener('click',clearFocus);
$('download-button').addEventListener('click',downloadCurrent);
document.addEventListener('keydown',event=>{if(event.key==='Escape' && state.focus)clearFocus();});
function hasFiles(event){return Array.from(event.dataTransfer?.types||[]).includes('Files');}
stage.addEventListener('dragenter',e=>{if(!hasFiles(e))return;e.preventDefault();dragDepth++;stage.classList.add('dragging');});
stage.addEventListener('dragover',e=>{if(hasFiles(e)){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
stage.addEventListener('dragleave',e=>{if(!hasFiles(e))return;dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)stage.classList.remove('dragging');});
stage.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;stage.classList.remove('dragging');if(hasFiles(e))importFile(e.dataTransfer.files?.[0]);});
window.addEventListener('dragover',e=>{if(hasFiles(e))e.preventDefault();});
window.addEventListener('drop',e=>{if(hasFiles(e))e.preventDefault();});
window.addEventListener('pagehide',disposeActive);
renderStudio(state);paintStage();
