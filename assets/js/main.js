import {DEFAULT_MODE,MODES} from './utils/constants.js';
import {openLocalMedia,openStereoPair} from './modules/fileManager.js';
import {ImageEditor} from './modules/imageEditor.js';
import {VideoEditor} from './modules/videoEditor.js';
import {newCalibration,cleanCalibration,clamp} from './modules/calibration.js';
import {renderStudio,renderCalibration,renderPlayback,emptyContent,setFeedback,setPlaybackState} from './modules/ui.js';
import {listPresets,savePreset,deletePreset,getPreset} from './modules/presetStore.js';
const $=id=>document.getElementById(id);
const stage=$('viewer-stage'),fileInput=$('file-input');
const state={mode:DEFAULT_MODE,sourceType:'combined',status:'empty',resource:null,controller:null,generation:0,
  settings:newCalibration(),editor:null,focus:false,draftFiles:{left:null,right:null}};
let dragDepth=0;

function clearFocus(){
  if(!state.focus)return;
  state.focus=false;document.body.classList.remove('focus-active');$('focus-overlay').hidden=true;
  if(state.editor&&state.resource)state.editor.mount(stage);else $('focus-viewer').replaceChildren();
  $('preview-button').focus();
}
function disposeActive(clearDraft=true){
  if(state.focus)clearFocus();
  state.controller?.abort();state.controller=null;
  state.editor?.dispose();state.editor=null;
  state.resource?.dispose();state.resource=null;
  state.settings=newCalibration();state.generation++;state.status='empty';
  fileInput.value='';$('left-file-input').value='';$('right-file-input').value='';
  if(clearDraft)state.draftFiles={left:null,right:null};
  stage.replaceChildren();
}
function paintStage(){
  if(!state.resource){stage.replaceChildren(emptyContent(state.mode,state.status==='loading',state.status==='awaiting'));return;}
  state.editor=state.resource.mode==='sbs-video'
    ?new VideoEditor(state.resource,state.settings,()=>renderPlayback(state))
    :new ImageEditor(state.resource,state.settings,()=>renderCalibration(state));
  state.editor.mount(stage);
}
function renderPresets(selectedId=''){
  const select=$('preset-select');select.replaceChildren();
  select.add(new Option('Selecciona un ajuste…',''));
  for(const row of listPresets(state.mode))select.add(new Option(row.name,row.id));
  select.value=selectedId&&listPresets(state.mode).some(row=>row.id===selectedId)?selectedId:'';
  $('preset-apply').disabled=!select.value||state.settings.locked||!state.resource;
  $('preset-delete').disabled=!select.value;
}
function chooseMode(mode){
  if(!MODES[mode]||state.mode===mode)return;
  disposeActive();state.mode=mode;state.sourceType='combined';
  setFeedback();renderStudio(state);renderPresets();paintStage();
}
function chooseSource(source){
  if(source===state.sourceType||!['combined','pair'].includes(source)||MODES[state.mode].kind!=='image')return;
  disposeActive();state.sourceType=source;setFeedback();renderStudio(state);paintStage();
}
function startLoad(loader){
  disposeActive(false);state.status='loading';
  const controller=new AbortController();state.controller=controller;
  const generation=state.generation,mode=state.mode;
  setFeedback();renderStudio(state);paintStage();
  (async()=>{
    try{
      const resource=await loader(mode,controller.signal);
      if(generation!==state.generation||controller.signal.aborted){resource.dispose();return;}
      state.resource=resource;state.controller=null;state.status='ready';
      renderStudio(state);paintStage();renderPresets();setFeedback();
      if(mode==='sbs-video'){
        const video=resource.element;
        const sync=()=>{
          if(state.resource!==resource)return;
          state.status=video.paused?'paused':'playing';setPlaybackState(state.status);renderPlayback(state);
        };
        for(const ev of ['play','playing','pause','ended'])video.addEventListener(ev,sync);
        video.addEventListener('error',()=>{
          if(state.resource!==resource)return;
          state.status='error';setPlaybackState('error');
          setFeedback('No se pudo reproducir el MP4. Prueba un archivo H.264/AAC compatible con tu teléfono.',true);
        });
      }
    }catch(error){
      if(generation!==state.generation||error.name==='AbortError')return;
      state.controller=null;state.status='error';renderStudio(state);paintStage();
      setFeedback(error.message||'No se pudo leer el contenido. Selecciona otros archivos.',true);
    }
  })();
}
function importFile(file){if(!file)return;startLoad((mode,signal)=>openLocalMedia(file,mode,signal));}
function importPairSide(side,file){
  if(!file||!['left','right'].includes(side))return;
  disposeActive(false);state.draftFiles[side]=file;
  const {left,right}=state.draftFiles;
  if(left&&right){
    // Capturamos referencias estables antes del loader asíncrono.
    startLoad((mode,signal)=>openStereoPair(left,right,mode,signal));
  }else{
    state.status='awaiting';setFeedback();renderStudio(state);paintStage();
  }
}
function changeSetting(field,value){
  if(!state.editor||state.settings.locked)return;
  state.settings[field]=value;state.editor.requestDraw();renderCalibration(state);
}
function changeZoom(next){if(!state.editor||state.settings.locked)return;state.editor.setZoom(next);renderCalibration(state);}
function resetSettings(){
  if(!state.editor||state.settings.locked)return;
  Object.assign(state.settings,newCalibration());state.editor.requestDraw();renderCalibration(state);setFeedback('Ajustes restablecidos.');
}
function toggleLock(){
  if(!state.editor||state.resource?.mode==='sbs-video')return;
  state.settings.locked=!state.settings.locked;
  state.editor.pointers.clear();state.editor.initGesture();
  state.editor.requestDraw();renderCalibration(state);
}
function openFocus(){
  if(!state.editor||state.resource?.mode==='sbs-video'||state.focus)return;
  state.focus=true;document.body.classList.add('focus-active');$('focus-overlay').hidden=false;
  state.editor.mount($('focus-viewer'));
  $('focus-hint').textContent=state.settings.locked?'Imagen bloqueada · Sal de la vista para desbloquear.':'Desliza para mover la selección o pellizca para ampliar.';
  $('focus-exit').focus();
}
async function downloadCurrent(){
  const editor=state.editor,resource=state.resource;
  if(!editor||!resource||resource.mode==='sbs-video')return;
  const btn=$('download-button');btn.disabled=true;btn.textContent='Preparando PNG…';
  try{
    const blob=await editor.download();
    if(state.resource!==resource)throw new Error('Cambiaste de archivo durante la descarga.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    const basename=resource.file.name.replace(/\.[^.]+$/,'').slice(0,70).replace(/[\\/:*?"<>|]/g,'_');
    a.href=url;a.download=`${basename||'imagen'}-${resource.mode==='anaglyph'?'anaglifo':'sbs'}-calibrado.png`;
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    setFeedback('PNG exportado con los ajustes visibles. Los archivos originales no cambian.');
  }catch(error){setFeedback(error.message||'No se pudo generar el PNG.',true);}
  finally{btn.disabled=false;btn.innerHTML='<span aria-hidden="true">↓</span> Descargar PNG';}
}
function currentVideo(){return state.resource?.mode==='sbs-video'?state.resource.element:null;}
function seekVideo(delta){const v=currentVideo();if(!v||!Number.isFinite(v.duration))return;v.currentTime=clamp(v.currentTime+delta,0,v.duration);}
function saveCurrentPreset(){
  if(!state.resource)return;
  try{
    const record=savePreset(state.mode,$('preset-name').value,state.settings);
    $('preset-name').value='';renderPresets(record.id);
    setFeedback(`Ajuste «${record.name}» guardado localmente para este módulo.`);
  }catch(error){setFeedback(error.message,true);}
}
function applySelectedPreset(){
  if(!state.editor||state.settings.locked)return;
  const record=getPreset(state.mode,$('preset-select').value);if(!record)return;
  Object.assign(state.settings,cleanCalibration(record.values));
  // Mantener controles fuera de alcance del video en sus valores por defecto.
  if(state.mode==='sbs-video')Object.assign(state.settings,{panX:0,panY:0,vertical:0,leftX:0,leftY:0,rightX:0,rightY:0});
  state.editor.requestDraw();renderCalibration(state);
  setFeedback(`Ajuste «${record.name}» aplicado. Archivo original intacto.`);
}
function deleteSelectedPreset(){
  const record=getPreset(state.mode,$('preset-select').value);if(!record)return;
  try{deletePreset(state.mode,record.id);renderPresets();setFeedback(`Ajuste «${record.name}» eliminado.`);}
  catch(error){setFeedback(error.message,true);}
}

document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>chooseMode(btn.dataset.mode)));
document.querySelectorAll('[data-source]').forEach(btn=>btn.addEventListener('click',()=>chooseSource(btn.dataset.source)));
$('import-button').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',()=>importFile(fileInput.files?.[0]));
for(const side of ['left','right'])$(side+'-file-input').addEventListener('change',event=>importPairSide(side,event.target.files?.[0]));
$('clear-button').addEventListener('click',()=>{disposeActive();renderStudio(state);paintStage();setFeedback();});
$('pair-clear-button').addEventListener('click',()=>{disposeActive();renderStudio(state);paintStage();setFeedback();});
$('zoom-slider').addEventListener('input',event=>changeZoom(Number(event.target.value)/100));
$('zoom-in').addEventListener('click',()=>changeZoom(state.settings.zoom+.1));
$('zoom-out').addEventListener('click',()=>changeZoom(state.settings.zoom-.1));
for(const id of ['brightness','contrast','disparity','vertical','leftX','leftY','rightX','rightY']){
  $(id+'-slider').addEventListener('input',event=>changeSetting(id,Number(event.target.value)));
}
$('swap-eyes').addEventListener('change',event=>changeSetting('swap',event.target.checked));
for(const btn of document.querySelectorAll('[data-move]'))btn.addEventListener('click',()=>changeSetting('moveTarget',btn.dataset.move));
$('reset-button').addEventListener('click',resetSettings);
$('lock-button').addEventListener('click',toggleLock);
$('preview-button').addEventListener('click',openFocus);$('focus-exit').addEventListener('click',clearFocus);
$('download-button').addEventListener('click',downloadCurrent);
$('video-zoom-slider').addEventListener('input',event=>changeZoom(Number(event.target.value)/100));
$('video-disparity-slider').addEventListener('input',event=>changeSetting('disparity',Number(event.target.value)));
$('video-swap-eyes').addEventListener('change',event=>changeSetting('swap',event.target.checked));
$('video-reset-button').addEventListener('click',resetSettings);
$('video-play').addEventListener('click',async()=>{
  const v=currentVideo();if(!v)return;
  if(!v.paused){v.pause();return;}
  try{await v.play();}catch(error){setFeedback(`El navegador no permitió reproducir el video: ${error.message}. Toca de nuevo «Reproducir» o usa un MP4 compatible.`,true);}
});
$('video-back').addEventListener('click',()=>seekVideo(-10));$('video-forward').addEventListener('click',()=>seekVideo(10));
$('video-progress').addEventListener('input',event=>{
  const v=currentVideo();if(v&&Number.isFinite(v.duration)&&v.duration>0)v.currentTime=Number(event.target.value)/1000*v.duration;
});
$('video-volume').addEventListener('input',event=>{
  const v=currentVideo();if(v){v.volume=Number(event.target.value)/100;v.muted=v.volume===0;renderPlayback(state);}
});
$('preset-save').addEventListener('click',saveCurrentPreset);
$('preset-apply').addEventListener('click',applySelectedPreset);
$('preset-delete').addEventListener('click',deleteSelectedPreset);
$('preset-select').addEventListener('change',()=>{
  $('preset-apply').disabled=!$('preset-select').value||state.settings.locked||!state.resource;
  $('preset-delete').disabled=!$('preset-select').value;
});
$('preset-name').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();saveCurrentPreset();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.focus)clearFocus();});
function hasFiles(event){return Array.from(event.dataTransfer?.types||[]).includes('Files');}
stage.addEventListener('dragenter',event=>{if(!hasFiles(event))return;event.preventDefault();dragDepth++;stage.classList.add('dragging');});
stage.addEventListener('dragover',event=>{if(hasFiles(event)){event.preventDefault();event.dataTransfer.dropEffect='copy';}});
stage.addEventListener('dragleave',event=>{if(!hasFiles(event))return;dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)stage.classList.remove('dragging');});
stage.addEventListener('drop',event=>{
  event.preventDefault();dragDepth=0;stage.classList.remove('dragging');
  if(!hasFiles(event))return;
  if(state.sourceType==='pair'&&MODES[state.mode].kind==='image')setFeedback('Para cargar dos fotografías, usa los botones «Ojo izquierdo» y «Ojo derecho».',true);
  else importFile(event.dataTransfer.files?.[0]);
});
window.addEventListener('dragover',event=>{if(hasFiles(event))event.preventDefault();});
window.addEventListener('drop',event=>{if(hasFiles(event))event.preventDefault();});
window.addEventListener('pagehide',()=>disposeActive());
renderStudio(state);renderPresets();paintStage();
