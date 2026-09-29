# Day 90 — 2026-09-29 · Phase 18 · Data retention

## Ang tanong ng araw
Walang binubura ang app. Bawat login, bawat maling password, bawat expired na link ay nananatili sa database magpakailanman.
Gaano karami na, at alin ang ligtas burahin?

## Sinukat muna (production, `SELECT count(*)` lang)
| Table | Bilang |
|---|---|
| users | 1 |
| audit_logs | 167 (pinakaluma: 2026-09-26) |
| refresh_tokens | 7 (0 sa family na expired na lahat) |
| verification_tokens | 2, **parehong expired** |
| trusted_devices | 0 |
| unknown_login_attempts | 2 (0 idle nang 30+ araw) |
| Laki ng database | 8MB |

**Hindi pa ito problema sa laki.** Ang dahilan ng retention ay (1) **may hangganan** ang paglaki, at (2) **hindi itinatago ang personal na data nang walang dahilan**:
may IP at user agent ang `audit_logs`, at bakas ng mga sinubukang email ang `unknown_login_attempts`.

## Ang mga patakaran (D-032)
| Table | Kailan buburahin | Bakit |
|---|---|---|
| `refresh_tokens` | **buong family**, kapag expired na ang **lahat** | hinahanap ng reuse detection (Day 52) ang **revoked** na token ng buhay na family |
| `verification_tokens` | expired na | walang silbi ang expired na link |
| `trusted_devices` | expired na | |
| `unknown_login_attempts` | idle **30+ araw** at **hindi naka-lock** | hindi mabubura ang lock ng umaatake dahil lang sa paghihintay |
| `audit_logs` | mahigit **1 taon** | **desisyon ko** (mula sa 90 araw / 1 taon / 2 taon / huwag burahin) |

### Bakit "buong family" at hindi bawat token
Sinuri ko muna ang `lib/session.ts`: ang reuse detection ay naghahanap ng token ayon sa hash, at kapag **revoked** na ito, binabawi ang buong family.
Kapag binura ko ang lumang revoked na token habang buhay pa ang family, ang **ninakaw** na token ay magiging "invalid" na lang, at **hindi na mababawi ang family**.
May test na mismong nagre-replay ng ganoong token pagkatapos ng cleanup.

## Ano ang ginawa
- **`services/retention.service.ts`:** iisang transaction, binabantayan ng **`pg_try_advisory_xact_lock`**: kapag dalawang instance, isa lang ang naglilinis
  (ang isa: `skipped`). Nakatali ang lock sa transaction, kaya kusang binibitawan kahit mamatay ang process.
- **`jobs/retentionScheduler.ts`:** 60s pagka-start, tapos bawat oras, sa pamamagitan ng `runInBackground`. **Sa shutdown (Day 85):** una, ihinto ang timer;
  pangalawa, hintayin ang takbong nasa kalagitnaan; saka isara ang database.
- **Nakikita:** log (`retention_done` na may bilang bawat table), **Prometheus** (`auth_retention_deleted_total{table}`, `auth_retention_runs_total{status}`,
  nagsisimula sa 0 — aral ng Day 82), at **2 panel sa Grafana**.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 10 test (totoong test database) | ✅ 10/10 |
| Sadyang sira: per-token sa halip na per-family | ✅ 2 test ang bumagsak, kasama ang **replay na hindi na nahuli bilang "reused"** |
| Sadyang sira: binubura kahit naka-lock · 363 araw · hindi pinapansin ang lock · hindi hinihinto ng `stop()` ang interval · walang 0 na initialization | ✅ bumagsak ang tamang test sa bawat isa |
| Lock test | ✅ deterministiko: **hinahawakan ng test ang lock** sa ibang koneksyon (ang dalawang sabay na takbo ay kadalasang hindi nagsasabay) |
| Totoong dev server, may nakahandang lumang data | ✅ unang takbo sa +60s: binura ang expired na device, ang idle na counter, ang 400-araw na audit log · **nanatili ang naka-lock** · sa SIGTERM: "retention timer" → "background tasks" → "database pool" |
| Buong suite · tsc · lint (knip) | ✅ 214 · ✅ · ✅ (nahuli ng knip ang 2 hindi ginagamit na export) |
| `.http` 34 · 51 diagram | ✅ · ✅ 51/51 |

## 🐛 Mga nahuli ko sa sarili ko
- **Isang maling PromQL sa `.http`** (`timestamp(changes(…) > 0)`): nagbabalik ito ng oras ng **pagsusuri**, hindi ng huling takbo. Pinalitan ng tamang tanong
  ("ilang matagumpay na takbo sa huling 2 oras?").
- **Dalawang maling hula tungkol sa code:** ang `hashToken` ay nasa `lib/session.ts` (hindi `lib/tokens.ts` gaya ng reference), at ang status ay `'rotated'`
  (hindi `'ok'`). Parehong nahuli ng test at tsc, hindi umabot kahit saan.
- **Isang "tinanggap na residual" na kinopya ko mula sa reference, sinuri muna:** ang bilang ng maling login ng totoong account (`users`) ay hindi nag-e-expire,
  kaya pagkalipas ng 30 araw, iba ang kilos ng totoong account kaysa sa email na walang account. **Totoo rin dito** (walang pagbaba sa `loginLockout.ts`). Nakatala.

## 🔍 Isang natuklasan tungkol sa Day 89
Nang idagdag ko ang 2 panel sa dashboard, **agad itong lumabas sa production Grafana**, bago pa mag-merge. Ang `devops/monitoring/` ay naka-**bind mount**
mula sa working copy, at kusang nagre-reload ang Grafana (bawat ~10s). Ang bantay (b) ng Day 89 ay sa oras lang ng **deploy**.
Kaya ang pagpalit ng branch sa PC ay nagbabago agad ng dashboard (at ng alert rules, sa susunod na restart ng Prometheus). Maliit ang panganib (monitoring lang,
hindi ang app), pero dapat malaman. Backlog: kopyahin ang monitoring config sa oras ng deploy, sa halip na bind mount ng working copy.

## Production
*(Pupunan pagkatapos ng deploy: ang unang takbo, ang metrics, ang dashboard.)*

## Kumpara sa reference
- **Pareho:** sa loob ng app, bawat oras, 60s ang unang takbo, `runInBackground`, `pg_try_advisory_xact_lock`, buong family ng refresh token, audit logs 1 taon,
  lock test na hinahawakan ang lock.
- **Iba:** **Prometheus metrics at Grafana panels** (ang reference: log lang); `stop()` na ibinabalik ng scheduler at ginagamit ng shutdown;
  test na **nagre-replay** ng token pagkatapos ng cleanup.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang advisory lock?**
  S: Isang "hawak" sa Postgres na walang kinalaman sa isang table: isang numero lang (90001) na napagkasunduan ng code. Kapag hawak ito ng isa,
  ang `pg_try_advisory_xact_lock` ng iba ay agad sumasagot ng `false`, hindi naghihintay. Kaya kahit maraming instance ng app, isa lang ang naglilinis.
- **T: Bakit hindi na lang burahin ang lahat ng expired?**
  S: Dahil may data na "expired" pero may silbi pa: ang revoked na refresh token ay patunay na ninakaw ang token kapag ginamit ulit, at ang naka-lock na counter
  ay proteksyon laban sa nanghuhula ng password. Ang patakaran ay "kailan WALA nang silbi", hindi lang "kailan expired".
- **T: Bakit 1 taon ang audit logs?**
  S: Madalas natutuklasan ang insidente pagkalipas ng ilang buwan. Kapag 90 araw lang, baka wala nang bakas. Kapag magpakailanman, lumalaki nang walang hangganan
  ang personal na data (IP, user agent). Ang 1 taon ay karaniwang gitna.
- **T: Bakit may metrics pa kung may log naman?**
  S: Dahil walang tumitingin sa log araw-araw. Sa Prometheus, makikita kung **tumigil** ang paglilinis (0 takbo sa huling 2 oras) o kung pumapalya ito.
  Puwede itong gawing alert sa hinaharap.

## Susunod
- **Day 91 — Backup drill:** sadyang "sirain" ang isang staging database, i-restore mula sa backup, at orasan ito (RPO/RTO).
