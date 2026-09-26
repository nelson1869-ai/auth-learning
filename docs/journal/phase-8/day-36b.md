# Day 36b — 2026-09-26 · Phase 8 · frontend sa internet 🎉

## Ano ang ginawa
- **AI (code):** `VITE_API_URL` (tumatanggi ang production build kung wala), `vite-env.d.ts`, `public/_headers` (assets 1 taon, `index.html` no-cache), **`Cache-Control: no-store`** sa `/api/auth/*` + test (pumupula kapag inalis); manual deploy ng backend (`docker compose … up -d --build`)
- **Ako (Cloudflare):** Pages → Import Git repository → GitHub (**`auth-learning` lang**) → root `frontend`, `npm run build`, `dist`, `VITE_API_URL`, `NODE_VERSION=24` → deploy → custom domain **`nelson1869.com`** (Active, SSL)
- **Ako (Neon):** **ni-reset ang password** — nasa ibang branch pa ako noong una ("create read-write endpoint" → `production_old_…` ang napili)

## Sinubukan
| | |
|---|---|
| `auth-learning.pages.dev` | API URL tama, 0 localhost, `/profile` → 200 (SPA fallback) |
| Lumang Neon password | backend 500 hanggang ni-restart → 200 (patay na ang luma) |
| **`https://nelson1869.com` sa iPhone 13 screen** | /profile→/login · register · login → "Hello, Launch Test!" · cookie `httpOnly secure Lax` · refresh · logout · walang JS error |
| CDN | JS: `MISS` → `HIT` (Singapore); `/api/auth/me`: `no-store`, `DYNAMIC` |

## Ano ang natutunan ko (sa sarili kong salita)
- **Build-time env** (`VITE_…`) — nakabaon sa JS; hindi lugar para sa secret.
- **CDN** — kopya malapit sa user (`HIT`); **HTTP caching** — hash sa pangalan = puwedeng i-cache nang matagal; personal na data = `no-store`.
- **Bakit hindi gumana ang login sa `pages.dev`** — ibang site: CORS at cookie ay para sa `nelson1869.com` lang.
- **Least privilege** sa GitHub — isang repo lang ang ibinigay sa Cloudflare.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 37: CD ng backend (manual `deploy.sh` → image sa GHCR → pull ng PC)
- Day 38: 🎉 MVP launch — isang kaibigan, sariling phone
