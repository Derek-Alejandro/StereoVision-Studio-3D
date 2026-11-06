import { drawContained } from './canvasUtils.js';

function layer(canvas,sourceEye,channelEye,ctxWidth,ctxHeight,resource,size,c){
  if(canvas.width!==ctxWidth)canvas.width=ctxWidth;
  if(canvas.height!==ctxHeight)canvas.height=ctxHeight;
  const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:false});
  ctx.globalCompositeOperation='source-over';ctx.filter='none';
  ctx.fillStyle='#000';ctx.fillRect(0,0,ctxWidth,ctxHeight);
  const src=resource.type==='pair'
    ? (sourceEye===0?resource.left:resource.right)
    : {element:resource.element,width:resource.width,height:resource.height};
  const sideX=sourceEye===0?c.leftX:c.rightX;
  const sideY=sourceEye===0?c.leftY:c.rightY;
  const sign=channelEye===0?1:-1;
  drawContained(ctx,src.element,0,0,src.width,src.height,{x:0,y:0,w:ctxWidth,h:ctxHeight},{
    zoom:c.zoom,panX:(c.panX+sideX+sign*c.disparity/2)*size.scaleX,
    panY:(c.panY+sideY+sign*c.vertical/2)*size.scaleY,
    filter:`brightness(${c.brightness}%) contrast(${c.contrast}%)`,
  });
  // La multiplicación conserva solo R del ojo izquierdo o G/B del derecho.
  ctx.globalCompositeOperation='multiply';ctx.fillStyle=channelEye===0?'#ff0000':'#00ffff';
  ctx.fillRect(0,0,ctxWidth,ctxHeight);ctx.globalCompositeOperation='source-over';
}

// Anaglifo real: canal rojo de la izquierda + canales verde/azul de la derecha.
// En archivo ya anaglifo, separar sus canales posibilita desplazar cada ojo.
export function drawAnaglyph(ctx,resource,size,c,scratch){
  if(!scratch?.left||!scratch?.right)throw new Error('Faltan superficies de composición.');
  const sourceL=c.swap?1:0,sourceR=c.swap?0:1;
  layer(scratch.left,sourceL,0,size.width,size.height,resource,size,c);
  layer(scratch.right,sourceR,1,size.width,size.height,resource,size,c);
  ctx.save();ctx.globalCompositeOperation='source-over';
  ctx.drawImage(scratch.left,0,0);ctx.globalCompositeOperation='screen';
  ctx.drawImage(scratch.right,0,0);ctx.restore();
}
