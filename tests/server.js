// Local dev server: static files + /api/* (mimics Vercel functions)
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    const f = path.join(root, 'api', path.basename(u.pathname) + '.js');
    if (!fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
    let b = ''; req.on('data', c => b += c); req.on('end', () => { try { req.body = b ? JSON.parse(b) : {}; } catch (e) { req.body = {}; } require(f)(req, res); });
    return;
  }
  let p = path.join(root, decodeURIComponent(u.pathname)); if (u.pathname === '/') p = path.join(root, 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.statusCode = 404; return res.end('nf'); }
  res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream'); fs.createReadStream(p).pipe(res);
}).listen(process.env.PORT || 4173, () => console.log('up'));
