export function renderSbsVideo(resource) {
  const wrap = document.createElement('div');
  wrap.className = 'video-preview';
  resource.element.controls = true;
  resource.element.playsInline = true;
  resource.element.setAttribute('playsinline', '');
  wrap.append(resource.element);
  return wrap;
}
