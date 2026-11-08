/* Chekash · comportamiento de la web. Sin dependencias. */
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
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

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

  /* ---------- Menú móvil ---------- */
  const navIn = $('.nav-in');
  const toggle = $('.nav-toggle');
  if (navIn && toggle) {
    const set = open => {
      navIn.dataset.open = open;
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    toggle.addEventListener('click', () => set(navIn.dataset.open !== 'true'));
    $$('.nav-links a', navIn).forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ---------- Escala de los teléfonos (las pantallas se diseñan a 360 px) ---------- */
  const ro = 'ResizeObserver' in window
    ? new ResizeObserver(es => es.forEach(e => e.target.style.setProperty('--k', (e.target.clientWidth / 360).toFixed(4))))
    : null;
  const scaleGlass = g => {
    g.style.setProperty('--k', (g.clientWidth / 360 || .8).toFixed(4));
    if (ro) ro.observe(g);
  };
  $$('.glass').forEach(scaleGlass);

  /* ---------- Dinero ---------- */
  const RATE = 897.54; // tasa de ejemplo, la misma que muestran las pantallas
  const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fmtCents = c => {
    const neg = c < 0; c = Math.abs(Math.round(c));
    return (neg ? '-' : '') + group(String(Math.floor(c / 100))) + ',' + String(c % 100).padStart(2, '0');
  };
  const bsCents = usdCents => Math.round(usdCents * RATE);

  /* ---------- Los dos botones Dólares / Bolívares de la pantalla del escáner ---------- */
  $$('.ap-seg').forEach(seg => {
    seg.addEventListener('click', e => {
      const t = e.target.closest('span[data-mode]');
      if (!t) return;
      const screen = seg.closest('.screen');
      $$('span', seg).forEach(s => s.classList.toggle('on', s === t));
      screen.dataset.mode = t.dataset.mode;
      renderTotals(screen);
    });
  });
  function renderTotals(screen) {
    const usd = +screen.dataset.usd || 0, bs = +screen.dataset.bs || 0;
    const mode = screen.dataset.mode || 'usd';
    const big = $('[data-total-big]', screen), sm = $('[data-total-sm]', screen);
    if (!big) return;
    if (mode === 'bs') { big.textContent = 'Bs. ' + fmtCents(bs); sm.textContent = '≈ $' + fmtCents(usd); big.style.fontSize = '30px'; }
    else { big.textContent = '$' + fmtCents(usd); sm.textContent = '≈ Bs. ' + fmtCents(bs); big.style.fontSize = ''; }
  }

  /* ---------- El teléfono del hero: escanea tres etiquetas y suma ---------- */
  const demoRoot = $('[data-demo]');
  if (demoRoot) {
    const screen = $('.screen', demoRoot);
    const card = $('.ap-card', screen), rows = $('[data-rows]', screen), count = $('[data-count]', screen);
    const label = $('.vf-label', screen), scan = $('.vf-scan', screen), box = $('.vf-box', screen);
    const nameEl = $('.vf-name', label), priceEl = $('.vf-price-t', label);
    const items = [
      { n: 'Harina PAN 1 kg', tag: 'HARINA PAN 1 KG', c: 145 },
      { n: 'Aceite 1 L',      tag: 'ACEITE 1 L',      c: 310 },
      { n: 'Café 250 g',      tag: 'CAFÉ 250 G',      c: 380 },
    ];
    const check = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
    let alive = false, token = 0, usdTotal = 0, bsTotal = 0;

    const setTotals = (u, b) => {
      screen.dataset.usd = u; screen.dataset.bs = b;
      renderTotals(screen);
    };
    const tween = async (fromU, toU, fromB, toB, token0) => {
      const t0 = performance.now(), dur = 420;
      while (token0 === token) {
        const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        setTotals(Math.round(fromU + (toU - fromU) * e), Math.round(fromB + (toB - fromB) * e));
        if (k === 1) break;
        await new Promise(requestAnimationFrame);
      }
    };
    const reset = () => {
      rows.innerHTML = ''; usdTotal = 0; bsTotal = 0;
      card.classList.add('is-empty'); count.textContent = '0 productos';
      label.classList.remove('in'); box.classList.remove('on'); scan.classList.remove('go');
      setTotals(0, 0);
    };
    const run = async () => {
      const my = ++token;
      while (my === token) {
        reset();
        await sleep(900); if (my !== token) return;
        for (const it of items) {
          nameEl.textContent = it.tag; priceEl.textContent = '$' + fmtCents(it.c);
          label.classList.add('in'); await sleep(650); if (my !== token) return;
          scan.classList.remove('go'); void scan.offsetWidth; scan.classList.add('go');
          await sleep(760); box.classList.add('on'); await sleep(420); if (my !== token) return;
          const b = bsCents(it.c);
          card.classList.remove('is-empty');
          $$('.new', rows).forEach(r => r.classList.remove('new'));
          const row = document.createElement('div');
          row.className = 'ap-row new pop';
          row.innerHTML = `<span class="ck">${check}</span><span class="t"><b>${it.n}</b><small>Bs. ${fmtCents(b)}</small></span><span class="pr">$${fmtCents(it.c)}</span>`;
          rows.appendChild(row);
          count.textContent = rows.children.length + (rows.children.length === 1 ? ' producto' : ' productos');
          const fu = usdTotal, fb = bsTotal; usdTotal += it.c; bsTotal += b;
          tween(fu, usdTotal, fb, bsTotal, my);
          label.classList.remove('in'); box.classList.remove('on');
          await sleep(900); if (my !== token) return;
        }
        await sleep(3400);
      }
    };
    const start = () => { if (!alive) { alive = true; run(); } };
    const stop = () => { alive = false; token++; };

    if (reduce) {
      demoRoot.classList.add('ready');
    } else {
      reset(); demoRoot.classList.add('ready');
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: .25 }).observe(demoRoot);
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : (demoRoot.getBoundingClientRect().top < innerHeight && start()));
    }
  } else {
    $$('.screen').forEach(renderTotals);
  }

  /* ---------- Funciones: el teléfono cambia de pantalla según el texto que lees ---------- */
  const panels = $$('.feat');
  if (panels.length) {
    const stageScreens = $$('.feat-stage .screen');
    const activate = name => {
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.screen === name));
      stageScreens.forEach(s => s.classList.toggle('is-on', s.dataset.screen === name));
    };
    activate(panels[0].dataset.screen);
    // Una franja fina en el centro de la pantalla decide qué texto está «activo».
    const band = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) activate(e.target.dataset.screen); }),
      { rootMargin: '-45% 0px -45% 0px' }
    );
    panels.forEach(p => band.observe(p));

    // En pantallas chicas cada texto trae su propio teléfono.
    $$('.feat-slot').forEach(slot => {
      const src = $(`.feat-stage .screen[data-screen="${slot.dataset.screen}"]`);
      if (!src) return;
      slot.innerHTML = '<div class="rings" aria-hidden="true"><i></i><i></i><i></i></div><div class="phone" aria-hidden="true"><div class="glass"></div></div>';
      const clone = src.cloneNode(true);
      clone.classList.add('is-on'); clone.style.opacity = 1;
      $('.glass', slot).appendChild(clone);
      scaleGlass($('.glass', slot));
      renderTotals(clone);
    });
  }

  /* ---------- Calculadora ---------- */
  const cUsd = $('#c-usd'), cRate = $('#c-rate'), cBs = $('#c-bs');
  if (cUsd && cRate && cBs) {
    const parse = raw => {
      let s = String(raw).trim().replace(/\s/g, '');
      if (!s) return NaN;
      if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
      else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
      return Number(s);
    };
    const fmt = n => isFinite(n) ? fmtCents(Math.round(n * 100)) : '';
    const fromUsd = () => { cBs.value = fmt(parse(cUsd.value) * parse(cRate.value)); };
    cUsd.addEventListener('input', fromUsd);
    cRate.addEventListener('input', fromUsd);
    cBs.addEventListener('input', () => { cUsd.value = fmt(parse(cBs.value) / parse(cRate.value)); });
    [cUsd, cRate, cBs].forEach(i => i.addEventListener('focus', () => i.select()));
    fromUsd();
  }

  /* ---------- Planes: anual / mensual ---------- */
  const tg = $('[data-plan-toggle]');
  if (tg) {
    const data = {
      year:  { price: '19,99', per: '/ año', sub: 'Equivale a USD 1,67 al mes. Ahorras 44 % frente al plan mensual.' },
      month: { price: '2,99',  per: '/ mes', sub: 'Se cobra cada mes. Lo cancelas cuando quieras en Google Play.' }
    };
    const price = $('[data-price]'), per = $('[data-per]'), sub = $('[data-sub]');
    $$('button', tg).forEach(b => b.addEventListener('click', () => {
      $$('button', tg).forEach(x => x.setAttribute('aria-pressed', x === b));
      const d = data[b.dataset.plan];
      price.textContent = d.price; per.textContent = d.per; sub.textContent = d.sub;
    }));
  }

  /* ---------- Páginas legales: índice ---------- */
  const toc = $('.toc');
  if (toc) {
    if (matchMedia('(max-width:980px)').matches) toc.removeAttribute('open');
    const links = $$('a', toc);
    const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
    links.forEach(a => a.addEventListener('click', () => { if (matchMedia('(max-width:980px)').matches) toc.removeAttribute('open'); }));
    const heads = $$('.legal-body h2[id]').filter(h => byId[h.id]);
    const onScroll = () => {
      let cur = heads[0];
      for (const h of heads) { if (h.getBoundingClientRect().top - 140 <= 0) cur = h; else break; }
      links.forEach(a => a.classList.toggle('is-active', cur && a === byId[cur.id]));
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();
