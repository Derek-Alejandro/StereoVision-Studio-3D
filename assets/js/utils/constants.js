export const MODES = Object.freeze({
  anaglyph:{
    title:'Imágenes anaglifo',description:'Compón y alinea dos vistas para lentes rojo-cian.',tag:'ANAGLIFO',
    help:'Carga una imagen rojo-cian preparada o dos fotos con perspectivas distintas. El canal rojo proviene del ojo izquierdo y los canales verde/azul del derecho. El ajuste no inventa profundidad.',
    extensions:'JPG, PNG y WebP',accept:'.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',kind:'image',
  },
  'sbs-image':{
    title:'Imágenes SBS',description:'Dos perspectivas, control por ojo y ajuste táctil.',tag:'IMAGEN SBS',
    help:'Puedes cargar un SBS ya compuesto o las fotografías izquierda y derecha por separado. Mantén las vistas del ojo correcto y ajusta con cuidado.',
    extensions:'JPG, PNG y WebP',accept:'.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',kind:'image',
  },
  'sbs-video':{
    title:'Videos SBS',description:'Reproduce y calibra un MP4 estereoscópico desde tu dispositivo.',tag:'VIDEO SBS',
    help:'Las dos mitades se dibujan desde el mismo video y nunca usan reproductores separados. El modo VR se añadirá posteriormente.',
    extensions:'MP4 compatible',accept:'.mp4,video/mp4',kind:'video',
  },
});
export const DEFAULT_MODE='anaglyph';
