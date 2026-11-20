// Smoke tests: node tests/smoke.js [baseUrl]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4175/';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://formsubmit.co/**', r => r.fulfill({ status: 200, body: '{"success":"true"}', contentType: 'application/json' }));
  await p.route('https://images.unsplash.com/**', r => r.abort());
  p.on('dialog', d => d.accept());
  await p.goto(BASE); await p.evaluate(() => localStorage.clear()); await p.reload();
  for (const l of ['en', 'ar', 'ur']) { await p.evaluate(l => localStorage.setItem('trendcart_prefs', JSON.stringify({ lang: l })), l); await p.reload(); ok(await p.locator('html').getAttribute('dir') === (l === 'en' ? 'ltr' : 'rtl') && await p.locator('.hero h1').isVisible() && await p.locator('.pcard').count() >= 10, 'storefront renders in ' + l); }
  await p.evaluate(() => localStorage.setItem('trendcart_prefs', JSON.stringify({ lang: 'en' }))); await p.reload();
  // cart + coupon + checkout
  await p.click('#best .pcard [data-act=add] >> nth=0'); await p.click('#best .pcard [data-act=add] >> nth=1');
  ok(await p.locator('.cartN').first().textContent() === '2', 'add to cart badge');
  await p.click('.sacts [data-act=cart]'); ok(await p.locator('.cline').count() === 2, 'cart drawer');
  await p.fill('.coupon input', 'nope'); await p.click('.coupon button'); ok(await p.evaluate(() => !window.__TC.CART.coupon), 'bad coupon rejected');
  await p.fill('.coupon input', 'welcome10'); await p.click('.coupon button'); ok(await p.locator('.tot .dsc').count() === 1, 'WELCOME10 applied');
  await p.click('[data-act=checkout]'); await p.click('[data-form=checkout] button[type=submit]'); ok(await p.locator('[data-form=checkout] .invalid').count() > 0, 'checkout validates');
  await p.fill('[name=name]', 'Test Buyer'); await p.fill('[name=phone]', '0551234999'); await p.selectOption('[name=city]', 'jeddah'); await p.fill('[name=addr]', 'Al Rawdah St 5');
  let sent = p.waitForRequest(r => r.url().includes('formsubmit.co')); await p.click('[data-form=checkout] button[type=submit]');
  ok((await sent).postDataJSON().city === 'jeddah', 'order email sent');
  ok(await p.evaluate(() => { const o = window.__TC.D.orders[0]; return o.id === 'TC-00125' && o.status === 'pending' && o.disc > 0 && window.__TC.CART.items.length === 0; }), 'order TC-00125 created, cart cleared');
  // track from success modal via AI
  await p.click('[data-act=trackAI]'); ok(await p.locator('.wpanel .wtrack').count() === 1, 'AI tracks new order');
  // chat: recommend → add to cart
  await p.click('.wpanel [data-act=aiReset]'); await p.click('.wchips button >> nth=0'); await p.click('.wchips.tier button[data-k=premium]');
  ok(await p.locator('.wpanel .wp').count() > 0, 'AI recommends products');
  await p.click('.wpanel .wp .add >> nth=0'); ok(await p.locator('.cartN').first().textContent() === '1', 'AI add to cart');
  await p.fill('.wcomp input', 'where is my order #TC-00123'); await p.press('.wcomp input', 'Enter'); ok((await p.locator('.wpanel .wtrack').count()) === 1, 'order tracking by id');
  await p.fill('.wcomp input', 'I want to return order TC-00120, it is damaged'); await p.press('.wcomp input', 'Enter');
  ok(await p.evaluate(() => window.__TC.D.tickets[0].oid === 'TC-00120' && window.__TC.D.tickets[0].id === 'RT-0032'), 'return ticket created');
  await p.fill('.wcomp input', 'مرحبا أبحث عن ساعة'); await p.press('.wcomp input', 'Enter'); await p.waitForTimeout(300);
  ok(await p.locator('.wpanel .wchips.tier').count() + await p.locator('.wpanel .wp').count() > 0, 'Arabic product query understood');
  await p.click('[data-act=closeAI]');
  // shop
  await p.goto(BASE + '#/shop'); await p.click('.chipsrow button[data-c=beauty]'); ok(await p.evaluate(() => [...document.querySelectorAll('.pcard')].length > 0), 'shop category filter');
  await p.click('.pcard [data-act=pview] >> nth=0'); ok(await p.locator('.pv').isVisible(), 'product modal'); await p.keyboard.press('Escape');
  // CRM gate
  await p.click('.snav [data-act=start], .sacts [data-act=start] >> nth=0').catch(() => {}); await p.goto(BASE + '#/app/dashboard'); await p.waitForSelector('[data-form=start]');
  sent = p.waitForRequest(r => r.url().includes('formsubmit.co'));
  await p.fill('[data-form=start] [name=name]', 'Demo Visitor'); await p.fill('[data-form=start] [name=email]', 'v@example.com'); await p.click('[data-form=start] button[type=submit]');
  ok((await sent).postDataJSON().email === 'v@example.com' && await p.locator('.kpi').count() === 4, 'start gate → dashboard');
  ok(await p.locator('.chart').count() > 0 && await p.locator('.tplist li').count() > 0 && await p.locator('.rlist li').count() === 5, 'dashboard chart, top products, recent orders');
  for (const pg of ['orders', 'products', 'customers', 'analytics', 'marketing', 'ai', 'discounts', 'reviews', 'whatsapp', 'settings']) { await p.goto(BASE + '#/app/' + pg); ok(await p.locator('.phead h1').isVisible(), 'page ' + pg); }
  await p.goto(BASE + '#/app/orders'); await p.click('.tbl tbody tr >> nth=0'); await p.selectOption('[data-act=ostatus]', 'shipped');
  ok(await p.evaluate(() => window.__TC.D.orders[0].status === 'shipped'), 'order status change'); await p.click('[data-act=invoice]'); ok(await p.locator('.inv').isVisible(), 'invoice'); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  const dl = p.waitForEvent('download'); await p.click('[data-act=exportOrders]'); ok(!!(await dl), 'CSV export');
  await p.goto(BASE + '#/app/products'); await p.click('[data-act=addProd]'); await p.fill('[data-form=prod] [name=name]', 'Test Lamp'); await p.click('[data-form=prod] button[type=submit]'); ok(await p.evaluate(() => window.__TC.D.products[0].name.en === 'Test Lamp'), 'add product');
  await p.goto(BASE + '#/app/marketing'); await p.click('[data-act=recover] >> nth=0'); await p.waitForSelector('.draft textarea', { timeout: 30000 }); ok((await p.inputValue('.draft textarea')).length > 20, 'abandoned cart WhatsApp draft');
  await p.goto(BASE + '#/app/reviews'); await p.click('[data-act=rvReply] >> nth=0'); await p.waitForSelector('.draft textarea', { timeout: 30000 }); await p.click('[data-act=saveReply]'); ok(await p.locator('.rvr').count() > 0, 'review reply saved');
  await p.goto(BASE + '#/app/discounts'); await p.click('[data-act=addCoupon]'); await p.fill('[name=code]', 'test5'); await p.fill('[name=value]', '5'); await p.click('[data-form=coupon2] button[type=submit]'); ok(await p.evaluate(() => window.__TC.D.coupons[0].code === 'TEST5'), 'add coupon');
  await p.goto(BASE + '#/app/ai'); await p.click('[data-act=resolve] >> nth=0'); ok(await p.evaluate(() => window.__TC.D.tickets[0].status === 'resolved'), 'resolve ticket');
  await p.goto(BASE + '#/app/whatsapp'); await p.click('.ichat >> nth=0'); await p.click('[data-act=aiSuggest]'); await p.waitForFunction(() => document.querySelector('.mcomp input').value.length > 10, null, { timeout: 30000 }); await p.press('.mcomp input', 'Enter'); ok(await p.locator('.msg.me').count() > 0, 'WhatsApp AI suggest + send');
  await p.fill('.top .search input', 'TC-001'); ok(await p.locator('#sres.open button').count() > 0, 'global search');
  await p.click('[data-act=theme]'); ok(await p.locator('html').getAttribute('data-theme') === 'dark', 'theme toggle'); await p.click('[data-act=theme]');
  await p.click('[data-act=menu][data-id=user]'); await p.click('.ddm [data-act=logout]'); ok(await p.locator('.hero').isVisible(), 'logout');
  for (const w of [360, 390, 768]) for (const l of ['en', 'ar', 'ur']) {
    const m = await b.newContext({ viewport: { width: w, height: 800 } }); const q = await m.newPage(); await q.route('https://images.unsplash.com/**', r => r.abort()); q.on('pageerror', e => errs.push(e.message));
    await q.goto(BASE); await q.evaluate(l => { localStorage.setItem('trendcart_prefs', JSON.stringify({ lang: l })); localStorage.setItem('trendcart_user', JSON.stringify({ name: 'A Very Long Visitor Name', email: 'a@b.co' })); }, l);
    const bad = [];
    for (const h of ['', '#/shop', '#/app/dashboard', '#/app/orders', '#/app/products', '#/app/customers', '#/app/analytics', '#/app/marketing', '#/app/ai', '#/app/discounts', '#/app/reviews', '#/app/whatsapp', '#/app/settings']) {
      await q.goto(BASE + h); await q.reload(); await q.waitForTimeout(120); const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) bad.push(h + ':' + o);
    }
    await q.goto(BASE); await q.reload(); await q.click('.aifab'); await q.click('.wchips button >> nth=0'); await q.click('.wchips.tier button >> nth=1');
    const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) bad.push('chat:' + o);
    ok(!bad.length, `no overflow ${w}px ${l} ${bad.join(' ')}`); await m.close();
  }
  ok(!errs.length, 'no JS errors ' + errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
