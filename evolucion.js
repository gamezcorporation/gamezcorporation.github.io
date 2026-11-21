/* Chekash · evolución web: entrada suave al hacer scroll y la secuencia de «Factura con IA». Sin dependencias. */
(() => {
  'use strict';
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const show = el => el.classList.add('is-in');
  const targets = $$('.sec-head,.calc-copy,.readout,.pv-grid>*,.plan,.faq-grid>*,.final-card,.ia-head,.ia-steps li,.ia-facts li,.ia-note');
  targets.forEach(el => el.classList.add('rv'));
  const duel = $$('[data-ia]');

  if (reduce || !('IntersectionObserver' in window)) {
    targets.concat(duel).forEach(show);
    return;
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  targets.concat(duel).forEach(el => io.observe(el));
  // Por si el navegador nunca avisa (pestañas en segundo plano, impresión): a los 4 s todo se ve.
  setTimeout(() => targets.concat(duel).forEach(show), 4000);
})();
