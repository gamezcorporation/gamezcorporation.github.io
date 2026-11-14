/* Chekash · inicio: demo del teléfono, funciones, calculadora, planes. Sin dependencias. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));

  /* ---------- Escala de los teléfonos (las pantallas se diseñan a 360 px) ---------- */
  const ro = 'ResizeObserver' in window
    ? new ResizeObserver(es => es.forEach(e => e.target.style.setProperty('--k', (e.target.clientWidth / 360).toFixed(4))))
    : null;
  const scaleGlass = g => {
    g.style.setProperty('--k', (g.clientWidth / 360 || .8).toFixed(4));
    if (ro) ro.observe(g);
  };
  $$('.glass').forEach(scaleGlass);

  /* ---------- Dinero (es-VE: punto para miles, coma para decimales) ---------- */
  const RATE = 897.54; // tasa de ejemplo, la misma que muestran las pantallas
  const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fmtCents = c => {
    const neg = c < 0; c = Math.abs(Math.round(c));
    return (neg ? '-' : '') + group(String(Math.floor(c / 100))) + ',' + String(c % 100).padStart(2, '0');
  };
  const bsCents = usdCents => Math.round(usdCents * RATE);

  /* ---------- Los dos botones Dólares / Bolívares de la pantalla del escáner ---------- */
  function renderTotals(screen) {
    const usd = +screen.dataset.usd || 0, bs = +screen.dataset.bs || 0;
    const mode = screen.dataset.mode || 'usd';
    const big = $('[data-total-big]', screen), sm = $('[data-total-sm]', screen);
    if (!big) return;
    if (mode === 'bs') { big.textContent = 'Bs. ' + fmtCents(bs); sm.textContent = '≈ $' + fmtCents(usd); big.style.fontSize = '30px'; }
    else { big.textContent = '$' + fmtCents(usd); sm.textContent = '≈ Bs. ' + fmtCents(bs); big.style.fontSize = ''; }
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('.ap-seg span[data-mode]');
    if (!t) return;
    const seg = t.parentNode, screen = seg.closest('.screen');
    $$('span', seg).forEach(x => x.classList.toggle('on', x === t));
    screen.dataset.mode = t.dataset.mode;
    renderTotals(screen);
  });

  /* ---------- El teléfono del hero: escanea tres etiquetas y suma (animación original) ---------- */
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

    const setTotals = (u, b) => { screen.dataset.usd = u; screen.dataset.bs = b; renderTotals(screen); };
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
  }

  /* ---------- Funciones: el teléfono cambia de pantalla según el texto que lees ---------- */
  const panels = $$('.feat');
  const stageGlass = $('.feat-stage .glass');
  if (panels.length && stageGlass) {
    panels.forEach(p => {
      const t = $('#tpl-' + p.dataset.screen);
      if (t) stageGlass.appendChild(t.content.cloneNode(true));
    });
    scaleGlass(stageGlass);
    const stageScreens = $$('.screen', stageGlass);
    stageScreens.forEach(renderTotals);
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
      const t = $('#tpl-' + slot.dataset.screen);
      if (!t) return;
      slot.innerHTML = '<div class="phone" aria-hidden="true"><div class="glass"></div></div>';
      const glass = $('.glass', slot);
      glass.appendChild(t.content.cloneNode(true));
      const sc = $('.screen', glass); sc.classList.add('is-on'); sc.style.opacity = 1;
      scaleGlass(glass);
      renderTotals(sc);
    });
  }

  /* ---------- Calculadora ---------- */
  const calc = $('[data-calc]');
  if (calc) {
    const el = {
      price: $('#c-price'), kp: $('#k-price'), kq: $('#k-qty'), ru: $('#r-usd'), re: $('#r-eur'),
      hint: $('[data-hint]'), kh: $('[data-kilo-hint]'), sr: $('[data-sr]'), unit: $('[data-unit]'),
      out: { ves: $('[data-read="ves"]'), usd: $('[data-read="usd"]'), eur: $('[data-read="eur"]') },
    };
    const st = { mode: 'unit', cur: 'usd', unit: 'g' };
    const SYM = { usd: '$', eur: '€', ves: 'Bs.' };
    const PRE = { usd: '$', eur: '€', ves: 'Bs. ' };
    const MAX_BS = 1e13;

    const parse = raw => {
      let s = String(raw).trim().replace(/\s/g, '');
      if (!s || !/^[\d.,]+$/.test(s) || !/\d/.test(s)) return NaN;
      if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
      else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
      const n = Number(s);
      return isFinite(n) ? n : NaN;
    };
    const num = (n, dec = 3) => {            // 0,5 · 1.250 · 0,571 (sin ceros de sobra)
      const [i, d = ''] = n.toFixed(dec).split('.');
      const t = d.replace(/0+$/, '');
      return group(i) + (t ? ',' + t : '');
    };
    const lenTier = t => t.length > 22 ? 'xl' : t.length > 17 ? 'l' : t.length > 13 ? 'm' : '';
    const setBad = (inp, bad) => {
      const w = inp.closest('.in-wrap'); if (bad) w.dataset.bad = ''; else delete w.dataset.bad;
      inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
    };
    const dash = () => { Object.values(el.out).forEach(r => { const o = $('output', r); o.textContent = '—'; o.dataset.len = ''; }); };

    let srTimer = 0;
    function render() {
      const ru = parse(el.ru.value), re = parse(el.re.value);
      const okU = ru >= 1e-4 && ru <= 1e6, okE = re >= 1e-4 && re <= 1e6, rateBad = !(okU && okE);
      setBad(el.ru, !okU); setBad(el.re, !okE);

      let total = NaN, msg = '', bad = false;
      const hintEl = st.mode === 'unit' ? el.hint : el.kh;
      if (st.mode === 'unit') {
        const p = parse(el.price.value), empty = !el.price.value.trim();
        total = p;
        if (empty) msg = 'Escribe un precio.'; else if (isNaN(p)) { msg = 'Escribe solo números, por ejemplo 1,45.'; bad = true; }
        setBad(el.price, bad);
      } else {
        const p = parse(el.kp.value), q = parse(el.kq.value);
        const eP = !el.kp.value.trim(), eQ = !el.kq.value.trim();
        const bP = !eP && isNaN(p), bQ = !eQ && isNaN(q);
        if (eP || eQ) msg = 'Escribe el precio por kilo y el peso que llevas.';
        else if (bP || bQ) { msg = 'Escribe solo números, por ejemplo 2 y 500.'; bad = true; }
        else {
          const kg = st.unit === 'g' ? q / 1000 : q; total = p * kg;
          msg = num(q) + ' ' + st.unit + ' × ' + PRE[st.cur] + fmtCents(Math.round(p * 100)) + ' por kilo';   // igual que la app
        }
        setBad(el.kp, bP); setBad(el.kq, bQ);
      }
      const tooBig = isFinite(total) && !rateBad && (total * (st.cur === 'usd' ? ru : st.cur === 'eur' ? re : 1)) > MAX_BS;
      if (tooBig) { msg = 'Ese número es demasiado grande.'; bad = true; }
      hintEl.textContent = msg; hintEl.classList.toggle('bad', bad);
      if (st.mode === 'kilo') hintEl.classList.toggle('live', !bad && !!msg);

      if (!isFinite(total) || total < 0 || rateBad || tooBig) {
        dash();
        if (rateBad && isFinite(total)) { hintEl.textContent = 'Revisa las tasas: deben ser mayores que cero.'; hintEl.classList.add('bad'); }
        el.sr.textContent = ''; return;
      }
      const bs = total * (st.cur === 'usd' ? ru : st.cur === 'eur' ? re : 1);
      const vals = { ves: bs, usd: bs / ru, eur: bs / re };
      const text = { ves: 'Bs. ' + fmtCents(Math.round(vals.ves * 100)), usd: '$' + fmtCents(Math.round(vals.usd * 100)), eur: '€' + fmtCents(Math.round(vals.eur * 100)) };
      const heroKey = st.cur === 'ves' ? 'usd' : 'ves';    // la cifra héroe es la conversión
      Object.entries(el.out).forEach(([k, r]) => {
        r.classList.toggle('is-main', k === heroKey);
        const o = $('output', r); o.textContent = text[k]; o.dataset.len = lenTier(text[k]);
      });
      clearTimeout(srTimer);
      srTimer = setTimeout(() => { el.sr.textContent = `${text.ves}, ${text.usd}, ${text.eur}`; }, 700);
    }

    /* Segmentados con indicador que se desliza */
    const segSet = (seg, btn) => {
      const bs = $$('button', seg);
      bs.forEach(b => b.setAttribute('aria-pressed', b === btn));
      seg.style.setProperty('--i', bs.indexOf(btn));
    };
    $$('[data-seg]', calc).forEach(seg => seg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      segSet(seg, b);
      if (seg.dataset.seg === 'mode') {
        st.mode = b.dataset.v;
        $$('.mode', calc).forEach(m => { m.hidden = m.dataset.mode !== st.mode; });
      } else {
        st.cur = b.dataset.v;
        $$('[data-sym]', calc).forEach(s => { s.textContent = SYM[st.cur]; });
      }
      render();
    }));

    /* Atajos de peso: 100 g · 250 g · 500 g · 1 kg (los mismos de la app) */
    const chips = $$('.chip', calc);
    const grams = () => { const q = parse(el.kq.value); return st.unit === 'g' ? q : q * 1000; };
    const syncChips = () => chips.forEach(c => c.setAttribute('aria-pressed', grams() === +c.dataset.g));
    const setUnit = u => { st.unit = u; segSet(el.unit, $(`[data-v="${u}"]`, el.unit)); };
    chips.forEach(c => c.addEventListener('click', () => {
      const g = +c.dataset.g;
      if (g >= 1000) { setUnit('kg'); el.kq.value = num(g / 1000); } else { setUnit('g'); el.kq.value = String(g); }
      syncChips(); render();
    }));
    el.unit.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.dataset.v === st.unit) return;
      const q = parse(el.kq.value);
      if (!isNaN(q)) el.kq.value = b.dataset.v === 'g' ? num(q * 1000, 0) : num(q / 1000);
      setUnit(b.dataset.v); syncChips(); render();
    });

    [el.price, el.kp, el.kq, el.ru, el.re].forEach(i => {
      i.addEventListener('input', () => { syncChips(); render(); });
      i.addEventListener('focus', () => i.select());
    });
    render(); syncChips();
  }

  /* ---------- Planes: anual / mensual ---------- */
  const tg = $('[data-plan-toggle]');
  if (tg) {
    const data = {
      year:  { price: '19,99', per: '/ año', sub: 'Equivale a USD 1,67 al mes. Ahorras 44 % frente al plan mensual.' },
      month: { price: '2,99',  per: '/ mes', sub: 'Se cobra cada mes. Lo cancelas cuando quieras en Google Play.' },
    };
    const price = $('[data-price]'), per = $('[data-per]'), sub = $('[data-sub]'), swaps = $$('.swap', tg.parentNode);
    $$('button', tg).forEach(b => b.addEventListener('click', async () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      $$('button', tg).forEach(x => x.setAttribute('aria-pressed', x === b));
      tg.dataset.sel = b.dataset.plan;
      swaps.forEach(n => n.classList.add('is-out'));
      await sleep(reduce ? 0 : 120);
      const d = data[b.dataset.plan];
      price.textContent = d.price; per.textContent = d.per; sub.textContent = d.sub;
      swaps.forEach(n => n.classList.remove('is-out'));
    }));
  }

  /* ---------- Cierre: las esquinas enganchan el ícono, una sola vez ---------- */
  const arm = $('[data-arm]');
  if (arm && !reduce) {
    arm.classList.add('arm');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { arm.classList.remove('arm'); arm.classList.add('lock'); io.disconnect(); }
    }), { threshold: .6 });
    io.observe(arm);
  }

  /* ---------- Móvil: barra inferior con el botón, cuando el principal se fue ---------- */
  const dock = $('[data-dock]');
  if (dock) {
    const watch = [$('[data-hero-cta]'), $('[data-cta-card]')].filter(Boolean);
    const seen = new Map(watch.map(w => [w, true]));
    let menuOpen = false;
    const sync = () => dock.classList.toggle('is-on', ![...seen.values()].some(Boolean) && !menuOpen);
    const io = new IntersectionObserver(es => { es.forEach(e => seen.set(e.target, e.isIntersecting)); sync(); });
    watch.forEach(w => io.observe(w));
    document.addEventListener('chekash:menu', e => { menuOpen = e.detail; sync(); });
  }
})();
