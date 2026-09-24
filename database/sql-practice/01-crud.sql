-- 📅 Day 08 · Phase 3 — Unang SQL: CRUD (Create, Read, Update, Delete)
-- Kumonekta muna:  psql -h localhost -p 5435 -U auth -d auth_learning
-- Mga utos ng psql (hindi SQL, walang ;):  \dt  listahan ng tables · \d users  hugis ng table · \q  lumabas

-- Gumawa ng table. Wala pang patakaran (constraints) — sinadya, para makita ang problema sa ibaba
CREATE TABLE users (
  id    SERIAL PRIMARY KEY,  -- kusang numero (1, 2, 3...), natatangi sa bawat row
  email TEXT,
  name  TEXT
);

-- C: magdagdag ng row. Hindi binibigay ang id — ang database ang pumipili
INSERT INTO users (email, name) VALUES ('nelson@example.com', 'Nelson');

-- R: basahin. * = lahat ng column
SELECT * FROM users;
SELECT email FROM users WHERE name = 'Nelson';

-- U: baguhin. LAGING may WHERE — kung wala, mababago LAHAT ng row
UPDATE users SET name = 'Nelson G.' WHERE id = 1;

-- D: burahin. LAGING may WHERE — kung wala, mabubura LAHAT
DELETE FROM users WHERE id = 1;

-- Eksperimento A: bagong row pagkatapos ng DELETE
INSERT INTO users (email, name) VALUES ('ana@example.com', 'Ana');
SELECT * FROM users;
-- Resulta: id = 2, hindi 1. Hindi nire-reuse ng SERIAL ang nabura —
-- para hindi mapunta sa bagong user ang lumang data na nakaturo pa sa id 1

-- Eksperimento B: parehong email, dalawang beses
INSERT INTO users (email, name) VALUES ('ana@example.com', 'Ana Copy');
SELECT * FROM users;
-- Resulta: PUMAYAG (id 2 at 3, parehong email). Bug ito: sa login, sinong Ana?
-- Aayusin sa Day 09 gamit ang constraints (UNIQUE, NOT NULL)
