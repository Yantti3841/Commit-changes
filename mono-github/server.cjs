const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(target, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    res.end(error ? 'Not found' : data);
  });
}).listen(4173, '127.0.0.1', () => console.log('MONO ready: http://127.0.0.1:4173'));
