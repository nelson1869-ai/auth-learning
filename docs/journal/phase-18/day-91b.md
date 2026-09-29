# Day 91b — 2026-09-29 · Phase 18 · Load balancing (lab)

## Ang tanong ng araw (idinagdag ko sa roadmap)
Kapag dalawa ang backend at may load balancer sa harap, ano ang nangyayari kapag namatay ang isa? At ano ang **nasisira** kapag hindi na iisa ang app?

## Saan: lab, hindi production (D-034)
Ayon sa roadmap, "para sa konsepto". Kapag inilagay ko agad sa production, ang in-memory rate limiter ay magiging **dalawang bilang**, at dodoble ang limit ng panghuhula ng password.
Kaya **`devops/lab/`**: sariling compose project (`auth-learning-lab`), sariling Postgres sa memory, **ang production image**, at Caddy sa `127.0.0.1:8088`.
Hindi ito babangga sa production o dev (aral ng reference sa project name). Sinuri pagkatapos: buo ang production at dev.

## Ang Caddy
- **round robin:** 1, 2, 1, 2…
- **active health check:** bawat 2s, `GET /api/health/live` sa bawat backend. Ang hindi sumasagot ay hindi na pinapadalhan.
- **passive:** kapag pumalya ang isang request, iiwasan ang backend na iyon nang 10s.
- **retry:** kapag hindi maabot ang isang backend, subukan ang iba sa loob ng 5s.
- **Static ang dalawang upstream** (pangalan ng container). Sa dynamic na upstream, hindi gumagana ang active health check.

## Ang mga sinukat
| Pagsubok | Resulta |
|---|---|
| 8 request | ✅ 4 sa backend-1, 4 sa backend-2 |
| 20 req/s (GET na may database + POST), **`docker stop`** ng backend-1 sa gitna | ✅ **0 error** (239 request) |
| Pareho, **`docker kill`** (SIGKILL, biglaan) ng backend-2 | ✅ **0 error** (286 request) |
| Request na **nasa kalagitnaan** (mabagal na body) sa backend na SIGKILL | ❌ **502** |
| Maling login hanggang 429 | ⚠️ **20**, hindi 10 |
| IP na nakikita ng rate limiter | ⚠️ `172.22.0.5` = **ang Caddy**, para sa lahat |
| Retention job sa dalawang backend | ⚠️ **parehong tumakbo** (1.2s ang pagitan) |

### Tungkol sa 0 error
Mabilis ang bawat request (~5ms), kaya halos walang request na nasa kalagitnaan sa eksaktong sandali ng pagpatay. Ang nakikita ng Caddy ay
"hindi makakonekta", at ligtas iyong i-retry sa ibang backend. **Hindi ko ito basta pinaniwalaan:** sinubukan ko ang request na nasa kalagitnaan.

### 🐛 Ang unang pagsubok ko sa request na nasa kalagitnaan ay hindi sapat
Natapos ang mabagal na request (2s) **bago** ko pa napatay ang backend. Natagalan ang paghihintay na maging healthy ang isa pang backend.
Kaya **wala itong napatunayan**. Inulit ko: mas mahabang request (~10s), iisang backend lang ang buhay, at pinatay habang tumatakbo ito → **502**.
**Tapat na limitasyon:** patay din ang backend-2 sa pagsubok na iyon. Kaya hindi ko nasubukan kung ire-retry ng Caddy ang request sa ibang buhay na backend.
Ang napatunayan: **ang request na nasa loob ng isang backend ay namamatay kasama nito.** Kaya mahalaga pa rin ang graceful shutdown (Day 85): sa `docker stop`, 0 error.

### Ang rate limiter (ang dahilan ng Day 92)
- **20 bago ang 429:** nasa memory ng bawat process ang bilang. Salitan ang pagtama (2,1,2,1…), kaya 10 + 10.
- **Iisang IP para sa lahat:** ang nakikita ng app ay ang IP ng Caddy. Sa likod ng proxy, iisang "user" ang lahat, kaya kayang harangin ng isang umaatake ang login ng lahat.
  Sa production, ang `CF-Connecting-IP` ang gumagawa nito (Day 43). Sa likod ng sariling proxy, kailangang pagkatiwalaan ang `X-Forwarded-For` **mula lang sa proxy na iyon**.

### Ang retention job at ang advisory lock
Parehong nag-`retention_done` ang dalawang backend, 1.2s ang pagitan. **Pinipigilan ng lock ang SABAY na paglilinis, hindi ang dalawang beses** sa loob ng isang oras.
Walang pinsala (walang mabubura ang pangalawa), pero hindi "isang beses bawat oras" ang ibig sabihin ng lock. (Ang sabay na kaso ay napatunayan ng test ng Day 90.)

## Kumpara sa reference
Walang load balancer ang reference. Bago ang lahat ng ito.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang load balancer?**
  S: Isang server sa harap ng maraming kopya ng app. Tumatanggap ito ng bawat request at ipinapasa sa isa sa mga kopya. Kapag namatay ang isang kopya, hindi na ito pinapadalhan.
  Dalawang pakinabang: kaya ang mas maraming traffic, at hindi bumabagsak ang serbisyo kapag isang kopya lang ang namatay.
- **T: Bakit madaling i-scale ang app natin?**
  S: Dahil halos walang itinatago ang app sa sariling memory. Ang session ay nasa cookie (JWT) at nasa database ang refresh token, kaya kahit aling kopya ay kayang sumagot.
  **Ang tanging hindi:** ang rate limiter. Iyan ang nakita ngayong araw.
- **T: Ano ang pagkakaiba ng active at passive na health check?**
  S: **Active:** kusang nagtatanong ang load balancer bawat ilang segundo ("buhay ka ba?"). **Passive:** tinitingnan lang nito ang totoong mga request; kapag pumalya, iiwasan ang backend.
  Magkasama ang dalawa: ang active ay para malaman bago pa tamaan ng user, at ang passive ay para agad makakilos.
- **T: Bakit hindi pa ito sa production?**
  S: Dodoble ang limit ng panghuhula ng password (rate limiter sa memory). Kailangan munang pagsaluhan ng mga kopya ang iisang bilang (Day 92),
  at kailangan pang i-scrape ng Prometheus ang bawat kopya, at isa-isang i-deploy.

## Susunod
- **Day 92 — Distributed rate limiting:** iisang bilang para sa lahat ng kopya (Redis). Susubukan sa parehong lab: dapat 10 ulit, hindi 20.
