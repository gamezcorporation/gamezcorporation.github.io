/* Chekash · calculadora: la pantalla «Escribir precio» de la app, con la misma cuenta (Money.kt, ManualEntryScreen.kt) y las tasas de ve.dolarapi.com. Sin dependencias. */
(() => {
  'use strict';
  const root = document.querySelector('[data-pc]');
  if (!root) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const API = 'https://ve.dolarapi.com/v1/';
  const st = { mode: 'unit', foreign: 'usd', cur: 'f', price: '', weight: '', wu: 'g', active: 'price', vat: null, qty: 1, src: 'oficial', rates: { usd: 897.54, eur: 1041.15 }, items: [] };

  /* ---- Cuenta: igual que la app ---- */
  const r2 = x => Math.round(Number(x.toFixed(8)) * 100) / 100;          // mitad hacia arriba, como BigDecimal
  const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[,.]/g, c => c === ',' ? '.' : ',');
  const SYM = { usd: '$', eur: '€', ves: 'Bs. ' };
  const money = (v, m) => SYM[m] + fmt(v);
  const num = t => parseFloat(String(t).replace(',', '.')) || 0;
  const rate = m => st.rates[m];
  const conv = (a, from, to) => {
    if (from === to) return a;
    if (to === 'ves') return rate(from) > 0 ? r2(a * rate(from)) : null;
    const ves = from === 'ves' ? a : (rate(from) > 0 ? rate(from) * a : null);
    return ves != null && rate(to) > 0 ? ves / rate(to) : null;
  };
  const group = raw => { const i = raw.indexOf(','), w = i >= 0 ? raw.slice(0, i) : raw; return w.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (i >= 0 ? raw.slice(i) : ''); };
  const typeKey = (cur, key, maxDec, maxLen) => {
    if (key === 'del') return cur.slice(0, -1);
    if (key === ',') return cur.includes(',') || maxDec <= 0 ? cur : (cur ? cur + ',' : '0,');
    if (key === '000') return !cur || cur.includes(',') || cur.length + 3 > maxLen ? cur : cur + '000';
    if (!/^\d$/.test(key) || cur.length >= maxLen) return cur;
    const c = cur.indexOf(',');
    if (c >= 0 && cur.length - c - 1 >= maxDec) return cur;
    return cur === '0' ? key : cur + key;
  };
  const calc = () => {
    const kilo = st.mode === 'kilo', p = num(st.price), w = num(st.weight);
    const total = kilo ? (st.wu === 'g' ? p * w / 1000 : p * w) : p;
    const fin = st.vat ? total * (1 + st.vat / 100) : total;
    return { kilo, p, w, total, fin, line: fin * st.qty, vatAmt: (fin - total) * st.qty, pm: st.cur === 'ves' ? 'ves' : st.foreign };
  };

  /* ---- Pantalla ---- */
  const ic = (id, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
  root.innerHTML = `<div class="pc-bezel"><div class="pc-screen">
    <div class="hd"><span class="rb">${ic('i-back')}</span><h3>Escribir precio</h3><span class="rb">${ic('i-pencil')}</span></div>
    <p class="q">¿Cómo viene el precio?</p>
    <div class="sg big" role="group" aria-label="Cómo viene el precio"><button type="button" data-mode="unit">Por unidad</button><button type="button" data-mode="kilo">Por kilo</button></div>
    <div class="pn"><small>Vas a pagar<i data-sub></i></small><b data-big></b><em data-eq></em><p data-f1 hidden></p><p data-f2 hidden></p></div>
    <div class="fd" data-field="price"><button type="button" class="fd-m" data-focus="price"><small data-l1></small><b><span data-sym></span> <span data-v1></span></b></button><div class="sg" role="group" aria-label="Moneda"><button type="button" data-cur="f"></button><button type="button" data-cur="ves">Bs</button></div></div>
    <div class="fd" data-field="weight" data-kilo><button type="button" class="fd-m" data-focus="weight"><small>Peso que llevas</small><b><span data-v2></span></b></button><div class="sg" role="group" aria-label="Unidad de peso"><button type="button" data-wu="g">g</button><button type="button" data-wu="kg">kg</button></div></div>
    <div class="chips" data-kilo><button type="button" data-w="100:g">100 g</button><button type="button" data-w="250:g">250 g</button><button type="button" data-w="500:g">500 g</button><button type="button" data-w="1:kg">1 kg</button></div>
    <div class="vat"><button type="button" class="chip" data-vatbtn aria-haspopup="true" aria-expanded="false"><span data-vattxt></span><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="menu" data-menu hidden><button type="button" data-vat="">IVA ya incluido</button><button type="button" data-vat="16">Sumar 16 %</button><button type="button" data-vat="8">Sumar 8 %</button></div></div>
    <div class="qty" data-unit><span>${ic('i-receipt')}Cantidad</span><div class="st"><button type="button" data-q="-1" aria-label="Menos">${ic('i-minus')}</button><b data-qty></b><button type="button" data-q="1" aria-label="Más" class="pl">${ic('i-plus')}</button></div></div>
    <div class="kp" data-kp></div>
    <button type="button" class="add" data-add></button>
    <p class="toast" data-toast role="status" aria-live="polite"></p>
  </div></div>`;
  const kp = $('[data-kp]');
  kp.innerHTML = ['1','2','3','4','5','6','7','8','9','L','0','del'].map(k => k === 'del'
    ? `<button type="button" class="dl" data-key="del" aria-label="Borrar (mantén para limpiar)"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h10a1 1 0 011 1v10a1 1 0 01-1 1H9l-5-6zM12 10l4 4M16 10l-4 4"/></svg></button>`
    : `<button type="button" data-key="${k}"${k === 'L' ? ' data-left' : ''}></button>`).join('');
  const q = s => $(s, root), qa = s => $$(s, root);
  let toastT;
  const toast = t => { const e = q('[data-toast]'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 2600); };

  const update = () => {
    const c = calc(), kilo = c.kilo, f = st.foreign;
    qa('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));
    qa('[data-kilo]').forEach(e => e.hidden = !kilo);
    qa('[data-unit]').forEach(e => e.hidden = kilo);
    q('[data-sub]').textContent = st.qty > 1 ? ' × ' + st.qty : '';
    q('[data-big]').textContent = money(c.line, c.pm);
    const eq = [f, 'ves'].filter(m => m !== c.pm).map(m => [m, conv(c.fin, c.pm, m)]).filter(x => x[1] != null).map(([m, u]) => '≈ ' + money(u * st.qty, m));
    q('[data-eq]').textContent = eq.join('  ·  ');
    const f1 = q('[data-f1]'), f2 = q('[data-f2]');
    f1.hidden = !(kilo && c.p > 0 && c.w > 0);
    f1.textContent = st.weight + (st.wu === 'g' ? ' g' : ' kg') + ' × ' + money(c.p, c.pm) + ' por kilo';
    f2.hidden = !(st.vat && c.total > 0);
    f2.textContent = '+ IVA ' + st.vat + ' %: ' + money(c.vatAmt, c.pm);
    q('[data-l1]').textContent = kilo ? 'Precio por kilo' : '¿Cuánto cuesta?';
    q('[data-sym]').textContent = SYM[c.pm].trim();
    q('[data-v1]').textContent = group(st.price) || '0';
    q('[data-v2]').textContent = group(st.weight) || '0';
    q('[data-field=price]').classList.toggle('on', !kilo || st.active === 'price');
    q('[data-field=weight]').classList.toggle('on', st.active === 'weight');
    const cb = q('[data-cur=f]'); cb.textContent = f === 'eur' ? '€' : '$';
    qa('[data-cur]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.cur === 'ves') === (st.cur === 'ves')));
    qa('[data-wu]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wu === st.wu));
    qa('[data-w]').forEach(b => { const [a, u] = b.dataset.w.split(':'); b.setAttribute('aria-pressed', u === st.wu && a === st.weight); });
    q('[data-vattxt]').textContent = st.vat ? '+ ' + st.vat + ' % IVA' : 'IVA incluido';
    q('[data-qty]').textContent = st.qty;
    q('[data-q="-1"]').disabled = st.qty <= 1; q('[data-q="1"]').disabled = st.qty >= 99;
    q('[data-left]').textContent = st.active === 'weight' && kilo && st.wu === 'g' ? '000' : ',';
    q('[data-left]').dataset.key = q('[data-left]').textContent === ',' ? ',' : '000';
    const toWeight = kilo && st.active === 'price' && c.p > 0;
    const label = !kilo ? 'Agregar a la lista' : c.p <= 0 ? 'Escribe el precio del kilo' : toWeight ? 'Siguiente: el peso' : c.w <= 0 ? 'Escribe el peso' : 'Agregar a la lista';
    const ok = kilo ? (toWeight || c.total > 0) : c.total > 0;
    const add = q('[data-add]'); add.innerHTML = (label === 'Agregar a la lista' ? ic('i-check') : '') + label; add.disabled = !ok; add.classList.toggle('on', ok);
    const sum = st.items.reduce((s, it) => s + (conv(it.v, it.m, f) || 0), 0), n = st.items.length, cart = $('[data-cart]');
    if (cart) { cart.hidden = !n; $('[data-cart-t]').textContent = `Llevas ${n} ${n === 1 ? 'producto' : 'productos'}: ${money(sum, f)}${conv(sum, f, 'ves') != null ? ' ≈ ' + money(conv(sum, f, 'ves'), 'ves') : ''}`; }
  };

  const key = k => {
    if (st.active === 'price') {
      const before = st.price; st.price = typeKey(before, k, 2, 12);
      if (st.price === before && before.includes(',')) toast(k === ',' ? 'La coma es solo para los centavos. Los miles se ponen solos: escribe 2249,55' : /^\d$/.test(k) ? 'Después de la coma van solo 2 decimales' : '');
    } else st.weight = typeKey(st.weight, k, st.wu === 'kg' ? 3 : 0, 6);
    update();
  };
  const setMode = m => {
    if (m === st.mode) return;
    st.mode = m;
    if (m === 'kilo') { st.wu = 'g'; st.qty = 1; st.active = num(st.price) > 0 ? 'weight' : 'price'; } else { st.weight = ''; st.active = 'price'; }
    update();
  };
  const convW = (t, from, to) => {
    const v = num(t); if (v <= 0 || from === to) return v > 0 ? t : '';
    if (from === 'g') return (Math.round(v) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
    const g = Math.round(v * 1000); return g >= 1 && g <= 999999 ? String(g) : '';
  };
  const add = () => {
    const c = calc();
    if (q('[data-add]').disabled) return;
    if (c.kilo && st.active === 'price' && c.p > 0) { st.active = 'weight'; update(); return; }
    if (c.total <= 0) return;
    st.items.push({ v: c.line, m: c.pm });
    st.price = ''; st.weight = ''; st.qty = 1; st.vat = null; st.active = 'price';
    toast('Agregado a la lista'); update();
  };

  let held = false, holdT;
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) { return; }
    const d = b.dataset;
    if (!b.closest('.vat')) q('[data-menu]').hidden = true;
    if (d.key !== undefined) { if (held) { held = false; return; } key(d.key); }
    else if (d.mode) setMode(d.mode);
    else if (d.focus) { st.active = d.focus; update(); }
    else if (d.cur) { st.cur = d.cur; update(); }
    else if (d.wu) { if (d.wu !== st.wu) { st.weight = convW(st.weight, st.wu, d.wu); st.wu = d.wu; } st.active = 'weight'; update(); }
    else if (d.w) { const [a, u] = d.w.split(':'); st.wu = u; st.weight = a; st.active = 'weight'; update(); }
    else if (d.q) { st.qty = Math.min(99, Math.max(1, st.qty + Number(d.q))); update(); }
    else if (d.vatbtn !== undefined) { const m = q('[data-menu]'); m.hidden = !m.hidden; b.setAttribute('aria-expanded', !m.hidden); }
    else if (d.vat !== undefined) { st.vat = d.vat ? Number(d.vat) : null; q('[data-menu]').hidden = true; update(); }
    else if (d.add !== undefined) add();
  });
  const del = q('[data-key=del]');
  del.addEventListener('pointerdown', () => { held = false; holdT = setTimeout(() => { held = true; if (st.active === 'price') st.price = ''; else st.weight = ''; update(); }, 500); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => del.addEventListener(ev, () => clearTimeout(holdT)));
  root.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) key(e.key); else if (e.key === ',' || e.key === '.') key(','); else if (e.key === 'Backspace') key('del');
    else if (e.key === 'Enter' && !e.target.closest('button')) add(); else return;
    e.preventDefault();
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.vat')) q('[data-menu]').hidden = true; });

  /* ---- Tasas: ve.dolarapi.com (la misma fuente que usa la app entre semana) ---- */
  const ri = { usd: $('[data-r=usd]'), eur: $('[data-r=eur]') }, status = $('[data-rt-status]');
  const showRates = () => { ri.usd.value = fmt(st.rates.usd); ri.eur.value = fmt(st.rates.eur); };
  const parseRate = t => { t = t.trim(); const v = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t; return parseFloat(v); };
  const get = async p => {
    const r = await fetch(API + p, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status);
    const j = await r.json(), v = j.promedio ?? j.venta; if (!(v > 0)) throw new Error('sin tasa');
    return { v: r2(v), d: j.fechaActualizacion };
  };
  let live = false;
  const load = async () => {
    status.textContent = 'Trayendo las tasas de hoy…';
    const [u, e] = await Promise.allSettled([get('dolares/' + st.src), get('euros/oficial')]);
    if (u.status === 'fulfilled') st.rates.usd = u.value.v;
    if (e.status === 'fulfilled') st.rates.eur = e.value.v;
    live = u.status === 'fulfilled' || e.status === 'fulfilled';
    const d = u.value?.d || e.value?.d, fecha = d ? new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', timeZone: 'America/Caracas' }) : '';
    status.textContent = live ? `Tasas de ve.dolarapi.com${fecha ? ', actualizadas el ' + fecha : ''}. Puedes cambiarlas.` : 'No pudimos traer las tasas de hoy: usamos unas de ejemplo. Escribe la tuya.';
    showRates(); update();
  };
  Object.entries(ri).forEach(([m, input]) => input.addEventListener('input', () => { const v = parseRate(input.value); if (v > 0) { st.rates[m] = v; update(); } }));
  $$('[data-for]').forEach(b => b.addEventListener('click', () => { st.foreign = b.dataset.for; $$('[data-for]').forEach(x => x.setAttribute('aria-pressed', x === b)); update(); }));
  $$('[data-src]').forEach(b => b.addEventListener('click', () => { st.src = b.dataset.src; $$('[data-src]').forEach(x => x.setAttribute('aria-pressed', x === b)); load(); }));
  const clear = $('[data-cart-clear]'); if (clear) clear.addEventListener('click', () => { st.items = []; update(); });

  showRates(); update(); load();
})();
