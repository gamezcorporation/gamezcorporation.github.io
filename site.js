/* Chekash · comportamiento compartido (menú, Google Play, índice legal). Sin dependencias. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIGURACIÓN: cuando la app esté publicada, pega aquí el enlace de
     Google Play (https://play.google.com/store/apps/details?id=com.chekash.app).
     Con eso, todos los avisos de «próximamente» pasan solos a «Descargar».
     ------------------------------------------------------------------ */
  const PLAY_URL = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Google Play ---------- */
  if (PLAY_URL) {
    $$('[data-play]').forEach(el => {
      el.setAttribute('href', PLAY_URL);
      el.setAttribute('rel', 'noopener');
      el.classList.add('is-live');
      const small = $('small', el);
      if (small && el.dataset.liveSmall) small.textContent = el.dataset.liveSmall;
      if (el.dataset.liveText) el.textContent = el.dataset.liveText;
    });
    $$('[data-notify]').forEach(el => { el.hidden = true; });
  }

  /* ---------- Menú móvil: una hoja que nace del botón ---------- */
  const navIn = $('.nav-in');
  const toggle = $('.nav-toggle');
  const panel = $('.nav-panel');
  if (navIn && toggle && panel) {
    const set = open => {
      navIn.dataset.open = open;
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      panel.inert = !open;
      document.dispatchEvent(new CustomEvent('chekash:menu', { detail: open }));
    };
    toggle.addEventListener('click', () => set(navIn.dataset.open !== 'true'));
    $$('a', panel).forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && navIn.dataset.open === 'true') { set(false); toggle.focus(); } });
    document.addEventListener('pointerdown', e => {
      if (navIn.dataset.open === 'true' && !e.target.closest('.site-nav')) set(false);
    });
    matchMedia('(min-width:821px)').addEventListener('change', e => { if (e.matches) set(false); });
  }

  /* ---------- Páginas legales: índice con sección activa ---------- */
  const toc = $('.toc');
  if (toc) {
    const small = matchMedia('(max-width:980px)');
    if (small.matches) toc.removeAttribute('open');
    const links = $$('a', toc);
    const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
    links.forEach(a => a.addEventListener('click', () => { if (small.matches) toc.removeAttribute('open'); }));
    const heads = $$('.legal-body h2[id]').filter(h => byId[h.id]);
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      let cur = heads[0];
      for (const h of heads) { if (h.getBoundingClientRect().top - 140 <= 0) cur = h; else break; }
      links.forEach(a => a.classList.toggle('is-active', !!cur && a === byId[cur.id]));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }
})();
