# Day 98b — 2026-10-01 · Phase 19 · Frontend hardening (idinagdag)

> Hiniling ko: "can you study first the frontend? then think". Binasa ng AI ang buong frontend (14 na file, ~1,550 linya), naglista ng mga nakita,
> at nagmungkahi ng pagkakasunod. "go" ang sagot ko. Ang mga inuulit na code (hooks, istilo ng form) at ang nav ay **sinadyang hindi ginalaw**: pagkatapos ng Day 99, kapag may E2E test nang magbabantay.

## Ang mga nakita, at ang ginawa
| Nakita | Ginawa |
|---|---|
| 🐛 **Profile: "Loading…" habambuhay** kapag pumalya ang `/me` (walang `.catch`) | mensahe + **"Subukan ulit"** |
| 🐛 **`res.json()` sa sagot na hindi JSON** → error ng JSON parser ang nakikita ng user (9 na lugar) | **`readJson()`**: "May problema sa server. Subukan ulit mamaya." |
| Walang sagot (patay ang backend, walang internet) → "Failed to fetch" | **`send()`**: "Hindi maabot ang server. Subukan ulit mamaya." |
| Walang `autoComplete` sa login at register | `username`, `current-password`, `new-password`, `name` |
| Hindi naaanunsyo ng screen reader ang mga error | `role="alert"` sa mga `<p>❌ …</p>` |
| Tahimik na lumilipat ang Vite sa 5174 kapag okupado ang 5173 (nangyari noong Day 95: ang `mern-ecommerce` ko) | `port: 5173` + `strictPort` → `Error: Port 5173 is already in use` |
| Luma ang `frontend/README.md` (JavaScript, `vite.config.js`, walang Passkeys) | in-update |

## Mga sinukat (totoong browser)
| Sitwasyon | Resulta |
|---|---|
| **Patay na backend** (saradong port) | Profile: "❌ Hindi maabot ang server…" pagkalipas ng **~15s** · Login: parehong mensahe · "Subukan ulit" gumagana |
| **HTML na 502** (may CORS header) | "❌ May problema sa server…" agad (0.4s) |
| **Normal** (totoong backend): password login, passkey (idagdag, mag-login ×2, decoy, binura) | ✅ lahat |
| Okupado ang 5173, `npx vite` | `Error: Port 5173 is already in use`, exit 1 |
| `autocomplete` sa DOM | login: `username`, `current-password` · register: `username`, `new-password`, `name` |

## 🐛 Dalawang nahuli ng pagsubok
1. **Ang saradong port ay NAKABITIN, hindi tumatanggi** (sa WSL). Ang unang ayos ko (`.catch`) ay hindi sapat: hindi kailanman pumapalya ang `fetch`, kaya "Loading…" pa rin. Ayos: **15s na timeout** sa bawat request.
2. **Sinira ko mismo ang `readJson`.** Pinalitan ko ang lahat ng `await res.json()` ng `await readJson(res)` — pati ang nasa LOOB ng `readJson`. Naging tawag ito sa sarili (walang katapusan), kaya **bawat** sagot ay naging "May problema sa server".
   **Nagbabala ang TypeScript** (`never` ang naging uri ng sagot), at **pinatahimik ko ito** gamit ang `any` sa halip na basahin ang function.
   Ang nakahuli: ang browser test ng **normal** na login (200 mula sa backend, pero error sa page). Nakakahiya, pero mahalaga: ang "pumasa ang test ng pagpalya" ay walang kuwenta kung hindi rin sinubukan ang normal.
   **Aral:** kapag kakaiba ang babala ng `tsc`, basahin ang code — huwag patahimikin.

## Ang hindi pa ginagawa
- **Walang permanenteng test** ng mga ito sa repo — ang browser test ay nasa `/tmp` ng AI. Ito ang Day 99.
- 15 segundo pa rin ang paghihintay bago lumabas ang mensahe kapag nakabitin ang koneksyon.
- Ang mga inuulit na code at ang nav kapag naka-login: pagkatapos ng Day 99.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit 15 segundo, hindi 5?**
  S: Ang Neon ay natutulog; ang unang query pagkagising ay ~1 segundo, at may mga request na mabagal talaga (argon2, email). Ang 15s ay para sa "talagang walang sagot", hindi sa "mabagal".
- **T: Ano ang `role="alert"`?**
  S: Sinasabi nito sa screen reader na basahin agad ang text kapag lumabas. Kung wala, makikita ng nakakakita ang pulang mensahe, pero hindi malalaman ng bulag na user na may mali.
- **T: Bakit masama ang tahimik na paglipat sa 5174?**
  S: Dahil gumagana ang page (lumalabas), pero bawat request ay tinatanggihan ng backend (CORS) — at ang mensahe ay "Failed to fetch", na walang sinasabi tungkol sa port. Mas mabuti ang pumalya agad na may malinaw na dahilan.

## Susunod
- **Day 99 — E2E test:** Playwright sa repo — ang passkey flow, at ang dalawang bug na ito bilang permanenteng test.
