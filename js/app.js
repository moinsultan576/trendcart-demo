/* TrendCart demo — storefront, AI chat and store CRM */
(function () {
  'use strict';
  const KEY = 'trendcart_demo_v1', UKEY = 'trendcart_user', PKEY = 'trendcart_prefs', CKEY = 'trendcart_cart';
  const FORM_URL = 'https://formsubmit.co/ajax/moinseoagency@gmail.com', WA_AGENCY = '966546904384';
  const t = (k, v) => I18N.t(k, v), $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const { CATS, CITIES } = SEED;

  /* ---------- state ---------- */
  function ls(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  let D = ls(KEY, null);
  if (!D || D.v !== 1 || Date.now() - D.seededAt > 12 * 3600000) { D = SEED.seed(); lsSet(KEY, D); }
  let USER = ls(UKEY, null);
  const PREFS = Object.assign({ lang: null, theme: 'light' }, ls(PKEY, {}));
  const CART = Object.assign({ items: [], coupon: null, wish: [] }, ls(CKEY, {}));
  const UI = { shop: { cat: '', q: '', sort: 'pop', max: 0, wish: false }, range: 'month', of: { st: '', q: '' }, page: 1, chat: null, sidebar: false, menus: null };
  const save = () => lsSet(KEY, D), savePrefs = () => lsSet(PKEY, PREFS), saveCart = () => lsSet(CKEY, CART);
  (function () { let l = PREFS.lang; if (!l) { const n = (navigator.language || 'en').slice(0, 2); l = n === 'ar' ? 'ar' : n === 'ur' ? 'ur' : 'en'; } I18N.set(l); document.documentElement.dataset.theme = PREFS.theme; })();

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = () => I18N.lang;
  const nm = o => !o ? '' : typeof o === 'string' ? o : (o[L()] || (L() !== 'en' && o.ar) || o.en);
  const bdi = s => '<bdi>' + esc(s) + '</bdi>';
  const numF = new Intl.NumberFormat('en-US'), cmpF = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const sar = (n, c) => { const v = c ? cmpF.format(n) : numF.format(Math.round(n)); return L() === 'en' ? 'SAR ' + v : v + ' ' + t('common.sar'); };
  const sarH = (n, c) => bdi(sar(n, c));
  const dateF = (ts, o) => new Intl.DateTimeFormat(I18N.locale(), o || { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));
  const timeF = ts => new Intl.DateTimeFormat(L() === 'en' ? 'en-US' : I18N.locale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
  function rel(ts) { const rtf = new Intl.RelativeTimeFormat(L() === 'ar' ? 'ar-u-nu-latn' : L() === 'ur' ? 'ur-u-nu-latn' : 'en', { numeric: 'auto' }); const d = (ts - Date.now()) / 1000, a = Math.abs(d); return a < 3600 ? rtf.format(Math.round(d / 60), 'minute') : a < 86400 ? rtf.format(Math.round(d / 3600), 'hour') : rtf.format(Math.round(d / 86400), 'day'); }
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const photo = (id, w, h) => `${SEED.PHOTO(id)}?auto=format&fit=crop&w=${w || 500}&h=${h || w || 500}&q=70`;
  const prod = id => D.products.find(p => p.id === id);
  const cus = id => D.customers.find(c => c.id === id) || { name: { en: '?' }, phone: '', city: 'riyadh' };
  const ord = id => D.orders.find(o => o.id === id);
  const userName = () => (USER && USER.name) || 'Guest';
  const COLORS = ['#f97316', '#0ea5e9', '#16a34a', '#8b5cf6', '#ec4899', '#eab308', '#14b8a6', '#ef4444'];
  function avatar(name, size) { const n = nm(name) || '?'; const p = n.trim().split(/\s+/); const ini = (p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : ''); let h = 0; for (const c of (name && name.en) || n) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `<span class="av ${size || ''}" style="--c:${COLORS[h % COLORS.length]}">${esc(ini.toUpperCase())}</span>`; }
  const stars = r => `<span class="stars" aria-label="${r} / 5">${[1, 2, 3, 4, 5].map(i => icon('starFill', i <= Math.round(r) ? 'on' : '')).join('')}</span>`;
  const ostTag = s => `<span class="pill os-${s}">${esc(t('ost.' + s))}</span>`;
  function toast(msg, kind) { const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = icon(kind === 'err' ? 'x' : 'check') + '<span>' + esc(msg) + '</span>'; $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3000); }
  function sendForm(p) { try { fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _captcha: 'false', _template: 'table' }, p)) }).catch(() => {}); } catch (e) {} }
  function modal(title, body, cls) { const m = $('#modal'); m.innerHTML = `<div class="mback" data-act="closeModal"></div><div class="mbox ${cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mhead"><h3>${esc(title)}</h3><button class="ibtn" data-act="closeModal" aria-label="${t('common.close')}">${icon('x')}</button></div><div class="mbody">${body}</div></div>`; m.classList.add('open'); document.body.classList.add('noscroll'); const f = m.querySelector('input:not([type=radio]),select,textarea'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); }
  function closeModal() { const m = $('#modal'); m.classList.remove('open'); m.innerHTML = ''; document.body.classList.remove('noscroll'); }
  function drawer(html, cls) { const d = $('#drawer'); d.innerHTML = `<div class="mback" data-act="closeDrawer"></div><aside class="dpanel ${cls || ''}">${html}</aside>`; d.classList.add('open'); document.body.classList.add('noscroll'); }
  function closeDrawer() { const d = $('#drawer'); d.classList.remove('open'); d.innerHTML = ''; document.body.classList.remove('noscroll'); }
  const itemsLabel = o => o.items.map(i => (i.qty > 1 ? i.qty + '× ' : '') + nm((prod(i.pid) || { name: { en: '?' } }).name)).join(', ');

  /* ---------- cart ---------- */
  function addToCart(pid, qty, silent) {
    const p = prod(pid); if (!p || p.stock <= 0) return;
    const it = CART.items.find(i => i.pid === pid); if (it) it.qty = Math.min(it.qty + (qty || 1), p.stock); else CART.items.push({ pid, qty: qty || 1, at: Date.now() });
    saveCart(); updateBadges(); if (!silent) toast(t('p.added') + ': ' + nm(p.name));
  }
  function cartTotals() {
    const lines = CART.items.map(i => ({ ...i, p: prod(i.pid) })).filter(i => i.p);
    const sub = lines.reduce((a, i) => a + i.p.price * i.qty, 0);
    let disc = 0; const c = CART.coupon && D.coupons.find(x => x.code === CART.coupon && x.on);
    if (c && sub >= c.min) disc = c.type === 'pct' ? Math.round(sub * c.value / 100) : Math.min(c.value, sub);
    const ship = !lines.length || sub - disc >= D.freeShip ? 0 : 25;
    return { lines, sub, disc, ship, total: sub - disc + ship, coupon: c && disc ? c : null };
  }
  function updateBadges() { const n = CART.items.reduce((a, i) => a + i.qty, 0); $$('.cartN').forEach(e => { e.textContent = n; e.hidden = !n; }); $$('.wishN').forEach(e => { e.textContent = CART.wish.length; e.hidden = !CART.wish.length; }); }
  function cartDrawer() {
    const T = cartTotals();
    drawer(`<div class="dh"><h3>${icon('cart')} ${t('cart.t')}</h3><button class="ibtn" data-act="closeDrawer" aria-label="${t('common.close')}">${icon('x')}</button></div>
      <div class="dbody cart">${T.lines.length ? T.lines.map(i => `<div class="cline"><img src="${photo(i.p.photo, 160)}" alt=""><div><b>${esc(nm(i.p.name))}</b><span>${sarH(i.p.price)}</span><div class="qty"><button data-act="qty" data-id="${i.pid}" data-d="-1" aria-label="-">${icon('minus')}</button><bdi>${i.qty}</bdi><button data-act="qty" data-id="${i.pid}" data-d="1" aria-label="+">${icon('plus')}</button></div></div><button class="ibtn sm" data-act="rmCart" data-id="${i.pid}" aria-label="${t('common.delete')}">${icon('trash')}</button></div>`).join('')
        + `<form class="coupon" data-form="coupon"><input name="code" placeholder="${t('cart.coupon')}" value="${esc(CART.coupon || '')}" aria-label="${t('cart.coupon')}" autocomplete="off"><button class="btn ghost" type="submit">${t('cart.apply')}</button></form><p class="muted sm">${icon('tag', 'sm')} ${t('cart.try')}</p>
        ${T.ship ? `<p class="freehint">${icon('truck', 'sm')} ${t('cart.freeHint', { amt: sar(D.freeShip - (T.sub - T.disc)) })}</p>` : ''}
        <dl class="tot"><div><dt>${t('cart.sub')}</dt><dd>${sarH(T.sub)}</dd></div>${T.disc ? `<div class="dsc"><dt>${t('cart.disc')} (${esc(T.coupon.code)})</dt><dd>−${sarH(T.disc)}</dd></div>` : ''}<div><dt>${t('cart.ship')}</dt><dd>${T.ship ? sarH(T.ship) : t('cart.free')}</dd></div><div class="grand"><dt>${t('cart.total')}</dt><dd>${sarH(T.total)}</dd></div></dl>
        <button class="btn org block lg" data-act="checkout">${t('cart.checkout')} ${icon('arrowRight', 'flip')}</button>` : `<p class="empty big">${icon('cart')}<br>${t('cart.empty')}</p><button class="btn org block" data-act="goShop">${t('cart.cont')}</button>`}</div>`, 'right');
  }
  function checkoutModal() {
    const T = cartTotals(); if (!T.lines.length) return;
    closeDrawer();
    modal(t('co.t'), `<form class="form" data-form="checkout" novalidate>
      <div class="row2"><label>${t('co.name')} *<input name="name" required maxlength="60" autocomplete="name"></label><label>${t('co.phone')} *<input name="phone" required maxlength="20" inputmode="tel" placeholder="05x xxx xxxx" autocomplete="tel"></label></div>
      <div class="row2"><label>${t('co.city')} *<select name="city" required>${CITIES.map(c => `<option value="${c}">${t('city.' + c)}</option>`).join('')}</select></label><label>${t('co.addr')} *<input name="addr" required maxlength="120" autocomplete="street-address"></label></div>
      <fieldset class="pay"><legend>${t('co.pay')}</legend><label class="radio"><input type="radio" name="pay" value="cod" checked> ${icon('cash')} ${t('co.cod')}</label><label class="radio dis"><input type="radio" name="pay" value="card" disabled> ${icon('lock')} ${t('co.card')}</label></fieldset>
      <div class="cosum">${T.lines.map(i => `<div><span>${bdi(i.qty + '×')} ${esc(nm(i.p.name))}</span><b>${sarH(i.p.price * i.qty)}</b></div>`).join('')}${T.disc ? `<div class="dsc"><span>${t('cart.disc')}</span><b>−${sarH(T.disc)}</b></div>` : ''}<div><span>${t('cart.ship')}</span><b>${T.ship ? sarH(T.ship) : t('cart.free')}</b></div><div class="grand"><span>${t('cart.total')}</span><b>${sarH(T.total)}</b></div></div>
      <p class="err" hidden>${t('co.req')}</p><button class="btn org block lg" type="submit">${t('co.place')} · ${sarH(T.total)}</button><p class="muted sm c">${icon('shield', 'sm')} ${t('co.note')}</p></form>`, 'narrow');
  }
  function placeOrder(fd) {
    const T = cartTotals();
    const phone = fd.phone.trim();
    let c = D.customers.find(x => x.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-9)) && phone.replace(/\D/g, '').length >= 9);
    if (!c) { c = { id: uid('c'), name: { en: fd.name.trim(), ar: fd.name.trim() }, phone, email: '', city: fd.city, since: Date.now() }; D.customers.unshift(c); }
    const n = Math.max(...D.orders.map(o => +o.id.slice(3))) + 1; const id = 'TC-' + String(n).padStart(5, '0');
    const o = { id, cid: c.id, items: T.lines.map(i => ({ pid: i.pid, qty: i.qty, price: i.p.price })), sub: T.sub, ship: T.ship, disc: T.disc, total: T.total, status: 'pending', pay: 'cod', city: fd.city, addr: fd.addr.trim(), created: Date.now(), demo: true };
    D.orders.unshift(o); T.lines.forEach(i => { i.p.stock = Math.max(0, i.p.stock - i.qty); });
    if (T.coupon) T.coupon.uses++;
    D.notifs.unshift({ id: uid('n'), k: 'notif.n1', v: { id: '#' + id, name: c.name }, at: Date.now(), read: false });
    save(); CART.items = []; CART.coupon = null; saveCart(); updateBadges();
    sendForm({ _subject: 'TrendCart demo — test order ' + id, name: fd.name, whatsapp: phone, city: fd.city, total: sar(o.total), items: itemsLabel(o), language: L() });
    modal(t('co.done'), `<div class="done">${icon('check')}<p>${t('co.doneS', { id: '<b><bdi>#' + id + '</bdi></b>' })}</p><div class="row-btns c"><button class="btn org" data-act="trackAI" data-id="${id}">${icon('robot')} ${t('co.track')}</button><button class="btn ghost" data-act="start">${icon('chart')} ${t('co.openCrm')}</button></div></div>`, 'narrow');
  }

  /* ================= STOREFRONT ================= */
  function logo(dark) { return `<a class="logo ${dark ? 'dark' : ''}" href="#/" aria-label="TrendCart"><span class="lmark">${icon('bagFill')}</span><b>TrendCart</b></a>`; }
  function langMenu(id) { const names = { en: 'English', ar: 'العربية', ur: 'اردو' }; const open = UI.menus === id; return `<div class="dd ${open ? 'open' : ''}"><button class="langbtn" data-act="menu" data-id="${id}" aria-haspopup="true" aria-expanded="${open}">${icon('globe')}<span>${L().toUpperCase()}</span></button><div class="ddm">${['en', 'ar', 'ur'].map(l => `<button data-act="lang" data-l="${l}" class="${l === L() ? 'on' : ''}">${names[l]}</button>`).join('')}</div></div>`; }
  function header(active) {
    const nav = [['home', '#/'], ['shop', '#/shop'], ['cats', '#cats'], ['best', '#best'], ['deals', '#deals'], ['about', '#about']];
    return `<header class="shead"><div class="wrap shead-in">${logo()}
      <nav class="snav" aria-label="main">${nav.map(([k, h]) => `<a href="${h}" class="${active === k ? 'on' : ''}" ${h[1] !== '/' ? 'data-act="scroll"' : ''}>${t('nav.' + k)}</a>`).join('')}<button class="snav-crm" data-act="start">${icon('chart')} ${t('nav.crm')}</button></nav>
      <form class="ssearch" data-form="search">${icon('search')}<input name="q" type="search" value="${esc(UI.shop.q)}" placeholder="${t('nav.search')}" aria-label="${t('common.search')}"></form>
      <div class="sacts">${langMenu('lang-s')}<button class="ibtn plain hide-sm" data-act="start" title="${t('nav.crm')}" aria-label="${t('nav.crm')}">${icon('chart')}</button><button class="ibtn plain" data-act="wishView" aria-label="${t('shop.wish')}">${icon('heart')}<em class="wishN" hidden></em></button><button class="ibtn plain" data-act="cart" aria-label="${t('cart.t')}">${icon('cart')}<em class="cartN" hidden></em></button><button class="ibtn plain show-sm" data-act="snav" aria-label="${t('common.menu')}">${icon('menu')}</button></div></div></header>`;
  }
  function pcard(p) {
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    const badge = p.badge === 'best' ? `<span class="pb best">${t('badge.best')}</span>` : p.badge === 'new' ? `<span class="pb new">${t('badge.new')}</span>` : off ? `<span class="pb sale">-${bdi(off + '%')}</span>` : '';
    const wished = CART.wish.includes(p.id);
    return `<article class="pcard"><button class="pimg" data-act="pview" data-id="${p.id}" aria-label="${esc(nm(p.name))}"><img src="${photo(p.photo, 480)}" alt="${esc(nm(p.name))}" loading="lazy"></button>${badge}<button class="wish ${wished ? 'on' : ''}" data-act="wish" data-id="${p.id}" aria-label="${t('p.wish')}">${icon(wished ? 'heartFill' : 'heart')}</button>
      <div class="pbody"><h3><button data-act="pview" data-id="${p.id}">${esc(nm(p.name))}</button></h3><p class="rt">${stars(p.rating)} <small>(${bdi(p.reviews)})</small></p><p class="pr"><b>${sarH(p.price)}</b>${p.old ? `<s>${sarH(p.old)}</s>` : ''}</p>
      <button class="btn org block sm" data-act="add" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? t('p.out') : t('p.add')}</button></div></article>`;
  }
  function home() {
    const best = D.products.filter(p => p.badge === 'best').concat(D.products.filter(p => p.badge !== 'best').sort((a, b) => b.reviews - a.reviews)).slice(0, 5);
    const deals = D.products.filter(p => p.old).sort((a, b) => (b.old - b.price) / b.old - (a.old - a.price) / a.old).slice(0, 5);
    const hp = prod('p1');
    const catPhoto = { electronics: 'p1', fashion: 'p8', home: 'p11', beauty: 'p15', sports: 'p17', accessories: 'p20' };
    return header('home') + `<main>
    <section class="hero"><div class="hero-bg"><img src="${photo(hp.photo, 1400, 800)}" alt=""></div><div class="wrap hero-in"><div class="hero-txt">
      <span class="badge">${icon('sparkles')} ${t('hero.badge')}</span><h1>${t('hero.t1')}<br><span class="org-t">${t('hero.t2')}</span></h1><p class="lead">${t('hero.sub')}</p>
      <ul class="hfeat">${[['truck', 1], ['returnI', 2], ['cash', 3]].map(f => `<li>${icon(f[0])}<div><b>${t('hero.f' + f[1])}</b><small>${t('hero.f' + f[1] + 's')}</small></div></li>`).join('')}</ul>
      <div class="hctas"><a class="btn org lg" href="#/shop">${t('hero.shop')} ${icon('arrowRight', 'flip')}</a><button class="btn dark lg" data-act="openAI">${icon('play')} ${t('hero.demo')}</button></div></div>
      <div class="hero-vis"><div class="hprod"><b>${esc(nm(hp.name))}</b><p>${stars(hp.rating)} <small>${bdi(hp.rating)} (${bdi(hp.reviews)})</small></p><p class="pr"><b>${sarH(hp.price)}</b><s>${sarH(hp.old)}</s></p><button class="btn org sm" data-act="add" data-id="p1">${t('p.add')}</button><small class="bs">🔥 ${t('hero.bs')}</small></div>
        <div class="hcards">${[1, 2, 3].map(i => `<div class="hcard"><b>${t('hc.' + i)}</b><small>${t('hc.' + i + 's')}</small></div>`).join('')}</div></div></div></section>
    <section class="wrap cats" id="cats">${CATS.map(c => `<a class="catc" href="#/shop" data-act="cat" data-c="${c}"><img src="${photo(prod(catPhoto[c]).photo, 240)}" alt="" loading="lazy"><b>${t('cat.' + c)}</b><small>${t('cat.shop')} ${icon('arrowRight', 'flip sm')}</small></a>`).join('')}</section>
    <section class="wrap sec" id="best"><div class="sec-h"><div><span class="kick">${t('best.kick')}</span><h2>${t('best.t')}</h2><p class="muted">${t('best.s')}</p></div><a class="link" href="#/shop">${t('best.all')} ${icon('arrowRight', 'flip sm')}</a></div><div class="pgrid">${best.map(pcard).join('')}</div></section>
    <section class="wrap trust">${[['truck', 1], ['cash', 2], ['returnI', 3], ['robot', 4], ['shield', 5]].map(x => `<div>${icon(x[0])}<div><b>${t('trust.' + x[1])}</b><small>${t('trust.' + x[1] + 's')}</small></div></div>`).join('')}</section>
    <section class="wrap aisec"><div class="ai-l"><span class="robot">${icon('robot')}</span><span class="wab">${icon('whatsapp')}</span><h2>${t('feat.t')}</h2><p class="org-t">${t('feat.s')}</p><ul>${[1, 2, 3, 4, 5, 6].map(i => `<li>${icon('check')}${t('feat.l' + i)}</li>`).join('')}</ul><button class="btn org lg" data-act="openAI">${t('feat.cta')} ${icon('arrowRight', 'flip')}</button></div>
      <div class="ai-m"><div class="phone"><div class="ph-h">${icon('chevLeft', 'flip')}<span class="pav">${icon('bagFill')}</span><div><b>TrendCart</b><small>${t('chat.online')}</small></div></div><div class="ph-b"><p class="me">${esc(t('chat.q1'))}</p><p>${esc(t('chat.tier'))}</p><p class="me">${esc(t('chat.premium'))}</p><div class="ph-cards">${['p5', 'p1'].map(id => { const p = prod(id); return `<div><img src="${photo(p.photo, 200)}" alt=""><small>${esc(nm(p.name))}</small><b>${sarH(p.price)}</b></div>`; }).join('')}</div></div><button class="ph-try" data-act="openAI">${icon('send', 'flip')} ${t('chat.ph')}</button></div></div>
      <div class="ai-r"><h3>${t('sf.t')}</h3>${[['sparkles', 1], ['cart', 2], ['truck', 3], ['message', 4], ['trend', 5], ['globe', 6]].map(x => `<div>${icon(x[0])}<div><b>${t('sf.' + x[1])}</b><small>${t('sf.' + x[1] + 's')}</small></div></div>`).join('')}</div></section>
    <section class="wrap sec" id="deals"><div class="sec-h"><div><span class="kick">${t('deals.kick')}</span><h2>${t('deals.t')}</h2><p class="muted">${t('deals.s')}</p></div></div><div class="pgrid">${deals.map(pcard).join('')}</div></section>
    <section class="wrap sec about" id="about"><div><span class="kick">${t('nav.about')}</span><h2>${t('about.t')}</h2><p class="muted">${t('about.p')}</p></div><div class="about-c"><h3>${t('about.cta')}</h3><a class="btn wa lg" href="https://wa.me/${WA_AGENCY}?text=${encodeURIComponent('Hi, I saw the TrendCart demo and want an online store like this.')}" target="_blank" rel="noopener">${icon('whatsapp')} ${t('about.wa')}</a></div></section>
    </main>` + footer();
  }
  function footer() { return `<footer class="sfoot"><div class="wrap sfoot-in">${logo()}<div><p>${t('foot.by')}</p><small>${t('foot.note')} · ${t('foot.photos')}</small></div><small>© <bdi>2026</bdi> AI Digital Marketing</small></div></footer>`; }
  function shop() {
    const s = UI.shop; const q = s.q.trim().toLowerCase();
    let list = D.products.filter(p => (!s.cat || p.cat === s.cat) && (!s.max || p.price <= s.max) && (!s.wish || CART.wish.includes(p.id)) && (!q || [p.name.en, p.name.ar, p.name.ur, t('cat.' + p.cat)].join(' ').toLowerCase().includes(q)));
    list = list.slice().sort(s.sort === 'low' ? (a, b) => a.price - b.price : s.sort === 'high' ? (a, b) => b.price - a.price : s.sort === 'new' ? (a, b) => b.created - a.created : (a, b) => (b.badge === 'best') - (a.badge === 'best') || b.reviews - a.reviews);
    return header('shop') + `<main class="wrap shop"><div class="shop-h"><h1>${s.wish ? t('shop.wish') : s.cat ? t('cat.' + s.cat) : t('shop.t')}</h1><p class="muted">${t('shop.results', { n: '<bdi>' + list.length + '</bdi>' })}</p></div>
      <div class="chipsrow"><button class="${!s.cat && !s.wish ? 'on' : ''}" data-act="cat" data-c="">${t('cat.all')}</button>${CATS.map(c => `<button class="${s.cat === c ? 'on' : ''}" data-act="cat" data-c="${c}">${t('cat.' + c)}</button>`).join('')}<button class="${s.wish ? 'on' : ''}" data-act="wishView">${icon('heart', 'sm')} ${t('shop.wish')}</button></div>
      <div class="filters"><label>${t('shop.sort')}<select data-act="sort">${['pop', 'low', 'high', 'new'].map(k => `<option value="${k}" ${s.sort === k ? 'selected' : ''}>${t('sort.' + k)}</option>`).join('')}</select></label><label>${t('shop.price')}<select data-act="max">${[0, 100, 200, 300, 500].map(v => `<option value="${v}" ${s.max === v ? 'selected' : ''}>${v ? sar(v) : t('common.all')}</option>`).join('')}</select></label>${s.q || s.cat || s.max || s.wish ? `<button class="link" data-act="clearShop">${t('shop.clear')}</button>` : ''}</div>
      ${list.length ? `<div class="pgrid">${list.map(pcard).join('')}</div>` : `<p class="empty big">${t('shop.empty')}</p>`}</main>` + footer();
  }
  function pview(id) {
    const p = prod(id); if (!p) return;
    modal(nm(p.name), `<div class="pv"><img src="${photo(p.photo, 700)}" alt="${esc(nm(p.name))}"><div><p class="muted sm">${t('cat.' + p.cat)} · ${t('p.sku')} <bdi>TC-${p.id.toUpperCase()}</bdi></p><p class="rt">${stars(p.rating)} <small>${bdi(p.rating)} · ${bdi(p.reviews)} ${t('p.reviews')}</small></p><p class="pr big"><b>${sarH(p.price)}</b>${p.old ? `<s>${sarH(p.old)}</s>` : ''}</p><p>${esc(nm(p.desc))}</p>
      <p class="stock ${p.stock <= 5 ? 'low' : ''}">${icon('box', 'sm')} ${p.stock <= 0 ? t('p.out') : p.stock <= 5 ? t('p.low', { n: p.stock }) : t('p.inStock')}</p>
      <div class="row-btns"><button class="btn org" data-act="add" data-id="${p.id}" data-close="1" ${p.stock <= 0 ? 'disabled' : ''}>${icon('cart')} ${t('p.add')}</button><button class="btn ghost" data-act="wish" data-id="${p.id}">${icon(CART.wish.includes(p.id) ? 'heartFill' : 'heart')} ${t('p.wish')}</button></div>
      <ul class="perks"><li>${icon('truck', 'sm')} ${t('hero.f1')} — ${t('hero.f1s')}</li><li>${icon('returnI', 'sm')} ${t('hero.f2s')}</li><li>${icon('cash', 'sm')} ${t('co.cod')}</li></ul></div></div>`, 'wide');
  }

  /* ================= AI SHOPPING ASSISTANT ================= */
  const CHAT = { open: false, items: [], mode: null, ctx: {}, busy: false, hist: [] };
  const say = (who, text, extra) => CHAT.items.push(Object.assign({ who, text, at: Date.now() }, extra || {}));
  function chatInit() { if (!CHAT.items.length) say('bot', t('chat.hello'), { chips: 'start' }); }
  function chips(kind) {
    if (kind === 'start') return `<div class="wchips">${[1, 2, 3, 4].map(i => `<button data-act="chip" data-txt="${esc(t('chat.q' + i))}">${t('chat.q' + i)}</button>`).join('')}</div>`;
    if (kind === 'tier') return `<div class="wchips tier">${['budget', 'mid', 'premium'].map(k => `<button data-act="tier" data-k="${k}">${t('chat.' + k)}</button>`).join('')}</div>`;
    if (kind === 'cart') return `<div class="wchips"><button data-act="cart">${icon('cart', 'sm')} ${t('chat.viewCart')}</button></div>`;
    return '';
  }
  function chatMsgs() {
    const last = CHAT.items.length - 1;
    return CHAT.items.map((m, i) => `<div class="wm ${m.who}">${m.live ? `<span class="livebadge">${t('chat.live')}</span>` : ''}${m.text ? `<p>${esc(m.text)}</p>` : ''}
      ${m.prods && m.prods.length ? `<div class="wprods">${m.prods.map(id => { const p = prod(id); return p ? `<div class="wp"><img src="${photo(p.photo, 300)}" alt="" loading="lazy"><b>${esc(nm(p.name))}</b><span>${sarH(p.price)}</span><button data-act="pview" data-id="${p.id}">${t('chat.view')}</button><button class="add" data-act="chatAdd" data-id="${p.id}">${t('chat.add')}</button></div>` : ''; }).join('')}</div>` : ''}
      ${m.order ? orderCard(m.order) : ''}<small class="wt">${bdi(timeF(m.at))}${m.who === 'me' ? ' ' + icon('checks', 'tick') : ''}</small></div>${i === last && m.chips ? chips(m.chips) : ''}`).join('') + (CHAT.busy ? '<div class="wm bot typing"><i></i><i></i><i></i></div>' : '');
  }
  function orderCard(id) { const o = ord(id); if (!o) return ''; const steps = ['pending', 'processing', 'shipped', 'delivered']; const k = Math.max(0, steps.indexOf(o.status === 'paid' ? 'pending' : o.status)); return `<div class="wtrack"><b><bdi>#${o.id}</bdi></b>${ostTag(o.status)}<ol>${steps.map((s, j) => `<li class="${j <= k && !['cancelled', 'returned'].includes(o.status) ? 'on' : ''}">${t('ost.' + s)}</li>`).join('')}</ol></div>`; }
  function chatWidget() {
    chatInit();
    return `<button class="aifab ${CHAT.open ? 'hide' : ''}" data-act="openAI" aria-label="${t('hero.demo')}">${icon('whatsapp')}<span>${t('hero.demo')}</span></button>
    <section class="wpanel ${CHAT.open ? 'open' : ''}" aria-label="TrendCart AI"><header><button class="ibtn ghost-w" data-act="closeAI" aria-label="${t('common.close')}">${icon('chevLeft', 'flip')}</button><span class="wav">${icon('bagFill')}</span><div><b>TrendCart ${icon('verified', 'vf')}</b><small>${t('chat.online')}</small></div><button class="ibtn ghost-w" data-act="aiReset" aria-label="restart">${icon('refresh')}</button></header>
      <div class="wbody" id="wbody">${chatMsgs()}</div>
      <form class="wcomp" data-form="ai"><input name="q" maxlength="400" autocomplete="off" placeholder="${t('chat.ph')}" aria-label="${t('chat.ph')}"><button class="wsend" type="submit" aria-label="${t('common.send')}" ${CHAT.busy ? 'disabled' : ''}>${icon('send', 'flip')}</button></form></section>`;
  }
  function renderChat() { const w = $('#aiw'); if (!w) return; w.innerHTML = chatWidget(); const b = $('#wbody'); if (b) b.scrollTop = b.scrollHeight; }
  function logAI(kind) { D.aiLog.unshift({ at: Date.now(), kind, text: CHAT.hist.filter(h => h.role === 'user').slice(-1).map(h => h.text)[0] || '' }); D.aiLog = D.aiLog.slice(0, 30); save(); }
  async function handle(text, viaChip) {
    if (CHAT.busy || !text.trim()) return;
    say('me', text.trim()); CHAT.hist.push({ role: 'user', text: text.trim() });
    const x = AI.parse(text);
    // order tracking
    if (x.orderId && (CHAT.mode === 'return' || x.ret)) { ticket(x.orderId, x.ret || 'return', text); return renderChat(); }
    if (x.orderId) { trackReply(x.orderId); return renderChat(); }
    if (x.ret) { CHAT.mode = 'return'; CHAT.ctx.retType = x.ret; say('bot', t('chat.askReturn')); logAI('return'); return renderChat(); }
    if (x.track && !x.pids && !x.cat) { CHAT.mode = 'track'; say('bot', t('chat.askOrder')); return renderChat(); }
    if (CHAT.mode === 'return' && /\d/.test(text)) { ticket(null, CHAT.ctx.retType || 'return', text); return renderChat(); }
    // product discovery
    if (x.pids || x.cat || x.budget || x.gift) {
      CHAT.ctx = Object.assign(CHAT.ctx, { pids: x.pids || (x.cat || x.budget ? null : CHAT.ctx.pids), cat: x.cat || null, budget: x.budget || (x.gift ? 200 : null) });
      if (x.tier || x.budget || x.gift) return recommend(x.tier);
      CHAT.mode = 'tier'; say('bot', t('chat.tier'), { chips: 'tier' }); logAI('browse'); return renderChat();
    }
    if (x.tier && CHAT.ctx.pids) return recommend(x.tier);
    // free text → live AI (if available)
    CHAT.busy = true; renderChat();
    const r = await AI.chatFree(CHAT.hist, D.products, CART.items, L());
    CHAT.busy = false;
    if (r) { CHAT.hist.push({ role: 'model', text: r.reply }); say('bot', r.reply, { live: true, prods: r.products }); if (r.add) { addToCart(r.add, 1, true); say('bot', t('chat.added', { p: nm(prod(r.add).name) }), { chips: 'cart' }); } logAI('ai'); }
    else say('bot', t('chat.generic'), { chips: 'start' });
    renderChat();
  }
  function recommend(tier) {
    const list = AI.recommend(D.products, Object.assign({}, CHAT.ctx, { tier }));
    const fb = list.length ? list : AI.recommend(D.products, { tier });
    say('bot', list.length ? t('chat.here') : t('chat.none'), { prods: fb.map(p => p.id) }); CHAT.mode = null; logAI('recommend'); renderChat();
  }
  function trackReply(id) {
    const o = ord(id); CHAT.mode = null;
    if (!o) { say('bot', t('chat.noOrder', { id: '#' + id })); return; }
    const eta = t('chat.eta.' + (['shipped', 'delivered', 'processing', 'pending'].includes(o.status) ? o.status : o.status === 'paid' ? 'processing' : 'other'));
    say('bot', t('chat.order', { id: '#' + o.id, st: t('ost.' + o.status), items: itemsLabel(o), total: sar(o.total), eta }), { order: o.id }); logAI('track');
  }
  function ticket(oid, type, text) {
    const o = oid ? ord(oid) : D.orders[0]; CHAT.mode = null;
    if (oid && !o) { say('bot', t('chat.noOrder', { id: '#' + oid })); return; }
    const tk = 'RT-' + String(D.nextTk++).padStart(4, '0');
    const reason = text.replace(/#?\s*TC-?\s*\d+/i, '').trim().slice(0, 120) || '—';
    D.tickets.unshift({ id: tk, type, oid: o.id, cid: o.cid, reason: { en: reason, ar: reason, ur: reason }, status: 'open', at: Date.now() });
    D.notifs.unshift({ id: uid('n'), k: 'notif.n3', v: { tk }, at: Date.now(), read: false }); save();
    say('bot', t('chat.ticket', { type: t('ai.' + type), tk, id: '#' + o.id })); logAI('ticket');
  }

  /* ================= CRM ================= */
  const NAVI = { dashboard: 'home', orders: 'box', products: 'tag', customers: 'users', analytics: 'chart', marketing: 'send', ai: 'robot', discounts: 'percent', reviews: 'star', whatsapp: 'whatsapp', settings: 'settings' };
  function shell(page, content) {
    const unread = D.notifs.filter(n => !n.read).length, newO = D.orders.filter(o => ['pending', 'paid'].includes(o.status)).length, wa = D.chats.reduce((a, c) => a + (c.unread || 0), 0);
    return `<div class="app ${UI.sidebar ? 'sb-open' : ''}"><aside class="side">${logo(true)}<nav>${Object.keys(NAVI).map(p => `<a href="#/app/${p}" class="${p === page ? 'on' : ''}" data-act="nav">${icon(NAVI[p])}<span>${t('side.' + p)}</span>${p === 'orders' && newO ? `<em>${newO}</em>` : p === 'ai' ? `<em class="nw">${t('side.new')}</em>` : p === 'whatsapp' && wa ? `<em class="g">${wa}</em>` : ''}</a>`).join('')}</nav>
      <div class="side-foot"><a class="sfl" href="#/">${icon('bag')} ${t('top.store')}</a><span class="demo-tag"><i class="live"></i>${t('top.demo')}</span></div></aside><div class="sb-back" data-act="sidebar"></div>
      <div class="main"><header class="top"><button class="ibtn show-md" data-act="sidebar" aria-label="${t('common.menu')}">${icon('menu')}</button>
        <div class="search" id="gsearch">${icon('search')}<input type="search" placeholder="${t('top.search')}" data-act="gsearch" aria-label="${t('common.search')}" autocomplete="off"><div class="sres" id="sres"></div></div>
        <div class="tacts">${langMenu('lang-a')}<button class="ibtn" data-act="theme" aria-label="${t('theme.toggle')}">${icon(PREFS.theme === 'dark' ? 'sun' : 'moon')}</button>
          <div class="dd ${UI.menus === 'notif' ? 'open' : ''}"><button class="ibtn" data-act="menu" data-id="notif" aria-label="${t('top.notif')}">${icon('bell')}${unread ? `<em class="dot">${unread}</em>` : ''}</button><div class="ddm wide"><div class="ddh"><b>${t('top.notif')}</b><button class="link" data-act="markRead">${t('top.markread')}</button></div>${D.notifs.slice(0, 8).map(n => `<div class="nitem ${n.read ? '' : 'unread'}">${icon('bell')}<div><p>${esc(t(n.k, nv(n.v)))}</p><small>${rel(n.at)}</small></div></div>`).join('')}</div></div>
          <div class="dd ${UI.menus === 'user' ? 'open' : ''}"><button class="ubtn" data-act="menu" data-id="user">${avatar({ en: userName() })}<span class="hide-sm"><b>${bdi(userName())}</b><small>${t('top.role')}</small></span>${icon('chevDown', 'sm')}</button><div class="ddm"><a href="#/app/settings" data-act="nav">${icon('settings')}${t('side.settings')}</a><a href="#/">${icon('bag')}${t('top.store')}</a><button data-act="reset">${icon('refresh')}${t('top.reset')}</button><button data-act="logout">${icon('logout')}${t('top.logout')}</button></div></div></div></header>
        <main class="content" id="content">${content}</main></div></div>`;
  }
  function nv(v) { const o = {}; for (const k in v) o[k] = typeof v[k] === 'object' ? nm(v[k]) : v[k]; return o; }
  const head = (title, sub, acts) => `<div class="phead"><div><h1>${title}</h1><p class="muted">${sub}</p></div><div class="pacts">${acts || ''}</div></div>`;
  function inRange(ts, r) { const n = new Date(); if (r === 'month') return ts >= new Date(n.getFullYear(), n.getMonth(), 1).getTime(); if (r === 'q') return ts >= Date.now() - 90 * 864e5; return ts >= new Date(n.getFullYear(), 0, 1).getTime(); }
  const valid = o => !['cancelled', 'returned'].includes(o.status);
  function monthly() { const y = new Date().getFullYear(), m = new Date().getMonth(); const out = []; for (let i = 0; i <= m; i++) { const s = new Date(y, i, 1).getTime(), e = new Date(y, i + 1, 1).getTime(); const os = D.orders.filter(o => o.created >= s && o.created < e && valid(o)); out.push({ label: new Intl.DateTimeFormat(I18N.locale(), { month: 'short' }).format(new Date(y, i, 1)), a: os.reduce((a, o) => a + o.total, 0), b: os.length, c: new Set(os.map(o => o.cid)).size }); } return out; }
  function kpis() {
    const r = UI.range, os = D.orders.filter(o => inRange(o.created, r) && valid(o));
    const sales = os.reduce((a, o) => a + o.total, 0), custs = new Set(os.map(o => o.cid)).size;
    const mo = monthly(), visits = Math.max(1, os.length * 21);
    return [
      { k: 'kpi.sales', v: sarH(sales), d: 28, c: '#ef4444', ic: 'chart', sp: mo.map(x => x.a) },
      { k: 'kpi.orders', v: bdi(os.length), d: 18, c: '#3b82f6', ic: 'box', sp: mo.map(x => x.b) },
      { k: 'kpi.customers', v: bdi(custs), d: 32, c: '#8b5cf6', ic: 'users', sp: mo.map(x => x.c) },
      { k: 'kpi.conv', v: bdi((os.length / visits * 100).toFixed(1) + '%'), d: 12, c: '#f97316', ic: 'percent', sp: mo.map(x => x.b / (x.b * 21 || 1) * 100 + (x.b % 3)) },
    ];
  }
  const kpiCard = k => `<div class="kpi card"><div class="kt"><span class="kic" style="--c:${k.c}">${icon(k.ic)}</span><div><small>${t(k.k)}</small><b>${k.v}</b></div></div><div class="kb"><span class="dl">${icon('arrowUp', 'sm')}${bdi(k.d + '%')}</span>${k.sp ? Charts.spark(k.sp, k.c === '#ef4444' ? '#ef4444' : k.c) : ''}</div></div>`;
  function topProducts(n) {
    const cnt = {}; D.orders.filter(o => inRange(o.created, UI.range) && valid(o)).forEach(o => o.items.forEach(i => { cnt[i.pid] = cnt[i.pid] || { q: 0, rev: 0 }; cnt[i.pid].q += i.qty; cnt[i.pid].rev += i.qty * i.price; }));
    return Object.entries(cnt).sort((a, b) => b[1].rev - a[1].rev).slice(0, n).map(([pid, v]) => ({ p: prod(pid), ...v })).filter(x => x.p);
  }
  function recentOrders(n) { return `<ul class="rlist">${D.orders.slice(0, n).map(o => { const c = cus(o.cid); return `<li data-act="order" data-id="${o.id}">${avatar(c.name, 'sm')}<div><b><bdi>#${o.id}</bdi></b><small>${esc(nm(c.name))} · ${rel(o.created)}</small></div><div class="r"><b>${sarH(o.total)}</b>${ostTag(o.status)}</div></li>`; }).join('')}</ul>`; }
  function pgDashboard() {
    const now = new Date(), from = new Date(now.getFullYear(), now.getMonth(), 1);
    return head(t('dash.hi'), t('dash.his', { name: '<bdi>' + esc(userName().split(' ')[0]) + '</bdi>' }), `<span class="chip">${icon('calendar', 'sm')} ${dateF(from)} – ${dateF(now)}</span><select class="chip" data-act="range" aria-label="range">${['month', 'q', 'year'].map(r => `<option value="${r}" ${UI.range === r ? 'selected' : ''}>${t('range.' + r)}</option>`).join('')}</select>`)
      + `<div class="kpis">${kpis().map(kpiCard).join('')}</div>
      <div class="grid3"><div class="card"><div class="ch"><h4>${t('dash.sales')}</h4><span class="leg2"><i class="la"></i>${t('leg.sales')} <i class="lb"></i>${t('leg.orders')}</span></div>${Charts.combo(monthly().slice(-10), v => cmpF.format(v))}${(() => { const os = D.orders.filter(valid); const tot = os.reduce((a, o) => a + o.total, 0); return `<div class="stats3 mt"><div><b>${sarH(tot, true)}</b><small>${t('kpi.sales')} · ${t('range.year')}</small></div><div><b>${bdi(os.length)}</b><small>${t('kpi.orders')}</small></div><div><b>${sarH(tot / (os.length || 1))}</b><small>${t('kpi.aov')}</small></div></div>`; })()}</div>
      <div class="card"><div class="ch"><h4>${t('dash.top')}</h4><a class="link" href="#/app/products" data-act="nav">${t('dash.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div><ul class="tplist">${topProducts(5).map((x, i) => `<li data-act="editProd" data-id="${x.p.id}"><em>${bdi(i + 1)}</em><img src="${photo(x.p.photo, 90)}" alt=""><div><b>${esc(nm(x.p.name))}</b><small>${t('dash.sold', { n: '<bdi>' + x.q + '</bdi>' })}</small></div><b>${sarH(x.rev)}</b></li>`).join('') || `<p class="empty">—</p>`}</ul></div>
      <div class="card"><div class="ch"><h4>${t('dash.recent')}</h4><a class="link" href="#/app/orders" data-act="nav">${t('dash.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div>${recentOrders(5)}</div></div>`;
  }
  const OST = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  function pgOrders() {
    const q = UI.of.q.trim().toLowerCase();
    const all = D.orders.filter(o => (!UI.of.st || o.status === UI.of.st) && (!q || o.id.toLowerCase().includes(q.replace('#', '')) || nm(cus(o.cid).name).toLowerCase().includes(q) || cus(o.cid).name.en.toLowerCase().includes(q)));
    const list = all.slice(0, UI.page * 15);
    return head(t('ord.t'), t('ord.s'), `<button class="btn ghost" data-act="exportOrders">${icon('download')} ${t('ord.export')}</button>`)
      + `<div class="tabs"><button class="${!UI.of.st ? 'on' : ''}" data-act="of" data-v="">${t('ord.all')} <em>${bdi(D.orders.length)}</em></button>${OST.map(s => `<button class="${UI.of.st === s ? 'on' : ''}" data-act="of" data-v="${s}">${t('ost.' + s)} <em>${bdi(D.orders.filter(o => o.status === s).length)}</em></button>`).join('')}</div>
      <div class="card"><div class="filters"><div class="search inline">${icon('search')}<input type="search" value="${esc(UI.of.q)}" placeholder="${t('ord.search')}" data-act="oq" aria-label="${t('common.search')}"></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('col.order')}</th><th>${t('col.customer')}</th><th class="hide-md">${t('col.items')}</th><th class="hide-sm">${t('col.city')}</th><th class="hide-md">${t('col.payment')}</th><th>${t('col.total')}</th><th>${t('col.status')}</th><th class="hide-sm">${t('col.date')}</th></tr></thead><tbody>
      ${list.map(o => { const c = cus(o.cid); return `<tr data-act="order" data-id="${o.id}"><td><b><bdi>#${o.id}</bdi></b>${o.demo ? ' <span class="tagdemo">demo</span>' : ''}</td><td><span class="who">${avatar(c.name, 'sm')}<span>${esc(nm(c.name))}</span></span></td><td class="hide-md sm">${esc(itemsLabel(o)).slice(0, 48)}</td><td class="hide-sm">${t('city.' + o.city)}</td><td class="hide-md">${t('pay.' + o.pay)}</td><td class="nowrap"><b>${sarH(o.total)}</b></td><td>${ostTag(o.status)}</td><td class="hide-sm nowrap">${dateF(o.created)}</td></tr>`; }).join('')}</tbody></table>${!all.length ? `<p class="empty">${t('ord.empty')}</p>` : ''}</div>
      ${all.length > list.length ? `<div class="center"><button class="btn ghost" data-act="more">${t('ord.more')} (${bdi(all.length - list.length)})</button></div>` : ''}</div>`;
  }
  function orderDrawer(id) {
    const o = ord(id); if (!o) return; const c = cus(o.cid);
    const steps = ['pending', 'processing', 'shipped', 'delivered']; const k = steps.indexOf(o.status === 'paid' ? 'pending' : o.status);
    drawer(`<div class="dh"><div><h3>${t('ord.detail', { id: '<bdi>#' + o.id + '</bdi>' })}</h3><p>${ostTag(o.status)} <span class="muted sm">${dateF(o.created)} · ${bdi(timeF(o.created))}</span></p></div><button class="ibtn" data-act="closeDrawer" aria-label="${t('common.close')}">${icon('x')}</button></div>
      <div class="dbody"><ol class="steps">${steps.map((s, j) => `<li class="${j <= k ? 'on' : ''}">${t('ost.' + s)}</li>`).join('')}</ol>
        <div class="oitems">${o.items.map(i => { const p = prod(i.pid) || { name: { en: '?' }, photo: '' }; return `<div><img src="${photo(p.photo, 120)}" alt=""><span>${esc(nm(p.name))} <small>× ${bdi(i.qty)}</small></span><b>${sarH(i.qty * i.price)}</b></div>`; }).join('')}</div>
        <dl class="tot"><div><dt>${t('cart.sub')}</dt><dd>${sarH(o.sub)}</dd></div>${o.disc ? `<div class="dsc"><dt>${t('cart.disc')}</dt><dd>−${sarH(o.disc)}</dd></div>` : ''}<div><dt>${t('cart.ship')}</dt><dd>${o.ship ? sarH(o.ship) : t('cart.free')}</dd></div><div class="grand"><dt>${t('cart.total')}</dt><dd>${sarH(o.total)}</dd></div></dl>
        <div class="cbox">${avatar(c.name)}<div><b>${esc(nm(c.name))}</b><small>${bdi(c.phone)}</small><small>${t('ord.ship')}: ${t('city.' + o.city)}${o.addr ? ', ' + esc(o.addr) : ''}</small><small>${t('col.payment')}: ${t('pay.' + o.pay)}</small></div></div>
        <label>${t('ord.status')}<select data-act="ostatus" data-id="${o.id}">${OST.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${t('ost.' + s)}</option>`).join('')}</select></label>
        <div class="dacts"><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Hi ${c.name.en.split(' ')[0]}, your TrendCart order #${o.id} is now: ${I18N.dicts.en['ost.' + o.status]}. Thank you for shopping with us!`)}">${icon('whatsapp')} ${t('ord.waUpdate')}</a><button class="btn ghost" data-act="invoice" data-id="${o.id}">${icon('printer')} ${t('ord.invoice')}</button><button class="btn ghost" data-act="cust" data-id="${c.id}">${icon('user')} ${t('col.customer')}</button></div></div>`);
  }
  function invoice(id) {
    const o = ord(id), c = cus(o.cid);
    modal(t('ord.invoice') + ' #' + o.id, `<div class="inv"><div class="invh">${logo()}<div><b><bdi>#${o.id}</bdi></b><small>${dateF(o.created)}</small></div></div><p><b>${esc(nm(c.name))}</b><br><small>${bdi(c.phone)} · ${t('city.' + o.city)}</small></p><table class="tbl"><thead><tr><th>${t('col.product')}</th><th>${t('p.qty')}</th><th>${t('col.price')}</th></tr></thead><tbody>${o.items.map(i => `<tr><td>${esc(nm(prod(i.pid).name))}</td><td>${bdi(i.qty)}</td><td>${sarH(i.qty * i.price)}</td></tr>`).join('')}</tbody></table><dl class="tot"><div class="grand"><dt>${t('cart.total')}</dt><dd>${sarH(o.total)}</dd></div></dl><p class="muted sm">${t('foot.note')}</p><button class="btn org" data-act="print">${icon('printer')} ${t('ord.print')}</button></div>`, 'narrow');
  }
  function pgProducts() {
    const sold = {}; D.orders.filter(valid).forEach(o => o.items.forEach(i => sold[i.pid] = (sold[i.pid] || 0) + i.qty));
    return head(t('prd.t'), t('prd.s'), `<button class="btn org" data-act="addProd">${icon('plus')} ${t('prd.add')}</button>`)
      + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('col.product')}</th><th class="hide-sm">${t('col.cat')}</th><th>${t('col.price')}</th><th>${t('col.stock')}</th><th class="hide-sm">${t('col.sold')}</th><th class="hide-md">${t('col.rating')}</th></tr></thead><tbody>
      ${D.products.map(p => `<tr data-act="editProd" data-id="${p.id}"><td><span class="who"><img class="thumb" src="${photo(p.photo, 90)}" alt=""><span>${esc(nm(p.name))}</span></span></td><td class="hide-sm">${t('cat.' + p.cat)}</td><td class="nowrap">${sarH(p.price)}${p.old ? ` <s class="muted sm">${sarH(p.old)}</s>` : ''}</td><td>${p.stock <= 5 ? `<span class="pill low">${bdi(p.stock)} · ${t('prd.low')}</span>` : bdi(p.stock)}</td><td class="hide-sm">${bdi(sold[p.id] || 0)}</td><td class="hide-md">${stars(p.rating)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function prodForm(p) {
    p = p || { name: { en: '' }, cat: 'electronics', price: 99, old: 0, stock: 10, badge: '', desc: { en: '' } };
    return `<form class="form" data-form="prod" data-id="${p.id || ''}" novalidate><div class="row2"><label>${t('prd.name')} *<input name="name" required maxlength="60" value="${esc(nm(p.name))}"></label><label>${t('col.cat')}<select name="cat">${CATS.map(c => `<option value="${c}" ${p.cat === c ? 'selected' : ''}>${t('cat.' + c)}</option>`).join('')}</select></label></div>
      <div class="row3"><label>${t('col.price')} (SAR) *<input name="price" type="number" min="1" required value="${p.price}"></label><label>${t('prd.old')}<input name="old" type="number" min="0" value="${p.old || ''}"></label><label>${t('col.stock')}<input name="stock" type="number" min="0" value="${p.stock}"></label></div>
      <label>${t('prd.badge')}<select name="badge"><option value="">${t('prd.none')}</option><option value="best" ${p.badge === 'best' ? 'selected' : ''}>${t('badge.best')}</option><option value="new" ${p.badge === 'new' ? 'selected' : ''}>${t('badge.new')}</option><option value="sale" ${p.badge === 'sale' ? 'selected' : ''}>Sale</option></select></label>
      <label>${t('p.desc')}<textarea name="desc" rows="2" maxlength="300">${esc(nm(p.desc))}</textarea></label>
      <div class="mfoot">${p.id ? `<button type="button" class="btn danger" data-act="delProd" data-id="${p.id}">${icon('trash')}</button><span class="sp"></span>` : ''}<button type="button" class="btn ghost" data-act="closeModal">${t('common.cancel')}</button><button class="btn org" type="submit">${t('common.save')}</button></div></form>`;
  }
  function custStats(c) { const os = D.orders.filter(o => o.cid === c.id); return { n: os.length, spent: os.filter(valid).reduce((a, o) => a + o.total, 0), last: os[0] ? os[0].created : null, os }; }
  function pgCustomers() {
    const rows = D.customers.map(c => ({ c, s: custStats(c) })).filter(x => x.s.n).sort((a, b) => b.s.spent - a.s.spent);
    return head(t('cus.t'), t('cus.s'), '') + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('col.customer')}</th><th class="hide-sm">${t('col.phone')}</th><th>${t('col.city')}</th><th>${t('col.orders')}</th><th>${t('col.spent')}</th><th class="hide-sm">${t('col.last')}</th></tr></thead><tbody>
      ${rows.map(({ c, s }, i) => `<tr data-act="cust" data-id="${c.id}"><td><span class="who">${avatar(c.name, 'sm')}<span>${esc(nm(c.name))}</span>${i < 5 ? `<span class="pill vip">${t('cus.vip')}</span>` : ''}</span></td><td class="hide-sm nowrap">${bdi(c.phone)}</td><td>${t('city.' + c.city)}</td><td>${bdi(s.n)}</td><td class="nowrap">${sarH(s.spent)}</td><td class="hide-sm nowrap">${s.last ? dateF(s.last) : '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function custDrawer(id) {
    const c = cus(id), s = custStats(c);
    drawer(`<div class="dh">${avatar(c.name, 'lg')}<div><h3>${esc(nm(c.name))}</h3><p class="muted sm">${bdi(c.phone)} · ${t('city.' + c.city)}</p></div><button class="ibtn" data-act="closeDrawer" aria-label="${t('common.close')}">${icon('x')}</button></div>
      <div class="dbody"><div class="stats3"><div><b>${bdi(s.n)}</b><small>${t('col.orders')}</small></div><div><b>${sarH(s.spent, true)}</b><small>${t('col.spent')}</small></div><div><b>${s.n ? sarH(s.spent / s.n, true) : '—'}</b><small>${t('kpi.aov')}</small></div></div>
      <p class="muted sm">${t('cus.since')}: ${dateF(c.since)}</p>${recentFor(s.os)}<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Hi ' + c.name.en.split(' ')[0] + ' 👋')}">${icon('whatsapp')} WhatsApp</a></div>`);
  }
  const recentFor = os => `<ul class="rlist">${os.slice(0, 8).map(o => `<li data-act="order" data-id="${o.id}"><span class="oi">${icon('box')}</span><div><b><bdi>#${o.id}</bdi></b><small>${dateF(o.created)}</small></div><div class="r"><b>${sarH(o.total)}</b>${ostTag(o.status)}</div></li>`).join('')}</ul>`;
  function pgAnalytics() {
    const os = D.orders.filter(valid); const byCat = {}, byCity = {};
    os.forEach(o => { byCity[o.city] = (byCity[o.city] || 0) + 1; o.items.forEach(i => { const p = prod(i.pid); if (p) byCat[p.cat] = (byCat[p.cat] || 0) + i.qty * i.price; }); });
    const sales = os.reduce((a, o) => a + o.total, 0), visits = os.length * 21, carts = Math.round(visits * 0.14), cks = Math.round(visits * 0.07);
    const fun = [['an.visits', visits], ['an.carts', carts], ['an.checkouts', cks], ['an.purchases', os.length]];
    return head(t('an.t'), t('an.s'), `<button class="btn org" data-act="exportOrders">${icon('download')} ${t('an.export')}</button>`)
      + `<div class="kpis">${kpiCard({ k: 'kpi.sales', v: sarH(sales, true), d: 24, c: '#ef4444', ic: 'chart' })}${kpiCard({ k: 'kpi.aov', v: sarH(sales / (os.length || 1)), d: 6, c: '#3b82f6', ic: 'cart' })}${kpiCard({ k: 'kpi.conv', v: bdi((os.length / visits * 100).toFixed(1) + '%'), d: 12, c: '#f97316', ic: 'percent' })}${kpiCard({ k: 'kpi.recovered', v: bdi(D.abandoned.filter(a => a.recovered).length), d: 50, c: '#16a34a', ic: 'returnI' })}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('an.byCat')}</h4></div>${Charts.bars(CATS.map(c => ({ label: t('cat.' + c).split(' ')[0], value: Math.round(byCat[c] || 0) })), { fmt: v => cmpF.format(v) })}</div>
      <div class="card"><div class="ch"><h4>${t('an.funnel')}</h4></div><div class="funnel">${fun.map(f => `<div><span>${t(f[0])}</span><div class="fb"><i style="width:${Math.max(3, f[1] / fun[0][1] * 100)}%"></i></div><b>${bdi(numF.format(f[1]))}</b></div>`).join('')}</div><p class="muted sm">${t('foot.note')}</p></div></div>
      <div class="card"><div class="ch"><h4>${t('an.byCity')}</h4></div>${Charts.bars(CITIES.map(c => ({ label: t('city.' + c), value: byCity[c] || 0 })))}</div>`;
  }
  function pgMarketing() {
    return head(t('mk.t'), t('mk.s'), '') + `<h4 class="gh">${icon('cart')} ${t('mk.ab')} <em>${bdi(D.abandoned.filter(a => !a.recovered).length)}</em></h4><p class="muted sm">${t('mk.abS')}</p>
      <div class="abgrid">${D.abandoned.map(a => { const c = cus(a.cid); const val = a.items.reduce((s, i) => s + prod(i.pid).price * i.qty, 0); return `<article class="card ab ${a.recovered ? 'rec' : ''}"><div class="cbox">${avatar(c.name)}<div><b>${esc(nm(c.name))}</b><small>${t('mk.left')} ${rel(a.at)} · ${t('city.' + c.city)}</small></div>${a.recovered ? `<span class="pill os-delivered">${t('mk.recovered')}</span>` : a.sent ? `<span class="pill os-shipped">${t('mk.sent')}</span>` : ''}</div>
        <div class="abimgs">${a.items.map(i => `<img src="${photo(prod(i.pid).photo, 120)}" alt="${esc(nm(prod(i.pid).name))}" title="${esc(nm(prod(i.pid).name))}">`).join('')}<div><small>${t('mk.value')}</small><b>${sarH(val)}</b></div></div>
        ${a.recovered ? '' : `<button class="btn grn block sm" data-act="recover" data-id="${a.id}">${icon('sparkles')} ${t('mk.draft')}</button><div id="rec-${a.id}"></div>`}</article>`; }).join('')}</div>
      <h4 class="gh">${icon('send')} ${t('mk.camp')}</h4><div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('mk.camp')}</th><th>${t('mk.platform')}</th><th>${t('mk.spend')}</th><th class="hide-sm">${t('mk.revenue')}</th><th>${t('mk.roas')}</th><th>${t('col.status')}</th></tr></thead><tbody>
      ${D.campaigns.map(g => `<tr><td><b>${bdi(g.name)}</b></td><td>${bdi(g.platform)}</td><td class="nowrap">${sarH(g.spend)}</td><td class="hide-sm nowrap">${sarH(g.revenue)}</td><td><b>${bdi((g.revenue / g.spend).toFixed(1) + 'x')}</b></td><td><button class="toggle ${g.on ? 'on' : ''}" data-act="camp" data-id="${g.id}"><i></i><span>${t(g.on ? 'mk.active' : 'mk.paused')}</span></button></td></tr>`).join('')}</tbody></table></div><p class="muted sm">${t('foot.note')}</p></div>`;
  }
  function pgAI() {
    const today = D.aiLog.filter(x => x.at > Date.now() - 864e5).length; const openTk = D.tickets.filter(x => x.status === 'open').length;
    return head(t('ai.t'), t('ai.s'), `<button class="btn org" data-act="openAI">${icon('robot')} ${t('feat.cta')}</button>`)
      + `<div class="kpis three">${kpiCard({ k: 'ai.chats', v: bdi(14 + today), d: 20, c: '#0ea5e9', ic: 'message' })}${kpiCard({ k: 'ai.carts', v: bdi(6 + D.aiLog.filter(x => x.kind === 'cart').length), d: 15, c: '#f97316', ic: 'cart' })}${kpiCard({ k: 'ai.tickets', v: bdi(openTk), d: -8, c: '#ef4444', ic: 'returnI' })}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('ai.tk')}</h4></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${t('ai.tkType')}</th><th>${t('col.order')}</th><th class="hide-sm">${t('ai.reason')}</th><th>${t('col.status')}</th></tr></thead><tbody>
        ${D.tickets.map(k => `<tr><td><b><bdi>${k.id}</bdi></b><br><small class="muted">${rel(k.at)}</small></td><td>${t('ai.' + k.type)}</td><td><button class="link" data-act="order" data-id="${k.oid}"><bdi>#${k.oid}</bdi></button></td><td class="hide-sm sm">${esc(nm(k.reason))}</td><td>${k.status === 'open' ? `<button class="btn ghost sm" data-act="resolve" data-id="${k.id}">${icon('check')} ${t('ai.resolve')}</button>` : `<span class="pill os-delivered">${t('ai.resolved')}</span>`}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h4>${t('ai.log')}</h4></div>${D.aiLog.length ? `<ul class="alog">${D.aiLog.slice(0, 10).map(x => `<li>${icon(x.kind === 'track' ? 'truck' : x.kind === 'ticket' || x.kind === 'return' ? 'returnI' : x.kind === 'cart' ? 'cart' : 'robot')}<div><p>${esc(x.text || x.kind)}</p><small>${rel(x.at)}</small></div></li>`).join('')}</ul>` : `<p class="empty">${t('chat.generic')}</p>`}</div></div>`;
  }
  function pgDiscounts() {
    return head(t('dc.t'), t('dc.s'), `<button class="btn org" data-act="addCoupon">${icon('plus')} ${t('dc.add')}</button>`) + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('col.code')}</th><th>${t('col.type')}</th><th>${t('col.value')}</th><th class="hide-sm">${t('dc.min')}</th><th>${t('col.uses')}</th><th>${t('col.status')}</th></tr></thead><tbody>
      ${D.coupons.map(c => `<tr><td><b class="code">${bdi(c.code)}</b></td><td>${t(c.type === 'pct' ? 'dc.pct' : 'dc.fixed')}</td><td><b>${c.type === 'pct' ? bdi(c.value + '%') : sarH(c.value)}</b></td><td class="hide-sm">${c.min ? sarH(c.min) : '—'}</td><td>${bdi(c.uses)}</td><td><button class="toggle ${c.on ? 'on' : ''}" data-act="coupon" data-id="${c.id}"><i></i><span>${t(c.on ? 'dc.on' : 'dc.off')}</span></button></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function pgReviews() {
    return head(t('rv.t'), t('rv.s'), '') + `<div class="rvlist">${D.reviews.map(r => { const p = prod(r.pid), c = cus(r.cid); return `<article class="card rv"><div class="rvh"><img src="${photo(p.photo, 90)}" alt=""><div><b>${esc(nm(p.name))}</b><p>${stars(r.stars)} <small>${esc(nm(c.name))} · ${dateF(r.at)}</small></p></div>${r.approved ? `<span class="pill os-delivered">${t('rv.approved')}</span>` : `<button class="btn ghost sm" data-act="approve" data-id="${r.id}">${icon('check')} ${t('rv.approve')}</button>`}</div><p class="rvt">${esc(nm(r.text))}</p>
      ${r.reply ? `<p class="rvr">${icon('message', 'sm')} ${esc(r.reply)}</p>` : `<div class="row-btns"><button class="btn ghost sm" data-act="rvReply" data-id="${r.id}">${icon('sparkles')} ${t('rv.reply')}</button></div><div id="rvr-${r.id}"></div>`}</article>`; }).join('')}</div>`;
  }
  const msgText = m => m.text != null ? m.text : (m.t[L()] || m.t.en);
  function pgWhatsapp() {
    const sel = D.chats.find(c => c.id === UI.chat);
    return head(t('wa.t'), t('wa.s'), '') + `<div class="inbox card ${sel ? 'has-sel' : ''}"><div class="ilist">${D.chats.map(c => { const u = cus(c.cid), last = c.msgs[c.msgs.length - 1]; return `<button class="ichat ${c.id === UI.chat ? 'on' : ''}" data-act="openChat" data-id="${c.id}">${avatar(u.name)}<div><b>${esc(nm(u.name))}</b><p>${esc(msgText(last)).slice(0, 60)}</p></div><small>${rel(last.at)}</small>${c.unread ? `<em>${bdi(c.unread)}</em>` : ''}</button>`; }).join('')}</div>
      <div class="ithread">${sel ? (() => { const u = cus(sel.cid); return `<div class="ith-h"><button class="ibtn show-sm" data-act="closeChat" aria-label="back">${icon('chevLeft', 'flip')}</button>${avatar(u.name)}<div><b>${esc(nm(u.name))}</b><small>${bdi(u.phone)}</small></div><button class="btn ghost sm" data-act="cust" data-id="${u.id}">${icon('user')}</button></div>
        <div class="msgs wa-bg" id="msgs">${sel.msgs.map(m => `<div class="msg ${m.me ? 'me' : ''}">${m.ai ? `<span class="aitag">${icon('robot', 'sm')} AI</span>` : ''}<p>${esc(msgText(m))}</p><small>${bdi(timeF(m.at))}</small></div>`).join('')}</div>
        <form class="mcomp" data-form="msg"><button type="button" class="ibtn" data-act="aiSuggest" title="${t('wa.suggest')}" aria-label="${t('wa.suggest')}">${icon('sparkles')}</button><input name="text" maxlength="600" autocomplete="off" placeholder="${t('wa.type')}" aria-label="${t('wa.type')}"><button class="wsend" type="submit" aria-label="${t('common.send')}">${icon('send', 'flip')}</button></form>`; })() : `<p class="empty big">${icon('whatsapp')}<br>${t('wa.select')}</p>`}</div></div>`;
  }
  function pgSettings() {
    return head(t('set.t'), t('set.s'), '') + `<div class="grid2 set"><form class="card form" data-form="profile"><h4>${t('set.profile')}</h4><label>${t('start.name')}<input name="name" maxlength="60" value="${esc(USER.name)}" required></label><label>${t('start.company')}<input name="company" maxlength="80" value="${esc(USER.company || '')}"></label><label>${t('set.ship')} (SAR)<input name="ship" type="number" min="0" value="${D.freeShip}"></label><button class="btn org" type="submit">${t('set.save')}</button></form>
      <div class="card"><h4>${t('set.appearance')}</h4><div class="seg"><button class="${PREFS.theme === 'light' ? 'on' : ''}" data-act="setTheme" data-v="light">${icon('sun')} ${t('set.light')}</button><button class="${PREFS.theme === 'dark' ? 'on' : ''}" data-act="setTheme" data-v="dark">${icon('moon')} ${t('set.dark')}</button></div>
        <h4>${t('set.lang')}</h4><div class="seg">${[['en', 'English'], ['ar', 'العربية'], ['ur', 'اردو']].map(l => `<button class="${L() === l[0] ? 'on' : ''}" data-act="lang" data-l="${l[0]}">${l[1]}</button>`).join('')}</div>
        <h4>${t('set.ai')}</h4><p class="aistat ${AI.live ? 'on' : ''}"><i></i>${AI.live ? t('set.aiLive') : t('set.aiOff')}</p><h4>${t('set.data')}</h4><p class="muted">${t('set.dataS')}</p><button class="btn danger" data-act="reset">${icon('refresh')} ${t('set.reset')}</button></div></div>`;
  }

  /* ================= ROUTER ================= */
  const PAGES = { dashboard: pgDashboard, orders: pgOrders, products: pgProducts, customers: pgCustomers, analytics: pgAnalytics, marketing: pgMarketing, ai: pgAI, discounts: pgDiscounts, reviews: pgReviews, whatsapp: pgWhatsapp, settings: pgSettings };
  function route() { const h = location.hash || '#/'; const m = h.match(/^#\/app\/?([a-z]*)/); if (m) return { app: true, page: m[1] || 'dashboard' }; return { app: false, page: /^#\/shop/.test(h) ? 'shop' : 'home' }; }
  function render() {
    const r = route(), root = $('#root'); document.title = 'TrendCart — AI E-commerce Store + CRM | Live demo';
    if (r.app && USER) { const pg = PAGES[r.page] ? r.page : 'dashboard'; root.innerHTML = shell(pg, PAGES[pg]()); document.body.className = 'in-app'; const ms = $('#msgs'); if (ms) ms.scrollTop = ms.scrollHeight; if (render._pg !== pg) window.scrollTo(0, 0); render._pg = pg; }
    else { root.innerHTML = r.page === 'shop' ? shop() : home(); document.body.className = 'in-store'; if (r.app && !USER) setTimeout(startModal, 50); if (render._pg !== r.page) window.scrollTo(0, 0); render._pg = r.page; }
    updateBadges(); renderChat();
  }
  window.addEventListener('hashchange', () => { UI.sidebar = false; UI.menus = null; closeDrawer(); render(); });
  function startModal() {
    modal(t('start.t'), `<p class="muted">${t('start.s')}</p><form class="form" data-form="start" novalidate><label>${t('start.name')} *<input name="name" required maxlength="60" autocomplete="name"></label><label>${t('start.email')} *<input name="email" type="email" required maxlength="120" autocomplete="email"></label>
      <div class="row2"><label>${t('start.company')}<input name="company" maxlength="80"></label><label>${t('start.wa')}<input name="whatsapp" type="tel" maxlength="25"></label></div><p class="err" hidden>${t('start.req')}</p>
      <button class="btn org block lg" type="submit">${t('start.go')} ${icon('arrowRight', 'flip')}</button><p class="muted sm c">${icon('shield', 'sm')} ${t('start.privacy')}</p></form>`, 'narrow');
  }

  /* ================= EVENTS ================= */
  function globalSearch(q) {
    const box = $('#sres'); if (!box) return; q = q.trim().toLowerCase().replace('#', ''); if (q.length < 2) { box.classList.remove('open'); return; }
    const os = D.orders.filter(o => o.id.toLowerCase().includes(q)).slice(0, 4), cs = D.customers.filter(c => c.name.en.toLowerCase().includes(q) || (c.name.ar || '').includes(q)).slice(0, 4), ps = D.products.filter(p => [p.name.en, p.name.ar, p.name.ur].join(' ').toLowerCase().includes(q)).slice(0, 4);
    box.innerHTML = (os.map(o => `<button data-act="order" data-id="${o.id}">${icon('box')}<span><bdi>#${o.id}</bdi></span><small>${sar(o.total)}</small></button>`).join('') + cs.map(c => `<button data-act="cust" data-id="${c.id}">${avatar(c.name, 'sm')}<span>${esc(nm(c.name))}</span><small>${t('col.customer')}</small></button>`).join('') + ps.map(p => `<button data-act="editProd" data-id="${p.id}"><img class="thumb" src="${photo(p.photo, 60)}" alt=""><span>${esc(nm(p.name))}</span><small>${sar(p.price)}</small></button>`).join('')) || `<p class="empty">${t('ord.empty')}</p>`;
    box.classList.add('open');
  }
  document.addEventListener('click', async ev => {
    const a = ev.target.closest('[data-act]');
    if (!a || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'checkbox')) { if (UI.menus && !ev.target.closest('.dd')) { UI.menus = null; $$('.dd.open').forEach(d => d.classList.remove('open')); } if (!ev.target.closest('#gsearch')) { const b = $('#sres'); if (b) b.classList.remove('open'); } return; }
    const act = a.dataset.act, id = a.dataset.id;
    if (!['menu', 'lang'].includes(act) && UI.menus) { UI.menus = null; $$('.dd.open').forEach(d => d.classList.remove('open')); }
    switch (act) {
      case 'menu': ev.preventDefault(); UI.menus = UI.menus === id ? null : id; $$('.dd').forEach(d => d.classList.toggle('open', d.contains(a) && !!UI.menus)); break;
      case 'lang': PREFS.lang = a.dataset.l; savePrefs(); I18N.set(a.dataset.l); UI.menus = null; render(); break;
      case 'theme': PREFS.theme = PREFS.theme === 'dark' ? 'light' : 'dark'; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'setTheme': PREFS.theme = a.dataset.v; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'start': ev.preventDefault(); closeModal(); $('.snav') && $('.snav').classList.remove('open'); if (USER) location.hash = '#/app/dashboard'; else startModal(); break;
      case 'scroll': { ev.preventDefault(); $('.snav').classList.remove('open'); const h = a.getAttribute('href'); if (route().page !== 'home') { location.hash = '#/'; setTimeout(() => { const el = $(h); el && el.scrollIntoView({ behavior: 'smooth' }); }, 60); } else { const el = $(h); if (el) el.scrollIntoView({ behavior: 'smooth' }); } break; }
      case 'snav': $('.snav').classList.toggle('open'); break;
      case 'closeModal': closeModal(); break;
      case 'closeDrawer': closeDrawer(); break;
      case 'nav': UI.sidebar = false; break;
      case 'sidebar': UI.sidebar = !UI.sidebar; $('.app') && $('.app').classList.toggle('sb-open', UI.sidebar); break;
      case 'logout': USER = null; try { localStorage.removeItem(UKEY); localStorage.removeItem(KEY); } catch (e) {} D = SEED.seed(); save(); location.hash = '#/'; render(); break;
      case 'reset': if (confirm(t('set.reset') + '?')) { D = SEED.seed(); save(); UI.chat = null; toast(t('set.resetDone')); render(); } break;
      case 'markRead': D.notifs.forEach(n => n.read = true); save(); render(); break;
      // store
      case 'add': addToCart(id, 1); if (a.dataset.close) closeModal(); break;
      case 'wish': { const i = CART.wish.indexOf(id); if (i >= 0) { CART.wish.splice(i, 1); toast(t('p.unwished')); } else { CART.wish.push(id); toast(t('p.wished')); } saveCart(); const m = $('#modal.open'); render(); if (m) pview(id); break; }
      case 'pview': pview(id); break;
      case 'cat': ev.preventDefault(); UI.shop.cat = a.dataset.c; UI.shop.wish = false; if (route().page !== 'shop') location.hash = '#/shop'; else render(); break;
      case 'wishView': UI.shop.wish = true; UI.shop.cat = ''; if (route().page !== 'shop') location.hash = '#/shop'; else render(); break;
      case 'clearShop': UI.shop = { cat: '', q: '', sort: 'pop', max: 0, wish: false }; render(); break;
      case 'goShop': closeDrawer(); location.hash = '#/shop'; break;
      case 'cart': closeModal(); cartDrawer(); break;
      case 'qty': { const it = CART.items.find(i => i.pid === id); it.qty += +a.dataset.d; if (it.qty <= 0) CART.items = CART.items.filter(i => i.pid !== id); else it.qty = Math.min(it.qty, prod(id).stock); saveCart(); updateBadges(); cartDrawer(); break; }
      case 'rmCart': CART.items = CART.items.filter(i => i.pid !== id); saveCart(); updateBadges(); cartDrawer(); break;
      case 'checkout': checkoutModal(); break;
      case 'trackAI': closeModal(); CHAT.open = true; chatInit(); handle('#' + id); break;
      // chat
      case 'openAI': CHAT.open = true; renderChat(); break;
      case 'closeAI': CHAT.open = false; renderChat(); break;
      case 'aiReset': Object.assign(CHAT, { items: [], mode: null, ctx: {}, hist: [] }); renderChat(); break;
      case 'chip': handle(a.dataset.txt, true); break;
      case 'tier': say('me', t('chat.' + a.dataset.k)); recommend(a.dataset.k); break;
      case 'chatAdd': { addToCart(id, 1, true); say('bot', t('chat.added', { p: nm(prod(id).name) }), { chips: 'cart' }); D.aiLog.unshift({ at: Date.now(), kind: 'cart', text: nm(prod(id).name) }); save(); renderChat(); break; }
      // crm
      case 'order': { const b = $('#sres'); if (b) b.classList.remove('open'); closeModal(); orderDrawer(id); break; }
      case 'cust': { const b = $('#sres'); if (b) b.classList.remove('open'); custDrawer(id); break; }
      case 'invoice': invoice(id); break;
      case 'print': window.print(); break;
      case 'of': UI.of.st = a.dataset.v; UI.page = 1; render(); break;
      case 'more': UI.page++; render(); break;
      case 'exportOrders': exportCSV(); break;
      case 'addProd': modal(t('prd.new'), prodForm()); break;
      case 'editProd': { const b = $('#sres'); if (b) b.classList.remove('open'); modal(t('prd.edit'), prodForm(prod(id))); break; }
      case 'delProd': if (confirm(t('prd.confirmDel'))) { D.products = D.products.filter(p => p.id !== id); save(); closeModal(); toast(t('prd.deleted')); render(); } break;
      case 'recover': {
        const ab = D.abandoned.find(x => x.id === id), c = cus(ab.cid), box = $('#rec-' + id); a.disabled = true; box.innerHTML = `<p class="muted sm"><span class="spin"></span> ${t('common.thinking')}</p>`;
        const r = await AI.recovery({ name: nm(c.name).split(' ')[0], items: ab.items.map(i => nm(prod(i.pid).name)).join(', '), value_sar: ab.items.reduce((s, i) => s + prod(i.pid).price, 0) }, L(), (USER && USER.company) || 'TrendCart');
        a.disabled = false; box.innerHTML = `<div class="draft">${r.live ? `<span class="livebadge">${t('chat.live')}</span>` : ''}<textarea rows="5" id="d-${id}" aria-label="draft">${esc(r.text)}</textarea><div class="row-btns"><button class="btn ghost sm" data-act="copy" data-id="d-${id}">${icon('copy')} ${t('common.copy')}</button><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(r.text)}">${icon('whatsapp')} ${t('common.openWa')}</a><button class="btn ghost sm" data-act="markSent" data-id="${id}">${icon('check')} ${t('mk.markSent')}</button></div></div>`; break;
      }
      case 'copy': { const v = $('#' + id).value; try { await navigator.clipboard.writeText(v); } catch (e) {} toast(t('common.copied')); break; }
      case 'markSent': { const ab = D.abandoned.find(x => x.id === id); ab.sent = true; save(); toast(t('mk.sent')); render(); break; }
      case 'camp': { const g = D.campaigns.find(x => x.id === id); g.on = !g.on; save(); render(); break; }
      case 'resolve': { const k = D.tickets.find(x => x.id === id); k.status = 'resolved'; save(); toast(t('ai.ticketDone')); render(); break; }
      case 'coupon': { const c = D.coupons.find(x => x.id === id); c.on = !c.on; save(); render(); break; }
      case 'addCoupon': modal(t('dc.add'), `<form class="form" data-form="coupon2" novalidate><div class="row2"><label>${t('col.code')} *<input name="code" required maxlength="20" style="text-transform:uppercase"></label><label>${t('col.type')}<select name="type"><option value="pct">${t('dc.pct')}</option><option value="fixed">${t('dc.fixed')}</option></select></label></div><div class="row2"><label>${t('col.value')} *<input name="value" type="number" min="1" required></label><label>${t('dc.min')}<input name="min" type="number" min="0" value="0"></label></div><div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('common.cancel')}</button><button class="btn org" type="submit">${t('common.save')}</button></div></form>`, 'narrow'); break;
      case 'approve': { D.reviews.find(x => x.id === id).approved = true; save(); render(); break; }
      case 'rvReply': {
        const r0 = D.reviews.find(x => x.id === id), box = $('#rvr-' + id); a.disabled = true; box.innerHTML = `<p class="muted sm"><span class="spin"></span> ${t('common.thinking')}</p>`;
        const r = await AI.reviewReply({ name: nm(cus(r0.cid).name).split(' ')[0], product: nm(prod(r0.pid).name), stars: r0.stars, review: nm(r0.text) }, L(), (USER && USER.company) || 'TrendCart');
        a.disabled = false; box.innerHTML = `<div class="draft">${r.live ? `<span class="livebadge">${t('chat.live')}</span>` : ''}<textarea rows="3" id="rt-${id}" aria-label="reply">${esc(r.text)}</textarea><button class="btn org sm" data-act="saveReply" data-id="${id}">${t('rv.save')}</button></div>`; break;
      }
      case 'saveReply': { const r0 = D.reviews.find(x => x.id === id); r0.reply = $('#rt-' + id).value.trim(); r0.approved = true; save(); toast(t('rv.replied')); render(); break; }
      case 'openChat': { UI.chat = id; D.chats.find(x => x.id === id).unread = 0; save(); render(); break; }
      case 'closeChat': UI.chat = null; render(); break;
      case 'aiSuggest': {
        const c = D.chats.find(x => x.id === UI.chat), u = cus(c.cid), inp = $('.mcomp input'); inp.value = '…'; a.disabled = true;
        const last = D.orders.find(o => o.cid === u.id);
        const r = await AI.suggestReply(c.msgs.slice(-6).map(m => ({ role: m.me ? 'agent' : 'customer', text: msgText(m) })), { name: u.name.en, city: u.city, last_order: last ? { id: last.id, status: last.status, items: itemsLabel(last) } : null, products_in_stock: D.products.filter(p => p.stock > 0).map(p => p.name.en).slice(0, 12) }, L(), (USER && USER.company) || 'TrendCart');
        inp.value = r.text; a.disabled = false; inp.focus(); break;
      }
    }
  });
  document.addEventListener('change', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
    if (act === 'range') { UI.range = a.value; render(); }
    else if (act === 'sort') { UI.shop.sort = a.value; render(); }
    else if (act === 'max') { UI.shop.max = +a.value; render(); }
    else if (act === 'ostatus') { const o = ord(a.dataset.id); o.status = a.value; save(); toast(t('ord.updated')); render(); orderDrawer(o.id); }
  });
  let qT;
  document.addEventListener('input', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'oq') { clearTimeout(qT); qT = setTimeout(() => { UI.of.q = a.value; UI.page = 1; const pos = a.selectionStart; render(); const n = $('[data-act="oq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }, 220); }
    if (a.dataset.act === 'gsearch') globalSearch(a.value);
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if ($('#modal.open')) closeModal(); else if ($('#drawer.open')) closeDrawer(); else if (CHAT.open) { CHAT.open = false; renderChat(); } } });
  document.addEventListener('error', ev => { const im = ev.target; if (im.tagName === 'IMG' && /unsplash/.test(im.src)) im.classList.add('broken'); }, true);
  document.addEventListener('submit', ev => {
    const f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries()), kind = f.dataset.form;
    const bad = $$('[required]', f).filter(i => !String(i.value).trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)));
    $$('.invalid', f).forEach(i => i.classList.remove('invalid')); bad.forEach(i => i.classList.add('invalid'));
    if (bad.length) { const er = $('.err', f); if (er) er.hidden = false; else toast(t('common.required'), 'err'); bad[0].focus(); return; }
    switch (kind) {
      case 'search': UI.shop.q = fd.q || ''; UI.shop.cat = ''; UI.shop.wish = false; if (route().page !== 'shop') location.hash = '#/shop'; else render(); break;
      case 'coupon': { const code = (fd.code || '').trim().toUpperCase(); const c = D.coupons.find(x => x.code === code && x.on); if (c) { CART.coupon = code; saveCart(); toast(t('cart.couponOk', { c: code })); } else { CART.coupon = null; saveCart(); toast(t('cart.couponBad'), 'err'); } cartDrawer(); break; }
      case 'checkout': placeOrder(fd); break;
      case 'start': USER = { name: fd.name.trim(), email: fd.email.trim(), company: (fd.company || '').trim(), whatsapp: (fd.whatsapp || '').trim() }; lsSet(UKEY, USER);
        sendForm({ _subject: 'New TrendCart demo visitor: ' + USER.name, name: USER.name, email: USER.email, company: USER.company, whatsapp: USER.whatsapp, language: L(), demo: 'TrendCart E-commerce + CRM' }); closeModal(); location.hash = '#/app/dashboard'; render(); break;
      case 'prod': { const idv = f.dataset.id; const data = { cat: fd.cat, price: +fd.price, old: +fd.old || 0, stock: +fd.stock || 0, badge: fd.badge };
        if (idv) { const p = prod(idv); if (nm(p.name) !== fd.name.trim()) p.name = { en: fd.name.trim(), ar: fd.name.trim(), ur: fd.name.trim() }; if (nm(p.desc) !== fd.desc.trim()) p.desc = { en: fd.desc.trim(), ar: fd.desc.trim(), ur: fd.desc.trim() }; Object.assign(p, data); }
        else { const pool = { electronics: 'p2', fashion: 'p9', home: 'p12', beauty: 'p16', sports: 'p18', accessories: 'p21' }; D.products.unshift(Object.assign({ id: uid('p'), name: { en: fd.name.trim(), ar: fd.name.trim(), ur: fd.name.trim() }, desc: { en: fd.desc.trim(), ar: fd.desc.trim(), ur: fd.desc.trim() }, photo: prod(pool[fd.cat]).photo, rating: 5, reviews: 0, created: Date.now() }, data)); }
        save(); closeModal(); toast(t('prd.saved')); render(); break; }
      case 'coupon2': D.coupons.unshift({ id: uid('k'), code: fd.code.trim().toUpperCase().replace(/\s/g, ''), type: fd.type, value: +fd.value, min: +fd.min || 0, uses: 0, on: true }); save(); closeModal(); toast(t('dc.saved')); render(); break;
      case 'msg': { const txt = (fd.text || '').trim(); if (!txt) return; D.chats.find(x => x.id === UI.chat).msgs.push({ me: 1, at: Date.now(), text: txt }); save(); render(); const i = $('.mcomp input'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); break; }
      case 'ai': { const q = f.q.value; f.q.value = ''; handle(q); break; }
      case 'profile': USER.name = fd.name.trim(); USER.company = (fd.company || '').trim(); lsSet(UKEY, USER); D.freeShip = Math.max(0, +fd.ship || 0); save(); toast(t('set.saved')); render(); break;
    }
  });
  function exportCSV() {
    const rows = [['Order', 'Customer', 'WhatsApp', 'City', 'Items', 'Subtotal', 'Discount', 'Shipping', 'Total SAR', 'Payment', 'Status', 'Date']];
    D.orders.forEach(o => { const c = cus(o.cid); rows.push([o.id, c.name.en, c.phone, o.city, o.items.map(i => i.qty + 'x ' + prod(i.pid).name.en).join('; '), o.sub, o.disc, o.ship, o.total, o.pay, o.status, new Date(o.created).toISOString().slice(0, 10)]); });
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'trendcart-orders-sample.csv'; document.body.appendChild(a); a.click(); a.remove(); toast(t('an.exported'));
  }
  render(); AI.health().then(() => { if (route().page === 'settings') render(); });
  window.__TC = { get D() { return D; }, CART, CHAT, render };
})();
