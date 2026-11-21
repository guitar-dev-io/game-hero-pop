-- ตารางคะแนนของฮีโร่ป๊อป! (Cloudflare D1)
CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  stage      INTEGER NOT NULL,          -- 0-19 = ด่าน 1-1 ถึง 5-4, 20 = ด่านสุดท้าย, 21-25 = ด่านโบนัสบท 1-5
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,
  stars      INTEGER NOT NULL DEFAULT 0,
  ip         TEXT,                      -- แฮชของ IP (ไม่เก็บ IP จริง) ใช้กันสแปม
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_stage_score ON scores (stage, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_ip_time     ON scores (ip, created_at);
