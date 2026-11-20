// ฮีโร่ป๊อป! — Cloudflare Worker
// เสิร์ฟไฟล์เกมจาก ./public (Static Assets) และ API ตารางคะแนนที่ /api/scores (เก็บใน D1)
const STAGES = 21, TOP = 10; // 20 ด่าน (0-19) + ด่านสุดท้าย (20)

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

async function hashIp(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hero-pop:' + ip));
  return [...new Uint8Array(buf)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getScores(env, url) {
  const st = Math.min(STAGES - 1, Math.max(0, parseInt(url.searchParams.get('stage')) || 0));
  const { results } = await env.DB.prepare(
    'SELECT name, score, stars, created_at AS time FROM scores WHERE stage = ? ORDER BY score DESC, created_at ASC LIMIT ?'
  ).bind(st, TOP).all();
  return json({ stage: st, scores: results });
}

async function postScore(env, req) {
  let j;
  try { j = await req.json(); } catch { return json({ error: 'JSON ไม่ถูกต้อง' }, 400); }
  const st = parseInt(j.stage), score = Math.floor(Number(j.score));
  if (!(st >= 0 && st < STAGES) || !(score >= 0 && score < 10_000_000)) return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400);
  const name = String(j.name || 'ผู้เล่น').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'ผู้เล่น';
  const stars = Math.max(0, Math.min(3, parseInt(j.stars) || 0));
  const now = Date.now();
  const ip = await hashIp(req.headers.get('CF-Connecting-IP') || 'unknown');

  // กันสแปม: ไม่เกิน 20 ครั้งต่อนาที ต่อ IP
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE ip = ? AND created_at > ?')
    .bind(ip, now - 60_000).first();
  if (recent && recent.n >= 20) return json({ error: 'ส่งคะแนนบ่อยเกินไป' }, 429);

  await env.DB.prepare('INSERT INTO scores (stage, name, score, stars, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(st, name, score, stars, ip, now).run();
  const better = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE stage = ? AND score > ?').bind(st, score).first();
  return json({ ok: true, rank: (better ? better.n : 0) + 1 });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/scores') {
      if (!env.DB) return json({ error: 'ยังไม่ได้ผูกฐานข้อมูล D1' }, 503);
      try {
        if (req.method === 'GET') return await getScores(env, url);
        if (req.method === 'POST') return await postScore(env, req);
        return json({ error: 'method not allowed' }, 405);
      } catch (e) {
        return json({ error: 'database error', detail: String(e.message || e) }, 500);
      }
    }
    return env.ASSETS.fetch(req);
  },
};
