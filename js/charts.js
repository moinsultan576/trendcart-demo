/* Tiny SVG chart helpers */
(function () {
  function niceMax(v) { const raw = Math.max(v, 1) / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; const steps = p < 10 ? [1, 2, 3, 4, 5, 6, 8, 10] : [1, 2, 2.5, 5, 10]; const st = steps.find(x => n <= x) * p; return st * 4; }

  // values: number[]; labels: string[] (sparse ok)
  function line(values, labels, opts) {
    opts = opts || {};
    const W = 560, H = 210, L = 34, R = 10, T = 12, B = 28;
    const max = niceMax(Math.max(...values, 1));
    const n = values.length;
    const x = i => L + (n === 1 ? 0 : i * (W - L - R) / (n - 1));
    const y = v => T + (H - T - B) * (1 - v / max);
    const rtl = document.documentElement.dir === 'rtl';
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = Math.round(max * k / 4); const yy = y(v);
      g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end" class="axis">${v}</text>`;
    }
    const pts = values.map((v, i) => [x(i), y(v)]);
    let d = '';
    pts.forEach((p, i) => {
      if (!i) { d += `M${p[0]},${p[1]}`; return; }
      const p0 = pts[i - 1]; const cx = (p0[0] + p[0]) / 2;
      d += ` C${cx},${p0[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
    });
    const area = d + ` L${x(n - 1)},${H - B} L${x(0)},${H - B} Z`;
    const step = Math.max(1, Math.ceil(n / (opts.ticks || 6)));
    let xl = '';
    labels.forEach((lb, i) => { if (i % step === 0 || i === n - 1) xl += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="axis">${lb}</text>`; });
    const showDots = n <= 31;
    const dots = showDots ? pts.map((p, i) => (i % Math.max(1, Math.ceil(n / 12)) === 0 || i === n - 1) ? `<circle cx="${p[0]}" cy="${p[1]}" r="4" class="dot"><title>${labels[i]}: ${values[i]}</title></circle>` : '').join('') : '';
    return `<svg class="chart line" viewBox="0 0 ${W} ${H}" role="img" aria-label="line chart">
      <defs><linearGradient id="lg-${opts.id || 'a'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${g}<path d="${area}" fill="url(#lg-${opts.id || 'a'})"/><path d="${d}" class="ln"/>${dots}${xl}</svg>`;
  }

  // segs: [{value,color,label}]
  function donut(segs, center, sub) {
    const tot = segs.reduce((a, s) => a + s.value, 0) || 1;
    const R = 52, C = 2 * Math.PI * R; let off = 0;
    const arcs = segs.map(s => { const len = C * s.value / tot; const gap = segs.length > 1 ? 2 : 0; const a = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${s.color}" stroke-width="18" stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${s.label}: ${s.value}</title></circle>`; off += len; return a; }).join('');
    return `<svg class="chart donut" viewBox="0 0 140 140" role="img" aria-label="donut chart">${arcs}<text x="70" y="70" text-anchor="middle" class="dc-n">${center}</text><text x="70" y="88" text-anchor="middle" class="dc-s">${sub}</text></svg>`;
  }

  // bars: [{label,value}]
  function bars(items, opts) {
    opts = opts || {};
    const W = 560, H = 220, L = 46, R = 10, T = 12, B = 30;
    const max = niceMax(Math.max(...items.map(i => i.value), 1));
    const bw = (W - L - R) / items.length;
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = max * k / 4; const yy = T + (H - T - B) * (1 - k / 4); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" class="axis">${opts.fmt ? opts.fmt(v) : v}</text>`; }
    const b = items.map((it, i) => { const h = (H - T - B) * it.value / max; const xx = L + i * bw + bw * 0.22; return `<rect x="${xx}" y="${H - B - h}" width="${bw * 0.56}" height="${Math.max(h, 1)}" rx="5" class="bar"><title>${it.label}: ${opts.fmt ? opts.fmt(it.value) : it.value}</title></rect><text x="${xx + bw * 0.28}" y="${H - 10}" text-anchor="middle" class="axis">${it.label}</text>`; }).join('');
    return `<svg class="chart bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="bar chart"><defs><linearGradient id="bg-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>${g}${b}</svg>`;
  }

  // stacked: [{label,a,b}] a = total (orange), b = part (green, drawn at bottom)
  function stacked(items) {
    const W = 560, H = 230, L = 34, R = 8, T = 12, B = 28;
    const max = niceMax(Math.max(...items.map(i => i.a), 1));
    const bw = (W - L - R) / items.length;
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = max * k / 4; const yy = T + (H - T - B) * (1 - k / 4); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" class="axis">${Math.round(v)}</text>`; }
    const y = v => (H - T - B) * v / max;
    const b = items.map((it, i) => { const x = L + i * bw + bw * 0.24, w = bw * 0.52; const ha = y(it.a), hb = y(it.b);
      return `<rect x="${x}" y="${H - B - ha}" width="${w}" height="${Math.max(ha, 1)}" rx="4" class="bar-a"><title>${it.label}: ${it.a}</title></rect><rect x="${x}" y="${H - B - hb}" width="${w}" height="${Math.max(hb, 0)}" rx="4" class="bar-b"><title>${it.label}: ${it.b}</title></rect><text x="${x + w / 2}" y="${H - 9}" text-anchor="middle" class="axis">${it.label}</text>`; }).join('');
    return `<svg class="chart bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="bar chart">${g}${b}</svg>`;
  }
  // combo: bars (a) + line (b, own scale)
  function combo(items, fmt) {
    const W = 560, H = 240, L = 46, R = 10, T = 14, B = 28;
    const maxA = niceMax(Math.max(...items.map(i => i.a), 1)), maxB = Math.max(...items.map(i => i.b), 1) * 1.15;
    const bw = (W - L - R) / items.length; let g = '';
    for (let k = 0; k <= 4; k++) { const v = maxA * k / 4; const yy = T + (H - T - B) * (1 - k / 4); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" class="axis">${fmt ? fmt(v) : Math.round(v)}</text>`; }
    const bars = items.map((it, i) => { const h = (H - T - B) * it.a / maxA, x = L + i * bw + bw * 0.2; return `<rect x="${x}" y="${H - B - h}" width="${bw * 0.6}" height="${Math.max(h, 1)}" rx="4" class="bar-a ${i === items.length - 1 ? 'cur' : ''}"><title>${it.label}: ${fmt ? fmt(it.a) : it.a}</title></rect><text x="${x + bw * 0.3}" y="${H - 9}" text-anchor="middle" class="axis">${it.label}</text>`; }).join('');
    const pts = items.map((it, i) => [L + i * bw + bw / 2, T + (H - T - B) * (1 - it.b / maxB)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
    return `<svg class="chart combo" viewBox="0 0 ${W} ${H}" role="img" aria-label="sales chart">${g}${bars}<path d="${d}" class="ln2"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="dot2"><title>${items[i].label}: ${items[i].b}</title></circle>`).join('')}</svg>`;
  }
  function spark(vals, color) {
    const W = 110, H = 36, max = Math.max(...vals, 1), n = vals.length;
    const pts = vals.map((v, i) => [(i / (n - 1 || 1)) * W, H - 3 - (H - 8) * v / max]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${d} L${W},${H} L0,${H} Z" fill="${color}" opacity=".15"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
  }
  window.Charts = { line, donut, bars, stacked, combo, spark };
})();
