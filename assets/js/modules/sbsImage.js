import { drawContained } from './canvasUtils.js';

// Un mismo algoritmo para imagen SBS ya preparada, dos archivos separados y fotogramas MP4.
export function drawSbsImage(ctx, resource, size, c) {
  const half=size.width/2;
  for(let eye=0;eye<2;eye++) {
    const sourceEye=c.swap?1-eye:eye;
    const src = resource.type==='pair'
      ? (sourceEye===0?resource.left:resource.right)
      : {element:resource.element,width:resource.width/2,height:resource.height};
    const sx=resource.type==='pair'?0:sourceEye*resource.width/2;
    const sign=eye===0?1:-1;
    const sideX=sourceEye===0?c.leftX:c.rightX;
    const sideY=sourceEye===0?c.leftY:c.rightY;
    drawContained(ctx,src.element,sx,0,src.width,src.height,
      {x:eye*half,y:0,w:half,h:size.height},
      {zoom:c.zoom,panX:(c.panX+sideX+sign*c.disparity/2)*size.scaleX,
       panY:(c.panY+sideY+sign*c.vertical/2)*size.scaleY});
  }
  ctx.save();ctx.fillStyle='rgba(237,241,238,.54)';
  ctx.fillRect(Math.floor(half),0,Math.max(1,Math.round(size.scaleX)),size.height);ctx.restore();
}
