-- 📅 Day 09 · Phase 3 — Constraints: ang database mismo ang huling bantay
-- Kumonekta muna:  psql -h localhost -p 5435 -U auth -d auth_learning

-- 1. Lagyan ng UNIQUE ang lumang table (may dalawang ana@example.com pa sa loob)
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
-- ERROR: could not create unique index "users_email_unique"
-- DETAIL: Key (email)=(ana@example.com) is duplicated.
-- → Hindi puwedeng maglagay ng patakaran na nilalabag na ng kasalukuyang data
-- (naka-comment para tumakbo ang file na ito mula sa simula)

-- 2. Burahin at gawin ulit nang tama (walang mahalagang data)
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,                  -- natatangi, hindi puwedeng walang laman
  email      TEXT NOT NULL UNIQUE,                -- bawal walang email, bawal doble
  name       TEXT,                                -- optional
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()   -- kusang napupunan kung kailan ginawa
);

-- 3. Subukang sirain

-- Tama: pumayag, at kusang napunan ang created_at
INSERT INTO users (email, name) VALUES ('ana@example.com', 'Ana');
SELECT * FROM users;

-- Doble → ERROR: duplicate key value violates unique constraint "users_email_key"
-- INSERT INTO users (email, name) VALUES ('ana@example.com', 'Ana Copy');

-- Walang email → ERROR: null value in column "email" ... violates not-null constraint
-- INSERT INTO users (name) VALUES ('Walang Email');

-- Malaking A → ⚠️ PUMAYAG. Magkaiba ang 'A' at 'a' para sa UNIQUE
INSERT INTO users (email, name) VALUES ('Ana@example.com', 'Big A');
SELECT * FROM users;
-- Resulta sa psql session ko: id 1 at 4. Kinain ng dalawang nabigong INSERT ang
-- id 2 at 3 — hindi ibinabalik ng sequence ang numero kahit mag-error.
-- (Kapag pinatakbo ang buong file, id 1 at 2 — naka-comment kasi ang mga nabigo.)
-- Aayusin ang malaking titik sa backend: lowercase ang email bago i-save (Day 14)
