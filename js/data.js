/* TrendCart demo — sample data (all fictional) */
(function () {
  const DAY = 86400000, H = 3600000;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function pickW(r, items, w) { const tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; }
  const CATS = ['electronics', 'fashion', 'home', 'beauty', 'sports', 'accessories'];
  const CITIES = ['riyadh', 'jeddah', 'dammam', 'makkah', 'madinah', 'khobar'];
  // [id, cat, en, ar, ur, price, old, badge, photo, desc en, desc ar, desc ur, stock]
  const P = [
    ['p1', 'electronics', 'Wireless Headphones', 'سماعات لاسلكية', 'وائرلیس ہیڈ فونز', 299, 449, 'best', '1585298723682-7115561c51b7', 'Over-ear Bluetooth headphones with deep bass and up to 30 hours of battery.', 'سماعات بلوتوث فوق الأذن بصوت جهير عميق وبطارية حتى 30 ساعة.', 'گہرے باس اور 30 گھنٹے تک بیٹری والے اوور ایئر بلوٹوتھ ہیڈ فونز۔', 42],
    ['p2', 'electronics', 'Wireless Earbuds Pro', 'سماعات أذن لاسلكية برو', 'وائرلیس ایئربڈز پرو', 199, 299, 'best', '1590658268037-6bf12165a8df', 'Compact earbuds with charging case, touch controls and clear calls.', 'سماعات صغيرة مع علبة شحن وتحكم باللمس ومكالمات واضحة.', 'چارجنگ کیس، ٹچ کنٹرول اور صاف کالز والے چھوٹے ایئربڈز۔', 60],
    ['p3', 'electronics', 'Smart Watch Ultra', 'ساعة ذكية ألترا', 'اسمارٹ واچ الٹرا', 349, 499, 'new', '1660844817855-3ecc7ef21f12', 'Fitness tracking, heart-rate, notifications and 7-day battery.', 'تتبع اللياقة ونبض القلب والإشعارات وبطارية 7 أيام.', 'فٹنس ٹریکنگ، دل کی دھڑکن، نوٹیفکیشنز اور 7 دن کی بیٹری۔', 28],
    ['p4', 'electronics', 'Portable Speaker', 'سماعة محمولة', 'پورٹیبل اسپیکر', 229, 279, '', '1589256469067-ea99122bbdc4', 'Water-resistant speaker with 360° sound and colourful lights.', 'سماعة مقاومة للماء بصوت 360 درجة وإضاءة ملونة.', '360 ڈگری آواز اور رنگین لائٹس والا واٹر ریزسٹنٹ اسپیکر۔', 35],
    ['p5', 'electronics', 'Noise Cancelling Pro', 'سماعات عزل الضوضاء برو', 'نوائز کینسلنگ پرو', 399, 0, 'new', '1613040809024-b4ef7ba99bc3', 'Premium headphones with active noise cancelling and soft cushions.', 'سماعات مميزة بعزل نشط للضوضاء ووسائد ناعمة.', 'ایکٹو نوائز کینسلنگ اور نرم کشن والے پریمیم ہیڈ فونز۔', 4],
    ['p6', 'electronics', 'Mechanical Keyboard', 'لوحة مفاتيح ميكانيكية', 'میکینیکل کی بورڈ', 259, 0, '', '1618384887929-16ec33fab9ef', 'Compact wireless mechanical keyboard with quiet switches.', 'لوحة مفاتيح ميكانيكية لاسلكية صغيرة بمفاتيح هادئة.', 'خاموش سوئچز والا چھوٹا وائرلیس میکینیکل کی بورڈ۔', 22],
    ['p7', 'electronics', 'Camera Lens 50mm', 'عدسة كاميرا 50مم', 'کیمرا لینز 50mm', 899, 1099, '', '1516035069371-29a1b244cc32', 'Bright prime lens for portraits and low-light shots.', 'عدسة ثابتة ساطعة للبورتريه والتصوير بالإضاءة المنخفضة.', 'پورٹریٹ اور کم روشنی کے لیے روشن پرائم لینز۔', 9],
    ['p8', 'fashion', 'Premium Sneakers', 'حذاء رياضي مميز', 'پریمیم سنیکرز', 279, 399, 'sale', '1625860191460-10a66c7384fb', 'Clean white leather sneakers with a cushioned sole.', 'حذاء رياضي أبيض من الجلد بنعل مريح.', 'نرم سول والے سفید چمڑے کے سنیکرز۔', 50],
    ['p9', 'fashion', 'Classic Sunglasses', 'نظارة شمسية كلاسيكية', 'کلاسک دھوپ کا چشمہ', 149, 0, '', '1511499767150-a48a237f0083', 'Lightweight metal frame with UV400 protection.', 'إطار معدني خفيف مع حماية UV400.', 'UV400 حفاظت والا ہلکا میٹل فریم۔', 40],
    ['p10', 'fashion', 'Denim Jacket', 'جاكيت جينز', 'ڈینم جیکٹ', 239, 299, '', '1611312449408-fcece27cdbb7', 'Classic dark-wash denim jacket, regular fit.', 'جاكيت جينز داكن كلاسيكي بقصة عادية.', 'کلاسک ڈارک واش ڈینم جیکٹ، ریگولر فٹ۔', 18],
    ['p11', 'home', 'Modern Armchair', 'كرسي عصري', 'جدید آرم چیئر', 899, 1199, 'sale', '1580480055273-228ff5388ef8', 'Soft upholstered armchair with solid wood legs.', 'كرسي منجد ناعم بأرجل من الخشب الصلب.', 'ٹھوس لکڑی کی ٹانگوں والی نرم آرم چیئر۔', 7],
    ['p12', 'home', 'Table Lamp', 'مصباح طاولة', 'ٹیبل لیمپ', 189, 0, 'new', '1517991104123-1d56a6e81ed9', 'Warm-light tripod lamp with fabric shade.', 'مصباح بقاعدة ثلاثية وإضاءة دافئة وغطاء قماش.', 'گرم روشنی اور کپڑے کے شیڈ والا ٹرائی پوڈ لیمپ۔', 25],
    ['p13', 'home', 'Scented Candle', 'شمعة معطرة', 'خوشبودار موم بتی', 79, 99, '', '1561212856-44e9bae482aa', 'Hand-poured candle with oud and amber notes, 40-hour burn.', 'شمعة مصبوبة يدوياً بنفحات العود والعنبر، تدوم 40 ساعة.', 'عود اور عنبر کی خوشبو والی موم بتی، 40 گھنٹے۔', 80],
    ['p14', 'home', 'Ceramic Mug Set', 'طقم أكواب سيراميك', 'سرامک مگ سیٹ', 69, 0, '', '1616241673111-508b4662c707', 'Set of 4 matte ceramic mugs, dishwasher safe.', 'طقم من 4 أكواب سيراميك مطفية، آمن لغسالة الصحون.', '4 میٹ سرامک مگز کا سیٹ، ڈش واشر سیف۔', 65],
    ['p15', 'beauty', 'Luxury Perfume', 'عطر فاخر', 'لگژری پرفیوم', 189, 399, 'best', '1784183972601-17a1b00ea05e', 'Long-lasting eau de parfum with warm amber and rose.', 'عطر يدوم طويلاً بنفحات العنبر الدافئ والورد.', 'گرم عنبر اور گلاب والی دیرپا خوشبو۔', 30],
    ['p16', 'beauty', 'Skincare Set', 'طقم العناية بالبشرة', 'اسکن کیئر سیٹ', 149, 199, '', '1785581778868-79100f7fe56c', 'Cleanser, serum and moisturiser for daily care.', 'غسول وسيروم ومرطب للعناية اليومية.', 'روزانہ کیئر کے لیے کلینزر، سیرم اور موئسچرائزر۔', 3],
    ['p17', 'sports', 'Dumbbell Set', 'طقم دمبلز', 'ڈمبل سیٹ', 249, 0, '', '1638536532686-d610adfc8e5c', 'Pair of hex dumbbells for home workouts (2 × 10 kg).', 'زوج دمبلز سداسي للتمارين المنزلية (2 × 10 كجم).', 'گھریلو ورزش کے لیے ہیکس ڈمبلز کا جوڑا (2 × 10 کلو)۔', 15],
    ['p18', 'sports', 'Yoga Mat', 'سجادة يوغا', 'یوگا میٹ', 99, 129, 'new', '1763004871583-4183d64096b1', 'Non-slip 6 mm mat with carry strap.', 'سجادة 6 مم مانعة للانزلاق مع حزام حمل.', '6mm نان سلپ میٹ، اسٹریپ کے ساتھ۔', 45],
    ['p19', 'sports', 'Steel Water Bottle', 'قارورة ماء ستانلس', 'اسٹیل واٹر بوتل', 59, 0, '', '1602143407151-7111542de6e8', 'Insulated 750 ml bottle — cold for 24 hours.', 'قارورة معزولة 750 مل — تبقى باردة 24 ساعة.', '750ml انسولیٹڈ بوتل — 24 گھنٹے ٹھنڈی۔', 90],
    ['p20', 'accessories', 'Designer Handbag', 'حقيبة يد أنيقة', 'ڈیزائنر ہینڈ بیگ', 299, 399, 'sale', '1598532163257-ae3c6b2524b6', 'Woven vegan-leather handbag with chain strap.', 'حقيبة يد منسوجة من جلد نباتي بحزام سلسلة.', 'چین اسٹریپ والا بُنا ہوا ویگن لیدر ہینڈ بیگ۔', 12],
    ['p21', 'accessories', 'Leather Wallet', 'محفظة جلدية', 'لیدر والٹ', 119, 0, '', '1627123424574-724758594e93', 'Slim genuine-leather wallet with 6 card slots.', 'محفظة جلد طبيعي نحيفة بـ 6 جيوب للبطاقات.', '6 کارڈ سلاٹس والا پتلا اصلی چمڑے کا والٹ۔', 55],
    ['p22', 'accessories', 'Urban Backpack', 'حقيبة ظهر', 'اربن بیک پیک', 179, 229, '', '1553062407-98eeb64c6a62', 'Water-repellent backpack with a padded 15" laptop sleeve.', 'حقيبة ظهر مقاومة للماء مع جيب مبطن للابتوب 15 إنش.', '15 انچ لیپ ٹاپ خانے والا واٹر ریپیلنٹ بیک پیک۔', 33],
  ];
  const PK_F = [['Ali', 'علي'], ['Fatima', 'فاطمة'], ['Ahmed', 'أحمد'], ['Ayesha', 'عائشة'], ['Bilal', 'بلال'], ['Hira', 'حرا'], ['Usman', 'عثمان'], ['Sana', 'ثناء'], ['Hamza', 'حمزة'], ['Zainab', 'زينب']];
  const PK_L = [['Khan', 'خان'], ['Malik', 'ملك'], ['Raza', 'رضا'], ['Qureshi', 'قريشي'], ['Sheikh', 'شيخ'], ['Iqbal', 'إقبال'], ['Hussain', 'حسين']];
  const SA_F = [['Omar', 'عمر'], ['Sara', 'سارة'], ['Abdullah', 'عبدالله'], ['Noura', 'نورة'], ['Faisal', 'فيصل'], ['Reem', 'ريم'], ['Khalid', 'خالد'], ['Lama', 'لمى'], ['Turki', 'تركي'], ['Joud', 'جود'], ['Yousef', 'يوسف'], ['Dana', 'دانة']];
  const SA_L = [['Al-Harbi', 'الحربي'], ['Al-Qahtani', 'القحطاني'], ['Al-Otaibi', 'العتيبي'], ['Al-Ghamdi', 'الغامدي'], ['Al-Zahrani', 'الزهراني'], ['Al-Dosari', 'الدوسري'], ['Al-Shehri', 'الشهري'], ['Hassan', 'حسن']];

  function seed() {
    const r = rng(20261121), now = Date.now();
    const products = P.map(p => ({ id: p[0], cat: p[1], name: { en: p[2], ar: p[3], ur: p[4] }, price: p[5], old: p[6], badge: p[7], photo: p[8], desc: { en: p[9], ar: p[10], ur: p[11] }, stock: p[12], rating: Math.round((4 + r() * 0.9) * 10) / 10, reviews: 6 + Math.floor(r() * 60), created: now - Math.floor(r() * 200) * DAY }));
    const customers = []; const used = new Set();
    for (let i = 0; i < 64; i++) {
      const pk = r() < 0.4; let f, l, k, n = 0;
      do { f = pick(r, pk ? PK_F : SA_F); l = pick(r, pk ? PK_L : SA_L); k = f[0] + l[0]; n++; } while (used.has(k) && n < 20); used.add(k);
      customers.push({ id: 'c' + (i + 1), name: { en: f[0] + ' ' + l[0], ar: f[1] + ' ' + l[1] }, phone: '+966 5' + Math.floor(r() * 9) + ' 000 ' + String(1000 + Math.floor(r() * 8999)), email: (f[0] + '.' + l[0].replace('Al-', '')).toLowerCase() + '@example.com', city: pickW(r, CITIES, [32, 30, 12, 10, 8, 8]), since: now - Math.floor(r() * 300) * DAY });
    }
    const yStart = new Date(new Date().getFullYear(), 0, 1).getTime(), span = now - yStart;
    const orders = []; const N = 124;
    for (let i = 0; i < N; i++) {
      const age = Math.floor(Math.pow(r(), 1.5) * span); const c = pick(r, customers);
      const nItems = pickW(r, [1, 2, 3], [60, 30, 10]); const items = [];
      for (let j = 0; j < nItems; j++) { const p = pickW(r, products, products.map(x => x.badge === 'best' ? 5 : x.price > 800 ? 0.6 : 2)); if (!items.some(x => x.pid === p.id)) items.push({ pid: p.id, qty: r() < 0.85 ? 1 : 2, price: p.price }); }
      const sub = items.reduce((a, x) => a + x.qty * x.price, 0); const ship = sub >= 200 ? 0 : 25;
      const ageD = age / DAY;
      const status = ageD < 1 ? pickW(r, ['pending', 'paid', 'processing'], [30, 40, 30]) : ageD < 4 ? pickW(r, ['paid', 'processing', 'shipped'], [25, 35, 40]) : ageD < 10 ? pickW(r, ['shipped', 'delivered', 'cancelled'], [30, 65, 5]) : pickW(r, ['delivered', 'cancelled', 'returned'], [88, 6, 6]);
      orders.push({ id: '', cid: c.id, items, sub, ship, disc: 0, total: sub + ship, status, pay: pickW(r, ['cod', 'card', 'applepay'], [55, 30, 15]), city: c.city, addr: '', created: now - age - Math.floor(r() * 12) * H });
    }
    orders.sort((a, b) => a.created - b.created); orders.forEach((o, i) => o.id = 'TC-' + String(i + 1).padStart(5, '0')); orders.reverse();
    // make the 4 newest look like the screenshot flow
    const st4 = ['paid', 'paid', 'processing', 'shipped']; orders.slice(0, 4).forEach((o, i) => { o.status = st4[i]; o.created = now - (i * 25 + 2) * 60000; });
    orders.forEach(o => { products.forEach(p => {}); });
    const reviewsTxt = [
      { en: 'Great quality and fast delivery to Riyadh. Recommended!', ar: 'جودة ممتازة وتوصيل سريع للرياض. أنصح به!', ur: 'بہترین کوالٹی اور ریاض میں تیز ڈیلیوری۔ ضرور لیں!' },
      { en: 'Exactly as in the pictures. Packaging was neat.', ar: 'تماماً كما في الصور. التغليف كان مرتباً.', ur: 'بالکل تصویروں جیسا۔ پیکنگ صاف ستھری تھی۔' },
      { en: 'Good value for the price, but delivery took 3 days.', ar: 'قيمة جيدة مقابل السعر، لكن التوصيل استغرق 3 أيام.', ur: 'قیمت کے حساب سے اچھا، لیکن ڈیلیوری میں 3 دن لگے۔' },
      { en: 'The AI chat helped me choose the right size. Nice!', ar: 'المحادثة الذكية ساعدتني في اختيار المقاس المناسب. رائع!', ur: 'AI چیٹ نے صحیح سائز چننے میں مدد کی۔ زبردست!' },
      { en: 'Battery life is even better than expected.', ar: 'عمر البطارية أفضل من المتوقع.', ur: 'بیٹری توقع سے بھی بہتر ہے۔' },
      { en: 'Colour is slightly different from the photo.', ar: 'اللون مختلف قليلاً عن الصورة.', ur: 'رنگ تصویر سے تھوڑا مختلف ہے۔' },
    ];
    const reviews = [];
    for (let i = 0; i < 18; i++) { const o = orders[5 + i * 3]; const it = o.items[0]; const t = reviewsTxt[i % reviewsTxt.length]; reviews.push({ id: 'rv' + (i + 1), pid: it.pid, cid: o.cid, stars: i % 6 === 5 ? 3 : i % 6 === 2 ? 4 : 5, text: t, approved: i > 3, reply: '', at: o.created + 4 * DAY }); }
    const coupons = [
      { id: 'k1', code: 'WELCOME10', type: 'pct', value: 10, min: 0, uses: 37, on: true },
      { id: 'k2', code: 'SAVE50', type: 'fixed', value: 50, min: 300, uses: 12, on: true },
      { id: 'k3', code: 'FREESHIP', type: 'fixed', value: 25, min: 100, uses: 21, on: true },
      { id: 'k4', code: 'EID20', type: 'pct', value: 20, min: 200, uses: 64, on: false },
    ];
    const campaigns = [
      { id: 'g1', name: 'Headphones — Retargeting', platform: 'Meta', spend: 2400, revenue: 9600, on: true },
      { id: 'g2', name: 'New Arrivals — Stories', platform: 'Snapchat', spend: 1800, revenue: 5200, on: true },
      { id: 'g3', name: 'Gift Ideas under SAR 200', platform: 'TikTok', spend: 1500, revenue: 4100, on: true },
      { id: 'g4', name: 'Search — Smart Watch', platform: 'Google', spend: 1200, revenue: 4700, on: false },
    ];
    const abandoned = [];
    [['p1', 'p9'], ['p3'], ['p11'], ['p15', 'p13'], ['p8'], ['p20', 'p21']].forEach((ps, i) => { const c = customers[10 + i * 5]; abandoned.push({ id: 'ab' + (i + 1), cid: c.id, items: ps.map(pid => ({ pid, qty: 1 })), at: now - (i * 7 + 3) * H, sent: i === 4, recovered: i === 5 }); });
    const tickets = [
      { id: 'RT-0031', type: 'return', oid: orders[8].id, cid: orders[8].cid, reason: { en: 'Wrong size', ar: 'المقاس غير مناسب', ur: 'سائز غلط ہے' }, status: 'open', at: now - 5 * H },
      { id: 'RT-0030', type: 'complaint', oid: orders[14].id, cid: orders[14].cid, reason: { en: 'Delivery was late', ar: 'تأخر التوصيل', ur: 'ڈیلیوری لیٹ ہوئی' }, status: 'open', at: now - 26 * H },
      { id: 'RT-0029', type: 'return', oid: orders[30].id, cid: orders[30].cid, reason: { en: 'Changed my mind', ar: 'غيرت رأيي', ur: 'ارادہ بدل گیا' }, status: 'resolved', at: now - 4 * DAY },
    ];
    const C = i => customers[i];
    const chats = [
      { id: 'w1', cid: orders[0].cid, unread: 2, msgs: [
        { me: 0, at: now - 50 * 60000, t: { en: "Hi! I'm looking for wireless headphones.", ar: 'مرحباً! أبحث عن سماعات لاسلكية.', ur: 'ہیلو! مجھے وائرلیس ہیڈ فونز چاہئیں۔' } },
        { me: 1, ai: 1, at: now - 49 * 60000, t: { en: 'Great choice! 🎧 We have several options. Do you prefer budget, mid-range or premium?', ar: 'اختيار رائع! 🎧 لدينا عدة خيارات. هل تفضل الاقتصادي أم المتوسط أم المميز؟', ur: 'بہترین انتخاب! 🎧 کئی آپشنز ہیں۔ بجٹ، درمیانہ یا پریمیم؟' } },
        { me: 0, at: now - 48 * 60000, t: { en: 'Show me premium options', ar: 'أرني الخيارات المميزة', ur: 'پریمیم آپشنز دکھائیں' } },
        { me: 0, at: now - 40 * 60000, t: { en: 'Is the Noise Cancelling Pro in stock? Can it arrive by Thursday?', ar: 'هل سماعات عزل الضوضاء برو متوفرة؟ هل تصل يوم الخميس؟', ur: 'کیا نوائز کینسلنگ پرو دستیاب ہے؟ جمعرات تک پہنچ جائے گا؟' } },
      ] },
      { id: 'w2', cid: orders[3].cid, unread: 1, msgs: [
        { me: 0, at: now - 6 * H, t: { en: 'Where is my order ' + '#' + orders[3].id + '?', ar: 'أين طلبي #' + orders[3].id + '؟', ur: 'میرا آرڈر #' + orders[3].id + ' کہاں ہے؟' } },
        { me: 1, ai: 1, at: now - 6 * H + 60000, t: { en: 'Your order has been shipped 🚚 and should arrive in 1–2 days.', ar: 'تم شحن طلبك 🚚 ويصل خلال 1–2 يوم.', ur: 'آپ کا آرڈر روانہ ہو گیا ہے 🚚، 1–2 دن میں پہنچ جائے گا۔' } },
        { me: 0, at: now - 5 * H, t: { en: 'Thanks! Can I pay cash on delivery?', ar: 'شكراً! هل أستطيع الدفع عند الاستلام؟', ur: 'شکریہ! کیا میں کیش آن ڈیلیوری دے سکتا ہوں؟' } },
      ] },
      { id: 'w3', cid: tickets[0].cid, unread: 0, msgs: [
        { me: 0, at: now - 5 * H, t: { en: 'The sneakers are too small, I want to return them.', ar: 'الحذاء صغير، أريد إرجاعه.', ur: 'سنیکرز چھوٹے ہیں، واپس کرنے ہیں۔' } },
        { me: 1, ai: 1, at: now - 5 * H + 60000, t: { en: 'Sorry about that! I opened return request RT-0031. Our team will contact you within 24 hours.', ar: 'نأسف لذلك! فتحت طلب الإرجاع RT-0031. سيتواصل فريقنا خلال 24 ساعة.', ur: 'معذرت! میں نے واپسی کی درخواست RT-0031 کھول دی ہے۔ ٹیم 24 گھنٹوں میں رابطہ کرے گی۔' } },
      ] },
      { id: 'w4', cid: C(20).id, unread: 0, msgs: [
        { me: 1, at: now - 30 * H, t: { en: 'Hi! You left the Smart Watch Ultra in your cart ⌚ Use code WELCOME10 for 10% off today.', ar: 'مرحباً! تركت الساعة الذكية ألترا في سلتك ⌚ استخدم الكود WELCOME10 لخصم 10% اليوم.', ur: 'ہیلو! آپ نے اسمارٹ واچ الٹرا کارٹ میں چھوڑ دی ⌚ آج کوڈ WELCOME10 سے 10% رعایت لیں۔' } },
        { me: 0, at: now - 29 * H, t: { en: 'Oh nice, ordering now!', ar: 'رائع، سأطلب الآن!', ur: 'زبردست، ابھی آرڈر کرتا ہوں!' } },
      ] },
    ];
    const lowP = products.find(p => p.stock <= 5);
    const notifs = [
      { id: 'n1', k: 'notif.n1', v: { id: '#' + orders[0].id, name: customers.find(c => c.id === orders[0].cid).name }, at: now - 3 * 60000, read: false },
      { id: 'n2', k: 'notif.n2', v: { p: lowP.name }, at: now - 3 * H, read: false },
      { id: 'n3', k: 'notif.n3', v: { tk: 'RT-0031' }, at: now - 5 * H, read: false },
      { id: 'n4', k: 'notif.n4', v: {}, at: now - 26 * H, read: true },
    ];
    return { v: 1, seededAt: now, products, customers, orders, reviews, coupons, campaigns, abandoned, tickets, chats, notifs, aiLog: [], nextTk: 32, freeShip: 200 };
  }
  window.SEED = { seed, CATS, CITIES, PHOTO: id => `https://images.unsplash.com/photo-${id}` };
})();
