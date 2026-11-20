# ฮีโร่ป๊อป! จับคู่สุดหรรษา 🍬⚔️

เกมจับคู่ 3 (match‑3) บนเว็บ เล่นได้ทั้งมือถือและคอม พร้อมตารางคะแนนออนไลน์
ตัวละครทั้งหมดออกแบบขึ้นใหม่ (ได้แรงบันดาลใจจากมินิเกมจับคู่ฮีโร่)

## ฟีเจอร์
- ลูกอมฮีโร่ 4 ตัว (อควา • ลูน่า • โซล • นิกซ์) อัปเกรดเป็น Lv.2 / Lv.3 พร้อมสกิลเฉพาะตัว
- **ฉากสกิล (cut‑in):** ฮีโร่โผล่มาจากด้านข้าง เหวี่ยงอาวุธฟันกระดาน ก่อนปล่อยสกิล (ปิดได้ที่เมนู)
- **สุดยอดคอมโบ:** สลับลูกอมพิเศษ 2 ลูกเข้าหากัน = ระเบิดกากบาท 3 แถว / Lv.3+Lv.3 = ล้างทั้งกระดาน
- **โหมด FEVER:** เติมเกจจนเต็ม → คะแนน x2 นาน 8 วิ
- สิ่งกีดขวาง: จอมมารเงา (บอส), โกเลมเพลิง, โกเลมน้ำแข็ง, กิ้งก่าแสง, ก้อนหิน
- ไอเทม: สายฟ้าเสริมพลัง, นาฬิกาล้างสี, ระเบิดพลังงาน
- อนุภาค, จอสั่น, แบนเนอร์คอมโบ, นับถอยหลัง, คำใบ้เมื่อนิ่งนาน, เสียงเอฟเฟกต์
- 5 ด่าน + โหมดไม่สิ้นสุด, ตารางคะแนน 10 อันดับต่อด่าน

## โครงสร้าง
```
public/index.html      ตัวเกมทั้งหมด (ไฟล์เดียว)
src/worker.js          Cloudflare Worker: เสิร์ฟเกม + API /api/scores
schema.sql             ตาราง D1
wrangler.toml          ค่าตั้งค่า Cloudflare
scripts/setup.mjs      สร้าง D1 + ใส่ database_id + สร้างตารางให้อัตโนมัติ
server/server.cjs      เซิร์ฟเวอร์ Node.js สำหรับรันเองในบ้าน/LAN
.github/workflows/     deploy อัตโนมัติเมื่อ push เข้า main
```

---

## 🚀 Deploy ขึ้น Cloudflare (Workers + D1)

### วิธี A — จากเครื่องตัวเอง
```bash
npm install
npx wrangler login      # ล็อกอินบัญชี Cloudflare (เปิดเบราว์เซอร์)
npm run deploy          # สร้าง D1 + ตาราง แล้ว deploy
```
เสร็จแล้วจะได้ลิงก์ `https://game-hero-pop.<ชื่อบัญชี>.workers.dev`

### วิธี B — อัตโนมัติด้วย GitHub Actions (push แล้วขึ้นเว็บเอง)
1. Cloudflare Dashboard → **My Profile → API Tokens → Create Token** → ใช้เทมเพลต **Edit Cloudflare Workers**
   แล้วเพิ่มสิทธิ์ **Account → D1 → Edit**
2. คัดลอก **Account ID** (หน้า Workers & Pages ด้านขวา)
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - `CLOUDFLARE_API_TOKEN` = token จากข้อ 1
   - `CLOUDFLARE_ACCOUNT_ID` = Account ID จากข้อ 2
4. Push เข้า `main` (หรือกด **Actions → Deploy to Cloudflare → Run workflow**)

workflow จะสร้างฐานข้อมูล `hero-pop-scores` ให้เองถ้ายังไม่มี (ใช้ซ้ำได้ ไม่ลบคะแนนเดิม)

> อยากใช้โดเมนตัวเอง: Workers & Pages → game-hero-pop → Settings → Domains & Routes → Add Custom Domain

### ทดสอบบนเครื่องแบบ Cloudflare
```bash
npm run dev             # http://localhost:8787 (ใช้ D1 จำลองในเครื่อง)
```

---

## 🏠 รันเป็นเซิร์ฟเวอร์เอง (Node.js, ไม่ต้องใช้ Cloudflare)
```bash
npm run serve           # หรือ node server/server.cjs
```
เปิด `http://localhost:3000` — เพื่อนใน Wi‑Fi เดียวกันใช้ลิงก์ IP ที่ขึ้นใน Terminal
คะแนนเก็บใน `server/scores.json` • เปลี่ยนพอร์ต: `PORT=8080 npm run serve`

## 📄 เปิดไฟล์ตรงๆ
เปิด `public/index.html` ในเบราว์เซอร์ก็เล่นได้ทันที (ตารางคะแนนจะเก็บแค่ในเครื่อง)

## API
| Method | Path | รายละเอียด |
|---|---|---|
| GET | `/api/scores?stage=0..5` | 10 อันดับแรกของด่าน |
| POST | `/api/scores` | `{ "name", "stage", "score", "stars" }` → `{ "ok": true, "rank": n }` |

กันสแปม 20 ครั้ง/นาที ต่อ IP (เก็บเป็นค่าแฮช ไม่เก็บ IP จริง)
