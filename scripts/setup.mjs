// สร้าง (หรือหา) ฐานข้อมูล D1 ชื่อ hero-pop-scores, ใส่ database_id ลง wrangler.toml, แล้วสร้างตาราง
// ใช้ได้ทั้งบนเครื่อง (หลัง `npx wrangler login`) และใน GitHub Actions (ใช้ CLOUDFLARE_API_TOKEN)
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const NAME = 'hero-pop-scores';
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const run = cmd => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

let id = null;
try {
  const list = JSON.parse(run('npx wrangler d1 list --json'));
  const found = list.find(d => d.name === NAME);
  if (found) { id = found.uuid; console.log(`✔ พบฐานข้อมูล ${NAME} อยู่แล้ว (${id})`); }
} catch (e) { console.warn('อ่านรายการ D1 ไม่ได้ จะลองสร้างใหม่:', e.message); }

if (!id) {
  const out = run(`npx wrangler d1 create ${NAME}`);
  const m = out.match(UUID);
  if (!m) { console.error(out); throw new Error('สร้าง D1 ไม่สำเร็จ'); }
  id = m[0];
  console.log(`✔ สร้างฐานข้อมูล ${NAME} แล้ว (${id})`);
}

const toml = fs.readFileSync('wrangler.toml', 'utf8');
const next = toml.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${id}"`);
if (next !== toml) { fs.writeFileSync('wrangler.toml', next); console.log('✔ อัปเดต database_id ใน wrangler.toml'); }

run(`npx wrangler d1 execute ${NAME} --remote --file=schema.sql --yes`);
console.log('✔ สร้างตาราง scores เรียบร้อย');
