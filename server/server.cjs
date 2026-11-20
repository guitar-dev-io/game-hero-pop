// ฮีโร่ป๊อป! — เซิร์ฟเวอร์เกม + ตารางคะแนน (Node.js ไม่ต้องติดตั้งแพ็กเกจเพิ่ม)
// วิธีรัน:  npm run serve   (หรือ node server/server.cjs)  เปลี่ยนพอร์ต: PORT=8080
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = +process.env.PORT || 3000;
const DATA = path.join(__dirname, 'scores.json');
const STAGES = 21, KEEP = 100, TOP = 10;

let db = {};
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) { db = {}; }
for (let i = 0; i < STAGES; i++) if (!Array.isArray(db[i])) db[i] = [];
let saveTimer = null;
const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFile(DATA, JSON.stringify(db), () => {}), 300); };

const hits = new Map(); // กันสแปม: ไม่เกิน 20 ครั้ง/นาที ต่อ IP
const limited = ip => { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 20; };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/scores' && req.method === 'GET') {
    const st = Math.min(STAGES - 1, Math.max(0, parseInt(url.searchParams.get('stage')) || 0));
    return send(res, 200, { stage: st, scores: db[st].slice(0, TOP) });
  }
  if (url.pathname === '/api/scores' && req.method === 'POST') {
    if (limited(req.socket.remoteAddress)) return send(res, 429, { error: 'ส่งคะแนนบ่อยเกินไป' });
    let body = '';
    req.on('data', d => { body += d; if (body.length > 2000) req.destroy(); });
    req.on('end', () => {
      try {
        const j = JSON.parse(body);
        const st = parseInt(j.stage), score = Math.floor(Number(j.score));
        if (!(st >= 0 && st < STAGES) || !(score >= 0 && score < 10000000)) return send(res, 400, { error: 'ข้อมูลไม่ถูกต้อง' });
        const name = String(j.name || 'ผู้เล่น').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'ผู้เล่น';
        const entry = { name, score, stars: Math.max(0, Math.min(3, parseInt(j.stars) || 0)), time: Date.now() };
        db[st].push(entry); db[st].sort((a, b) => b.score - a.score); db[st] = db[st].slice(0, KEEP);
        persist();
        const k = db[st].indexOf(entry);
        send(res, 200, { ok: true, rank: k >= 0 ? k + 1 : null });
      } catch (e) { send(res, 400, { error: 'JSON ไม่ถูกต้อง' }); }
    });
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return fs.readFile(path.join(__dirname, '..', 'public', 'index.html'), (err, buf) => {
      if (err) { res.writeHead(500); return res.end('index.html not found'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(buf);
    });
  }
  res.writeHead(404); res.end('Not found');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 ฮีโร่ป๊อป! เซิร์ฟเวอร์ทำงานแล้ว`);
  console.log(`   เครื่องนี้:      http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || [])
    if (a.family === 'IPv4' && !a.internal) console.log(`   เพื่อนใน Wi-Fi:  http://${a.address}:${PORT}`);
  console.log(`   คะแนนเก็บที่:    ${DATA}\n`);
});
