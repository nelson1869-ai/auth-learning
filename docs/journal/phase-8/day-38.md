# Day 38 — 2026-09-26 · Phase 8 · 🎉 MVP LAUNCH

## Ano ang nangyari
- Binuksan ko ang **`https://nelson1869.com`** sa **phone ko**, sa totoong internet → **register → login → Profile → logout — walang problema**
- Sinuri ng AI ang production: **user #1** (10:02 PM), `$argon2id` na hash, 0 error sa logs, walang rate-limit mula sa phone
- **Tapat na tala:** ang success criterion sa Day 01 ay "phone ng isang **kaibigan**". Sa sarili kong phone ko sinubukan — napatunayan ang lahat ng teknikal na bahagi; ang kaibigan ay ibang tao at ibang network lang. Ipapasubok ko kapag may pagkakataon.

## Ang buong daan ng request (lahat ay ginawa namin)
```
Phone → https://nelson1869.com (Cloudflare Pages + CDN)
      → https://api.nelson1869.com (Cloudflare, TLS 1.3) → named Tunnel
      → cloudflared → backend container (image mula sa CI, GHCR) sa PC ko
      → Neon (Singapore, verify-full)
```

## Ang pinakamahirap (sa buong 38 araw)
- Maraming maliit na bagay na nakakalimutan: import, placeholder sa code, merge bago ang huling push, `git checkout` na pumapatay sa watcher.
- Ang mga "hindi nakikita": CORS, cookies sa pagitan ng domains, `Secure`, kung aling IP ang nakikita sa likod ng tunnel.

## Ang pinakanatutunan
- **Subukan sa totoong sitwasyon** — ang "ayos" na hindi nasubukan (hal. `--watch-path`, backup restore) ay hindi pa ayos.
- **Sirain nang sadya ang code** para patunayang totoo ang test.
- **Least privilege** — isang repo lang sa Cloudflare, walang Neon MCP, walang self-hosted runner.
- **Hindi tapos ang MVP bilang produkto** — gumagana, pero kailangan pa ng hardening bago buksan sa lahat.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Patayin ang production backend (ligtas habang hindi pa hardened) → Phase 9
