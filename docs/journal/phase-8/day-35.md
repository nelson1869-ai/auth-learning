# Day 35 — 2026-09-26 · Phase 8 · Neon (production database)

## Ano ang ginawa
- **Ako:** gumawa ng Neon account at project `auth-learning` — **Singapore** (pinakamalapit sa PC ko sa PH: ~30–50ms vs ~200ms sa Ohio), **Postgres 17** (pareho sa dev at CI), database `auth_learning`, Postgres lang (walang Neon Auth, Functions, atbp.)
- **Hindi ginamit ang "Agent prompt" ng Neon** (CLI + MCP + skills) — bibigyan nito ang AI ng access sa buong account; sapat na ang isang connection string ("least privilege")
- **AI:** `backend/.env.production` (bagong `JWT_SECRET`, iba sa dev; `CLIENT_URL=https://nelson1869.com`; `NODE_ENV=production`); ginawang **direct** ang host at **`sslmode=verify-full`**; migrations sa Neon (2); sinubukan ang backend container → Neon: health 200, users/count 200

## Backup drill 🧪
1. Gumawa ng `backup-drill@example.com` (7:48:40 PM) → binura (7:49:48 PM)
2. Restore sa Neon — **dalawang beses walang bumalik**: iniwan ang oras sa default ("ngayon"), kaya ang naibalik ay ang database na wala na ang row (nag-iwan ito ng `production_old_…` na backup branches)
3. **Ikatlong subok: inilagay ang 7:49 PM nang tahasan → BUMALIK ang row** ✅
4. Binura ulit ang pansubok na row; 0 user sa production

## Ano ang natutunan ko (sa sarili kong salita)
- **Managed DB** = sila ang bahala sa server, updates at backup; Postgres pa rin, walang binago sa code.
- **Region = malapit sa backend**, hindi sa user.
- **Dev/prod parity** — parehong Postgres version sa dev, CI at production.
- **`sslmode=verify-full`** — naka-encrypt AT sinusuri kung Neon talaga ang kausap; ang `require` ay magiging mas mahina sa `pg` v9.
- **Ang backup na hindi pa nasusubukan ay hindi backup** — ang default na oras ng restore ay "ngayon"; 6 na oras lang ang history sa Free plan.

## ⚠️ Mga problema
- Nakopya ang connection string nang walang `postgresql://` sa simula.
- **Lumabas ang password ng Neon sa AI session log** (mali ang pag-parse ng script ng AI dahil sa kulang na simula). Pinili kong **palitan ito bago ang Day 38** — nasa roadmap na bilang paalala.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 36: backend sa internet — named Cloudflare Tunnel → `https://api.nelson1869.com`
- Ang `production_old_…` na branches sa Neon: **hindi mabubura** — naging "magulang" sila ng `production` pagkatapos ng restore ("cannot delete branch that has children"). Walang compute, halos walang storage — hayaan lang.
