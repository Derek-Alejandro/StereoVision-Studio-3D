export const MODES = Object.freeze({
  anaglyph: {
    title: 'Imágenes anaglifo', description: 'Ajusta tus imágenes rojo-cian de forma sencilla.', tag: 'ANAGLIFO',
    help: 'Importa una imagen anaglifo auténtica y utiliza lentes rojo-cian. El brillo y el contraste afectan solo la vista y la descarga ajustada.',
    extensions: 'JPG, PNG y WebP', accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp', kind: 'image',
  },
  'sbs-image': {
    title: 'Imágenes SBS', description: 'Alinea ambas perspectivas y prepara tu vista en 3D.', tag: 'IMAGEN SBS',
    help: 'La mitad izquierda se asigna al ojo izquierdo y la derecha al ojo derecho. Usa un par estereoscópico auténtico y ajusta con moderación.',
    extensions: 'JPG, PNG y WebP', accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp', kind: 'image',
  },
  'sbs-video': {
    title: 'Videos SBS', description: 'Reproduce tus videos estereoscópicos MP4 locales.', tag: 'VIDEO SBS',
    help: 'En esta fase el video se muestra en SBS original con controles nativos. El ajuste por ojo y modo VR serán parte de la etapa de video.',
    extensions: 'MP4 compatible', accept: '.mp4,video/mp4', kind: 'video',
  },
});
export const DEFAULT_MODE = 'anaglyph';
