// TrendCart demo — AI endpoint (Gemini first, Groq fallback). Keys come only from Vercel env vars.
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const LANG = { en: 'English', ar: 'Arabic (Saudi-friendly Modern Standard Arabic)', ur: 'Urdu (Urdu script)' };

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 40;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }

function buildPrompt(body) {
  const lang = LANG[body.lang] ? body.lang : 'en';
  const L = LANG[lang];
  const mode = body.mode;
  const store = clip(body.store || 'TrendCart', 60);
  const info = clip(JSON.stringify(body.info || {}), 1500);
  if (mode === 'assistant') {
    const prods = Array.isArray(body.products) ? body.products.slice(0, 40) : [];
    const sys = `You are the AI shopping assistant of "TrendCart", a sample online store in Saudi Arabia (live demo with sample products; prices in SAR; cash on delivery; free shipping over SAR 200; 7-day returns).
Reply in the same language the customer writes in (English, Arabic or Urdu); if unclear use ${L}. Friendly, short (max 60 words), like WhatsApp.
Only recommend products from this list (never invent products, prices, stock or discounts):
${JSON.stringify(prods)}
Put up to 3 recommended product ids in "products" (do not write ids in the reply). If the customer clearly asks to add a specific product to the cart, set "add_to_cart" to its id.
For order tracking or returns, ask for the order number like #TC-00124. Never ask for card numbers, passwords or ID numbers. Never claim customer counts, awards or partnerships.
Return strict JSON only: {"reply": string, "products": [ids], "add_to_cart": string|null}`;
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: clip(m.text, 500) })).filter(m => m.text);
    return { sys, msgs };
  }
  if (mode === 'recovery') return { sys: `You write abandoned-cart WhatsApp messages for the online store "${store}" (Saudi Arabia). Write in ${L}. Friendly, max 55 words, mention the items, one emoji max, you may offer coupon WELCOME10 (10% off), end with a simple question. Do not invent other discounts or facts. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: 'Cart: ' + info }] };
  if (mode === 'review') return { sys: `You reply publicly to product reviews for the online store "${store}". Write in ${L}. Max 45 words, warm and professional; if the review is negative apologise and offer help on WhatsApp. Do not invent facts. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: 'Review: ' + info }] };
  if (mode === 'reply') {
    const conv = (Array.isArray(body.messages) ? body.messages : []).slice(-6).map(m => `${m.role === 'agent' ? 'Store' : 'Customer'}: ${clip(m.text, 400)}`).join('\n');
    return { sys: `You are customer support at the online store "${store}" (Saudi Arabia; cash on delivery; free shipping over SAR 200; delivery 1-3 days in big cities). Suggest the next WhatsApp reply in ${L}. Max 55 words, friendly, answer the last question; do not invent order facts beyond the data. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: `Customer data: ${info}\nConversation:\n${conv}\nWrite the store's next reply.` }] };
  }
  return null;
}

function parseJSON(txt) {
  if (!txt) return null;
  let t = String(txt).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

async function timed(url, opts, ms) {
  const c = new AbortController(); const id = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(id); }
}

async function gemini(p) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  const contents = p.msgs.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
  if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  for (const model of GEMINI_MODELS) {
    for (const thinking of [true, false]) {
      const gen = { temperature: 0.5, responseMimeType: 'application/json', maxOutputTokens: 700 };
      if (thinking) gen.thinkingConfig = { thinkingLevel: 'low' };
      try {
        const r = await timed(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: p.sys }] }, contents, generationConfig: gen }),
        }, 12000);
        if (r.status === 400 && thinking) continue; // retry same model without thinkingConfig
        if (!r.ok) break; // 404/429/500/503 → next model
        const j = await r.json();
        const txt = (j.candidates?.[0]?.content?.parts || []).filter(x => !x.thought).map(x => x.text || '').join('');
        const data = parseJSON(txt);
        if (data) return { data, provider: 'gemini', model };
        break;
      } catch (e) { break; }
    }
  }
  return null;
}

async function groq(p) {
  const key = process.env.GROQ_API_KEY; if (!key) return null;
  try {
    const messages = [{ role: 'system', content: p.sys }, ...p.msgs.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))];
    const r = await timed('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.5, max_tokens: 700, response_format: { type: 'json_object' } }),
    }, 12000);
    if (!r.ok) return null;
    const j = await r.json();
    const data = parseJSON(j.choices?.[0]?.message?.content);
    return data ? { data, provider: 'groq', model: GROQ_MODEL } : null;
  } catch (e) { return null; }
}

function clean(mode, d) {
  if (mode === 'assistant') {
    const out = { reply: clip(d.reply || d.message || '', 1200), products: Array.isArray(d.products) ? d.products.map(String).slice(0, 3) : [], add_to_cart: d.add_to_cart ? clip(d.add_to_cart, 10) : null };
    return out.reply ? out : null;
  }
  return d.message ? { message: clip(d.message, 900) } : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  res.setHeader('Content-Type', 'application/json');
  if (limited(ip)) return res.end(JSON.stringify({ fallback: true, reason: 'rate' }));
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const p = buildPrompt(body);
  if (!p) return res.end(JSON.stringify({ fallback: true, reason: 'mode' }));
  const out = (await gemini(p)) || (await groq(p));
  const data = out && clean(body.mode, out.data);
  if (!data) return res.end(JSON.stringify({ fallback: true }));
  return res.end(JSON.stringify({ data, provider: out.provider }));
};
