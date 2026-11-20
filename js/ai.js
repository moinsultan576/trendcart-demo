/* TrendCart AI — /api/chat (Gemini → Groq) with rule-based fallback in EN/AR/UR */
(function () {
  const AI = { live: null };
  async function post(body) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 22000);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!r.ok) throw new Error('http'); const j = await r.json(); if (!j || j.fallback || !j.data) throw new Error('fallback');
      AI.live = true; return j.data;
    } finally { clearTimeout(to); }
  }
  AI.health = async () => { try { const j = await (await fetch('/api/health')).json(); AI.live = !!j.ai; } catch (e) { AI.live = false; } return AI.live; };
  const toLatin = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  const KW = [
    [['p1', 'p5', 'p2'], /head ?phones?|headset|سماع|ہیڈ ?فون/i], [['p2'], /ear ?buds?|airpods|ایئر ?بڈ/i], [['p3'], /smart ?watch|watch|ساعة|واچ|گھڑی/i],
    [['p4'], /speaker|سماعة محمولة|اسپیکر/i], [['p6'], /keyboard|كيبورد|لوحة مفاتيح|کی ?بورڈ/i], [['p7'], /camera|lens|عدسة|كاميرا|کیمرا|لینز/i],
    [['p8'], /sneaker|shoe|حذاء|جوتے|سنیکر/i], [['p9'], /sunglass|نظارة|چشمہ/i], [['p10'], /jacket|جاكيت|جیکٹ/i], [['p11'], /chair|armchair|كرسي|کرسی|چیئر/i],
    [['p12'], /lamp|light|مصباح|لیمپ/i], [['p13'], /candle|شمعة|موم ?بتی/i], [['p14'], /mug|cup|كوب|أكواب|مگ/i], [['p15'], /perfume|fragrance|oud|عطر|پرفیوم|خوشبو/i],
    [['p16'], /skin ?care|cream|عناية|بشرة|اسکن/i], [['p17'], /dumbbell|weights|gym|دمبل|ڈمبل/i], [['p18'], /yoga|mat|يوغا|یوگا/i], [['p19'], /bottle|قارورة|بوتل/i],
    [['p20'], /hand ?bag|purse|حقيبة يد|ہینڈ ?بیگ/i], [['p21'], /wallet|محفظة|والٹ|بٹوہ/i], [['p22'], /backpack|bag|حقيبة ظهر|بیک ?پیک|بستہ/i],
  ];
  const CATRX = [['electronics', /electronic|gadget|إلكترون|الیکٹرانک/i], ['fashion', /fashion|clothes|أزياء|ملابس|فیشن|کپڑے/i], ['home', /home|decor|منزل|بيت|گھر/i], ['beauty', /beauty|makeup|جمال|بیوٹی/i], ['sports', /sport|fitness|رياض|لياقة|اسپورٹس|فٹنس/i], ['accessories', /accessor|إكسسوار|ایکسیسر/i]];
  AI.parse = function (text) {
    const s = toLatin(text), o = {};
    const id = s.match(/(?:tc)?[-\s#]*0*(\d{2,5})\b/i); const hasTc = /tc-?\d|#\d/i.test(s);
    if (hasTc && id) o.orderId = 'TC-' + id[1].padStart(5, '0');
    if (/track|where|status|order|delivery|shipped|طلب|تتبع|أين|شحن|آرڈر|ٹریک|کہاں/i.test(s)) o.track = true;
    if (/return|refund|exchange|wrong|broken|damag|إرجاع|استرجاع|استبدال|خطأ|تالف|واپس|ریفنڈ|ٹوٹ|غلط/i.test(s)) o.ret = 'return';
    if (/complain|late|bad service|rude|missing|شكوى|متأخر|تأخر|ناقص|شکایت|لیٹ/i.test(s)) o.ret = o.ret || 'complaint';
    const pids = new Set(); for (const [ids, rx] of KW) if (rx.test(s)) ids.forEach(i => pids.add(i)); if (pids.size) o.pids = [...pids];
    for (const [c, rx] of CATRX) if (rx.test(s)) { o.cat = c; break; }
    if (/gift|هدية|تحفہ|گفٹ/i.test(s)) o.gift = true;
    const b = s.replace(/,/g, '').match(/(?:under|below|less than|max|up to|budget|أقل من|تحت|حتى|ميزانية|سے کم|تک|بجٹ)\D{0,8}(\d{2,5})/i) || s.replace(/,/g, '').match(/(\d{2,5})\s*(?:sar|riyal|ريال|ریال)/i); if (b) o.budget = +b[1];
    if (/budget|cheap|اقتصادي|رخيص|بجٹ|سستا/i.test(s) && !o.budget) o.tier = 'budget';
    if (/mid|متوسط|درمیان/i.test(s)) o.tier = 'mid';
    if (/premium|best|luxury|مميز|فاخر|پریمیم|بہترین/i.test(s)) o.tier = 'premium';
    return o;
  };
  AI.recommend = function (products, o) {
    let list = products.filter(p => p.stock > 0);
    if (o.pids) list = list.filter(p => o.pids.includes(p.id)); else if (o.cat) list = list.filter(p => p.cat === o.cat);
    if (o.budget) list = list.filter(p => p.price <= o.budget);
    if (o.tier && list.length > 1) { list.sort((a, b) => a.price - b.price); if (o.tier === 'budget') list = list.slice(0, 2); else if (o.tier === 'premium') list = list.slice(-2).reverse(); else list = list.slice(Math.floor(list.length / 3), Math.floor(list.length / 3) + 2); }
    else list.sort((a, b) => (b.badge === 'best') - (a.badge === 'best') || b.rating - a.rating);
    return list.slice(0, 3);
  };

  AI.chatFree = async function (history, products, cart, lang) {
    try {
      const d = await post({ mode: 'assistant', lang, messages: history.slice(-10), products: products.map(p => ({ id: p.id, name: p.name.en, category: p.cat, price_sar: p.price, was_sar: p.old || null, stock: p.stock, rating: p.rating })), cart: cart.map(c => c.pid) });
      return { reply: d.reply, products: (d.products || []).filter(id => products.some(p => p.id === id)).slice(0, 3), add: d.add_to_cart && products.some(p => p.id === d.add_to_cart) ? d.add_to_cart : null, live: true };
    } catch (e) { return null; }
  };

  function brief(o) { return o; }
  AI.recovery = async function (info, lang, store) {
    try { const d = await post({ mode: 'recovery', lang, store, info }); if (!d.message) throw 0; return { text: String(d.message), live: true }; }
    catch (e) {
      const T = {
        en: `Hi ${info.name} 👋 You left ${info.items} in your TrendCart cart. They are still available — use code WELCOME10 for 10% off today. Shall I reserve them for you?`,
        ar: `مرحباً ${info.name} 👋 تركت ${info.items} في سلتك على TrendCart. ما زالت متوفرة — استخدم الكود WELCOME10 لخصم 10% اليوم. هل أحجزها لك؟`,
        ur: `السلام علیکم ${info.name} 👋 آپ نے TrendCart کارٹ میں ${info.items} چھوڑ دیا۔ یہ ابھی دستیاب ہے — آج کوڈ WELCOME10 سے 10% رعایت لیں۔ کیا میں آپ کے لیے ریزرو کر دوں؟`,
      };
      return { text: T[lang] || T.en, live: false };
    }
  };
  AI.suggestReply = async function (msgs, info, lang, store) {
    try { const d = await post({ mode: 'reply', lang, store, info, messages: msgs }); if (!d.message) throw 0; return { text: String(d.message), live: true }; }
    catch (e) {
      const T = { en: 'Yes, it is in stock ✅ If you order today before 6 PM it should arrive by Thursday in Riyadh and Jeddah. Cash on delivery is available. Shall I place the order for you?', ar: 'نعم، متوفر ✅ إذا طلبت اليوم قبل 6 مساءً يصل يوم الخميس في الرياض وجدة. الدفع عند الاستلام متاح. هل أطلبه لك؟', ur: 'جی ہاں، دستیاب ہے ✅ آج شام 6 بجے سے پہلے آرڈر کریں تو ریاض اور جدہ میں جمعرات تک پہنچ جائے گا۔ کیش آن ڈیلیوری دستیاب ہے۔ کیا آرڈر کر دوں؟' };
      return { text: T[lang] || T.en, live: false };
    }
  };
  AI.reviewReply = async function (info, lang, store) {
    try { const d = await post({ mode: 'review', lang, store, info }); if (!d.message) throw 0; return { text: String(d.message), live: true }; }
    catch (e) {
      const good = info.stars >= 4;
      const T = { en: good ? `Thank you ${info.name} for your kind review! We're happy you love your ${info.product}. See you again soon 🧡` : `Thank you ${info.name} for your feedback. We're sorry about this — our team will contact you on WhatsApp to make it right.`, ar: good ? `شكراً ${info.name} على تقييمك الجميل! سعداء بإعجابك بـ${info.product}. نراك قريباً 🧡` : `شكراً ${info.name} على ملاحظتك. نعتذر عن ذلك — سيتواصل فريقنا معك عبر واتساب لحل المشكلة.`, ur: good ? `شکریہ ${info.name} آپ کے اچھے ریویو کا! خوشی ہے کہ آپ کو ${info.product} پسند آیا۔ پھر ملیں گے 🧡` : `شکریہ ${info.name} آپ کی رائے کا۔ ہمیں افسوس ہے — ہماری ٹیم واٹس ایپ پر رابطہ کر کے مسئلہ حل کرے گی۔` };
      return { text: T[lang] || T.en, live: false };
    }
  };
  window.AI = AI;
})();
