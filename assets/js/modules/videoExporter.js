import {drawSbsVideoFrame} from './sbsVideo.js';
import {cleanCalibration} from './calibration.js';
import {addWebmDuration} from './webmDuration.js';

// Exportación local a velocidad real. Se captura un único video fuente para ambos ojos.
// El formato depende exclusivamente de los codificadores MediaRecorder disponibles.
const AUDIO_GRAPHS = new WeakMap();
const FPS = 25;

export class VideoExportError extends Error {}

export function exportSupported() {
  return typeof window.MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    typeof window.MediaStream !== 'undefined';
}

function chooseRecorderType(audio) {
  if (!exportSupported()) throw new VideoExportError('Este navegador no ofrece grabación desde Canvas. Prueba Chrome/Edge en Android o Safari actualizado, o utiliza un navegador de escritorio.');
  const mp4 = audio
    ? ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4']
    : ['video/mp4;codecs="avc1.42E01E"', 'video/mp4'];
  const webm = audio
    ? ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm']
    : ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'];
  // En Chromium algunos codificadores anuncian MP4 aunque produzcan VP9/Opus,
  // combinación poco interoperable con otros dispositivos. Por defecto WebM.
  const appleWebKit = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Safari/.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR/.test(navigator.userAgent));
  return [...(appleWebKit?mp4:webm),...(appleWebKit?webm:mp4)]
    .find(type => MediaRecorder.isTypeSupported(type)) || null;
}

function outputResolution(width,height) {
  // Conservamos la relación de aspecto del SBS de origen y limitamos la RAM en móvil.
  const mobile = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
  const maxWidth=mobile?1920:3840, maxPixels=mobile?2_600_000:6_000_000;
  const factor=Math.min(1,maxWidth/width,Math.sqrt(maxPixels/(width*height)));
  // Se redondea a un número par para que ambos ojos midan exactamente lo mismo.
  const w=Math.max(2,Math.floor(width*factor/2)*2);
  const h=Math.max(2,Math.floor(height*w/width));
  return {width:w,height:h};
}

function audioGraph(video) {
  const saved=AUDIO_GRAPHS.get(video);
  if(saved) return saved;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx) throw new VideoExportError('No es posible capturar el audio con este navegador. Desmarca «Incluir audio» para exportar sin sonido.');
  const context=new AudioCtx();
  let source;
  try {
    source=context.createMediaElementSource(video);
    // Mantiene la reproducción audible en el visor tras finalizar la exportación.
    source.connect(context.destination);
  } catch(e) {
    context.close().catch(()=>{});
    throw new VideoExportError('No fue posible preparar el audio. Desmarca «Incluir audio» y prueba de nuevo.');
  }
  const graph={context,source};
  AUDIO_GRAPHS.set(video,graph);
  return graph;
}

export function releaseAudioGraph(video) {
  const graph=AUDIO_GRAPHS.get(video);
  if(!graph) return;
  AUDIO_GRAPHS.delete(video);
  graph.source.disconnect();
  graph.context.close().catch(()=>{});
}

export class VideoExporter {
  constructor(resource,settings,{withAudio=true,onProgress=()=>{},onStatus=()=>{}}={}) {
    this.resource=resource;
    this.settings=cleanCalibration(settings);
    this.withAudio=withAudio;
    this.onProgress=onProgress;
    this.onStatus=onStatus;
    this.aborted=false;
    this.abortReason='Exportación cancelada.';
    this.cancelNow=null;
    this.finished=false;
  }

  cancel(reason='Exportación cancelada.') {
    this.aborted=true;this.abortReason=reason;
    this.cancelNow?.();
  }

  async start() {
    const video=this.resource.element;
    const duration=video.duration;
    if(!exportSupported()) throw new VideoExportError('La exportación de video no es compatible con este navegador. Comprueba que admite MediaRecorder y Canvas.captureStream.');
    if(!Number.isFinite(duration)||duration<=0)throw new VideoExportError('El video no tiene una duración válida para exportarlo.');
    if(video.readyState<2)throw new VideoExportError('Reproduce unos segundos el video y vuelve a intentar la exportación.');
    if(this.aborted)throw new VideoExportError(this.abortReason);

    const {width,height}=outputResolution(this.resource.width,this.resource.height);
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false,desynchronized:false});
    if(!ctx)throw new VideoExportError('No se pudo preparar la superficie de video.');
    const host=document.getElementById('viewer-stage').getBoundingClientRect();
    const displayWidth=Math.max(2,host.width),displayHeight=Math.max(2,host.height);
    const size={width,height,scaleX:width/displayWidth,scaleY:height/displayHeight};
    const paint=()=>{
      ctx.fillStyle='#111518';ctx.fillRect(0,0,width,height);
      if(video.readyState>=2)drawSbsVideoFrame(ctx,this.resource,size,this.settings);
    };
    paint();

    let stream,recorder,dest,graph,audioResume,drawId=0,rvfcId=0,stopTimer=0,doneResolve,doneReject;
    const snapshot={time:video.currentTime,paused:video.paused};
    const chunks=[];
    const cleanup=()=>{
      clearTimeout(stopTimer);
      if(drawId)cancelAnimationFrame(drawId);
      if(rvfcId&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(rvfcId);
      video.removeEventListener('ended',end);
      video.removeEventListener('error',mediaError);
      video.removeEventListener('pause',unexpectedPause);
      for(const track of stream?.getTracks()||[])track.stop();
      try{if(dest&&graph)graph.source.disconnect(dest);}catch{}
      try{if(recorder?.state==='recording')recorder.stop();}catch{}
      try{if(!video.paused)video.pause();}catch{}
      try{if(Number.isFinite(snapshot.time))video.currentTime=snapshot.time;}catch{}
      // No reanudamos automáticamente: en iOS la reproducción requiere un gesto del usuario.
      canvas.width=canvas.height=0;
      this.cancelNow=null;
      this.finished=true;
    };
    const complete=(error,result)=>{
      if(this.finished)return;
      cleanup();
      if(error)doneReject(error);else doneResolve(result);
    };
    const fail=(message)=>complete(new VideoExportError(message));
    const end=()=>{
      this.onProgress(100);
      paint();
      stopTimer=setTimeout(()=>{
        if(recorder?.state==='recording')recorder.stop();
      },110);
    };
    const mediaError=()=>fail('El video presentó un error durante la exportación. Prueba otro MP4 compatible.');
    let recordingStarted=false;
    const unexpectedPause=()=>{
      if(recordingStarted&&!video.ended&&!this.aborted)fail('El video se pausó durante la exportación. Mantén la pestaña visible y vuelve a intentarlo.');
    };
    const draw=()=>{
      if(this.finished||this.aborted)return;
      paint();
      this.onProgress(Math.min(99,Math.max(0,video.currentTime/duration*100)));
      if(video.requestVideoFrameCallback)rvfcId=video.requestVideoFrameCallback(draw);
      else drawId=requestAnimationFrame(draw);
    };
    const mimeType=chooseRecorderType(this.withAudio);
    if(!mimeType){canvas.width=canvas.height=0;throw new VideoExportError('No hay un codificador MP4/WebM compatible con esta opción. Intenta exportar sin audio o utiliza otro navegador.');}

    let promise;
    try {
      const canvasStream=canvas.captureStream(FPS);
      stream=new MediaStream(canvasStream.getVideoTracks());
      if(!stream.getVideoTracks().length)throw new VideoExportError('El navegador no permitió capturar el video renderizado.');
      if(this.withAudio){
        graph=audioGraph(video);
        dest=graph.context.createMediaStreamDestination();
        graph.source.connect(dest);
        dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
        // Importante: invocar resume dentro del gesto de clic; no bloquear el play.
        audioResume=graph.context.resume();
      }
      recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:Math.min(12_000_000,Math.max(2_200_000,width*height*2.0)),audioBitsPerSecond:128_000});
      promise=new Promise((resolve,reject)=>{doneResolve=resolve;doneReject=reject;});
      this.cancelNow=()=>complete(new VideoExportError(this.abortReason));
      recorder.addEventListener('dataavailable',event=>{if(event.data?.size)chunks.push(event.data);});
      recorder.addEventListener('error',()=>fail('Falló la codificación del video. Puede que tu navegador no admita esta combinación de audio y video.'));
      recorder.addEventListener('stop',async()=>{
        if(this.finished)return;
        if(this.aborted){fail(this.abortReason);return;}
        if(!chunks.length){fail('La codificación finalizó sin producir video. Prueba otro navegador.');return;}
        const actual=recorder.mimeType||mimeType;
        const extension=actual.toLowerCase().includes('mp4')?'mp4':'webm';
        let blob=new Blob(chunks,{type:actual});
        try{if(extension==='webm')blob=await addWebmDuration(blob,duration);}catch{}
        complete(null,{blob,extension,width,height,withAudio:this.withAudio});
      });
      video.pause();
      video.currentTime=0;
      video.addEventListener('ended',end);
      video.addEventListener('error',mediaError);
      video.addEventListener('pause',unexpectedPause);
      this.onStatus(`Grabando en ${mimeType.includes('mp4')?'MP4':'WebM'} a ${width} × ${height} · Tiempo real`);
      recorder.start(1000);
      recordingStarted=true;
      // Llamada directa al play() durante el clic para respetar las políticas móviles.
      const started=video.play();
      draw();
      started.catch(error=>fail(`No se pudo iniciar la exportación. Pulsa «Exportar video» de nuevo después de reproducir el MP4. (${error.message})`));
      audioResume?.then(()=>{
        if(!this.finished&&graph.context.state!=='running')fail('No se pudo activar la captura de audio. Exporta sin sonido o vuelve a pulsar después de iniciar la reproducción.');
      }).catch(()=>fail('No se pudo activar el audio. Desmarca «Incluir audio» para exportar sin sonido.'));
      return await promise;
    } catch(error){
      if(promise&&!this.finished)complete(error);
      else {
        for(const track of stream?.getTracks()||[])track.stop();
        try{if(dest&&graph)graph.source.disconnect(dest);}catch{}
        canvas.width=canvas.height=0;
      }
      throw error;
    }
  }
}
