# Day 48 — 2026-09-27 · Phase 10 · Audit log

## Ano ang ginawa
- **`audit_logs` table** (migration `0003`): `actor_id` (sino, FK na `ON DELETE SET NULL`), `action`, `target_id` (kanino),
  `ip`, `user_agent`, `metadata` (jsonb), `created_at` + 2 index.
- **`lib/audit.ts`**:
  - totoong IP (`clientIp`);
  - user agent na pinutol sa 300;
  - kapag pumalya ang pagtatala, **hindi** bumabagsak ang request, pero ERROR ito sa logs.
- **Itinatala:** `register`, `login`, `login_failed` (target = ang account na sinubukang pasukin, metadata = ang email na tinype),
  `logout`, `access_denied` (403), `admin_list_users`, `admin_list_audit_logs`.
- **`GET /api/admin/audit-logs?page=&limit=`**: may email ng gumawa (LEFT JOIN).
- **Tests: 74** (10 bago).

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | walang `login_failed` · may password sa metadata · walang `try/catch` | ✅ bumagsak ang bawat isa |
| Dev | oras ng maling login (salitan ×20, may account vs wala) | ✅ 85ms vs 81ms, magkapatong ang saklaw |
| Dev | `15-audit-logs.http` (6 requests) | ✅ tugma · **nakita ang pag-usog ng page 2** (tingnan sa ibaba) |
| Production | register → maling login → login → admin → audit-logs | ✅ 4 migrations · lahat ng row ay may **totoong IP ko** (hindi `172.x`) |

## Ang nakita ko nang hindi inaasahan
Ang unang row ng page 2 ay kapareho ng huling row ng page 1. Ang pagtingin sa page 2 ay gumawa ng bagong row
(`admin_list_audit_logs`), kaya umusog ang lahat nang isa. **Ito mismo ang kahinaan ng offset pagination** na nabasa ko noong Day 47.

## Kumpara sa reference
- Pareho: `actor_id ON DELETE SET NULL`, jsonb metadata, at hindi ibinabagsak ang request kapag pumalya ang audit.
- **Iba — totoong IP.** `req.ip` ang gamit ng reference, na sa likod ng tunnel natin ay IP ng container para sa lahat.
- **Iba — itinatala rin ang maling login at ang 403.** Mahalaga ang mga ito para makita ang pag-atake.
- **Iba — pinuputol ang user agent.** Galing ito sa client at kayang gawing napakahaba.
- **Wala pa sa atin:** pagbura ng lumang rows. Isang taon ang tinatago ng reference (retention job). Nasa backlog natin ito.

## Ang pinakanatutunan
- **Audit log ≠ app logs.**
  - Ang Pino logs (Day 42) ay para sa debugging, at puwedeng mawala.
  - Ang audit log ay nasa database, para sa imbestigasyon at pananagutan ("sino ang gumawa nito?").
- **Hindi binubura ang audit log kahit mabura ang user.** Kaya `SET NULL`, hindi `CASCADE`.
  Ang 4 na row ng production test account ko ay nandoon pa rin, sinadya.
- **Ang bawat bagong database write sa login ay puwedeng makaapekto sa timing.** Kaya sinukat ulit.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit itinatala ang email na tinype sa maling login? Hindi ba personal data iyon?**
  S: Oo, pero kailangan ito para makita ang atake, hal. maraming maling login sa iisang account o maraming email mula sa iisang IP.
  Email lang ito, hindi password: dumaan ito sa Zod, kaya siguradong email format. Kapag bukas na sa totoong users:
  retention (burahin pagkalipas ng panahon) at privacy notice.
- **T: Bakit hindi ibagsak ang request kapag hindi maitala sa audit log?**
  S: Kapag saglit na nagkaproblema ang database, hindi dapat hindi makapag-login ang lahat dahil lang sa talaan.
  Kapalit: may puwang sa talaan. Kaya ERROR ito sa logs, para makita. May mga sistemang mas mahigpit (hal. bangko) na ibinabagsak ang request.
- **T: Kaya bang burahin ng admin ang audit log para itago ang ginawa niya?**
  S: Sa ngayon, walang endpoint para magbura, kaya sa database lang, at may Postgres access lang ang may-ari. Sa mas seryosong sistema,
  ipinapadala ang audit log sa hiwalay na lugar na hindi kayang galawin ng app mismo (append-only).

## Susunod
- Day 49 — admin page sa frontend (users at audit logs), at itago ang admin menu sa hindi admin.
