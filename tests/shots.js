// Portfolio screenshots: node tests/shots.js  (needs tests/photos cache + local server on 4175)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const B = 'http://localhost:4175/', OUT = '/tmp/tcshots'; fs.mkdirSync(OUT, { recursive: true });
const photoDir = path.join(__dirname, 'photos');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const shot = async (name, w, h, lang, hash, setup, opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.route('https://images.unsplash.com/**', r => { const id = r.request().url().match(/photo-([\w-]+?)\?/)[1]; const f = path.join(photoDir, id + '.jpg'); fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'image/jpeg' }) : r.abort(); });
    await p.route('https://formsubmit.co/**', r => r.fulfill({ status: 200, body: '{}', contentType: 'application/json' }));
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto(B); await p.evaluate(([l, u]) => { localStorage.clear(); localStorage.setItem('trendcart_prefs', JSON.stringify({ lang: l })); if (u) localStorage.setItem('trendcart_user', JSON.stringify({ name: 'Demo Visitor', email: 'demo@example.com', company: 'TrendCart' })); }, [lang, !opts.nouser]);
    await p.goto(B + hash); await p.reload(); await p.waitForTimeout(700);
    if (setup) await setup(p); await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close();
  };
  const W = 1440, H = 900;
  await shot('01-cover-storefront-en', W, 810, 'en', '');
  await shot('02-ai-assistant-recommend-en', W, H, 'en', '#/shop', async p => { await p.click('.aifab'); await p.click('.wchips button >> nth=0'); await p.click('.wchips.tier button[data-k=premium]'); });
  await shot('03-ai-order-tracking-en', W, H, 'en', '#/shop', async p => { await p.click('.aifab'); await p.fill('.wcomp input', 'Where is my order #TC-00121?'); await p.press('.wcomp input', 'Enter'); });
  await shot('04-cart-coupon-checkout-en', W, H, 'en', '#/shop', async p => { for (const i of [0, 2]) await p.click(`.pcard [data-act=add] >> nth=${i}`); await p.click('.sacts [data-act=cart]'); await p.fill('.coupon input', 'WELCOME10'); await p.click('.coupon button'); });
  await shot('05-crm-dashboard-en', W, H, 'en', '#/app/dashboard');
  await shot('06-abandoned-cart-ai-whatsapp-en', W, H, 'en', '#/app/marketing', async p => { await p.click('[data-act=recover] >> nth=0'); await p.waitForSelector('.draft textarea', { timeout: 30000 }); });
  await shot('07-crm-dashboard-arabic-rtl', W, H, 'ar', '#/app/dashboard');
  for (const l of ['en', 'ar', 'ur']) await shot('m-' + l, 390, 844, l, '', null);
  await shot('09-orders-en', W, H, 'en', '#/app/orders');
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
