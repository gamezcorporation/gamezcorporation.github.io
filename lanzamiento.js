/* Chekash · lanzamiento: en iPhone/iPad avisa que es solo Android y deja compartir el enlace. */
(() => {
  'use strict';
  const url = 'https://play.google.com/store/apps/details?id=com.chekash.app';
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) document.documentElement.classList.add('is-ios');
  document.querySelectorAll('[data-share]').forEach(b => b.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Chekash', text: 'Escáner de precios para Android', url });
      else { await navigator.clipboard.writeText(url); b.textContent = 'Enlace copiado'; }
    } catch (_) {}
  }));
})();
