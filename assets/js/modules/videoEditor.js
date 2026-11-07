import {drawSbsVideoFrame} from './sbsVideo.js';
import {clamp} from './calibration.js';

// Un único elemento video alimenta ambas perspectivas; no hay dos reproductores.
export class VideoEditor {
  constructor(resource,settings,onUpdate){
    this.resource=resource;this.settings=settings;this.onUpdate=onUpdate;
    this.video=resource.element;this.video.controls=false;this.video.playsInline=true;
    this.video.setAttribute('playsinline','');this.video.preload='auto';
    this.canvas=document.createElement('canvas');this.canvas.className='video-canvas';
    this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Fotogramas SBS alineados de un único video');
    this.anchor=document.createElement('div');this.anchor.className='video-source-anchor';
    this.anchor.append(this.video);
    this.host=null;this.closed=false;this.raf=0;this.suspended=false;
    this.observer=new ResizeObserver(()=>this.requestDraw());
    this.onFrame=()=>this.requestDraw();
    this.onPlayback=()=>{this.onUpdate?.();this.requestDraw();if(!this.video.paused)this.runLoop();};
    for(const name of ['loadeddata','seeked','timeupdate','durationchange','volumechange','ended','play','pause','playing']){
      this.video.addEventListener(name,name==='loadeddata'||name==='seeked'?this.onFrame:this.onPlayback);
    }
  }
  mount(host){
    this.host=host;host.replaceChildren(this.canvas,this.anchor);this.observer.observe(host);
    this.requestDraw();if(!this.video.paused)this.runLoop();
  }
  runLoop(){
    if(this.closed||this.suspended||this.raf||this.video.paused)return;
    this.raf=requestAnimationFrame(()=>{
      this.raf=0;this.draw();if(!this.video.paused&&!this.video.ended)this.runLoop();
    });
  }
  requestDraw(){if(this.closed||this.suspended||this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.draw();if(!this.video.paused&&!this.video.ended)this.runLoop();});}
  draw(){
    if(!this.host||this.closed||this.suspended)return;
    const r=this.host.getBoundingClientRect();if(r.width<2||r.height<2)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    const limit=Math.min(1,Math.sqrt(3_200_000/(r.width*r.height*dpr*dpr)));
    const w=Math.max(1,Math.round(r.width*dpr*limit)),h=Math.max(1,Math.round(r.height*dpr*limit));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    const ctx=this.canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#111518';ctx.fillRect(0,0,w,h);
    if(this.video.readyState>=2){
      drawSbsVideoFrame(ctx,this.resource,{width:w,height:h,scaleX:w/r.width,scaleY:h/r.height},this.settings);
    }else{
      ctx.fillStyle='#c0cac5';ctx.textAlign='center';ctx.font=`${Math.max(13,Math.round(w/40))}px system-ui`;
      ctx.fillText('Pulsa reproducir para ver el video SBS',w/2,h/2);
    }
  }
  setZoom(next){this.settings.zoom=clamp(next,.5,4);this.requestDraw();this.onUpdate?.();}
  setSuspended(suspend){
    this.suspended=!!suspend;
    if(this.suspended){cancelAnimationFrame(this.raf);this.raf=0;}
    else this.requestDraw();
  }
  dispose(){
    if(this.closed)return;this.closed=true;this.observer.disconnect();cancelAnimationFrame(this.raf);
    for(const name of ['loadeddata','seeked','timeupdate','durationchange','volumechange','ended','play','pause','playing']){
      this.video.removeEventListener(name,name==='loadeddata'||name==='seeked'?this.onFrame:this.onPlayback);
    }
    this.canvas.remove();this.anchor.remove();this.canvas.width=this.canvas.height=0;this.host=null;
  }
}
