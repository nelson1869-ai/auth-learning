# Day 91 — 2026-09-29 · Phase 18 · Backup drill (RPO/RTO)

## Ang tanong ng araw
Kapag nabura ang data, **gaano karami ang mawawala** (RPO), at **gaano katagal bago bumalik** (RTO)? Hindi puwedeng hulaan: kailangang subukan.

## Sinukat muna: ano ang backup natin?
| | Nasa atin ba? |
|---|---|
| Point-in-time restore ng **Neon** | ✅ pero **6 na ORAS lang** (Free plan), at nasa **iisang account** (nasubukan noong Day 35) |
| Sariling backup sa labas ng Neon | ❌ **wala**. Planado ang `database/backups/`, pero walang laman |

**Ang panganib:** kapag napansin ang isang maling pagbura pagkalipas ng 6 na oras (hal. isang bug sa retention job na kagagawa lang natin sa Day 90),
o nagkaproblema ang Neon account, **walang maibabalik**.

## Ano ang ginawa (D-033)
1. **`database/backups/backup.sh`:** `pg_dump` ng production (sa `postgres:17-alpine`, parehong version ng Neon, TLS `verify-full`) papunta sa
   `~/backups/auth-learning` (**hindi sa repo**, 700/600). Kasama: **`.counts`** (bilang ng row bawat table) at **`.sha256`**. 14 ang itinatago.
2. **Kusang tumatakbo sa dalawang sandali:**
   - **bago mag-migrate sa bawat deploy** (bantay **e** ng `deploy.sh`). Kapag pumalya ang backup, hindi magmi-migrate. Ito ang pinakamapanganib na hakbang ng deploy, kaya RPO = 0 para rito.
   - **araw-araw, 03:00** — systemd user timer (pinayagan ko, pati ang `enable-linger`). Mga unit file nasa repo; `install.sh` ang nag-uugnay.
3. **`restore-drill.sh`:** pansamantalang **staging** Postgres → checksum → restore → ikumpara ang bilang ng bawat table → ang **production image** laban dito
   → **💥 `DROP SCHEMA public CASCADE`** → restore ulit → **orasan**. Hindi ginagalaw ang production.
4. **`restore-drill-neon.sh`:** parehong drill, pero sa isang **Neon branch** (ang totoong landas ng production). **Tumatanggi kapag ang target ay ang production.**

## Ang drill (lokal)
| Hakbang | Resulta |
|---|---|
| checksum | ✅ |
| restore #1 | ✅ 0.5s · bilang ng row: tugma (7 table) |
| production image sa staging | ✅ ready 200 · `/api/users/count` = `{"count":1}` |
| 💥 `DROP SCHEMA public CASCADE` | `/api/users/count` → **500** · **pero `/api/health/ready` → 200 pa rin!** |
| restore #2 | ✅ **0.7s** · bilang ng row: tugma |
| mula sa sira hanggang tama ulit ang sagot ng app | ⏱️ **0.9s** |

### 🔍 "Ready" kahit walang table
`SELECT 1` lang ang `/api/health/ready`. Pinapatunayan nito na **naaabot** ang database, hindi na **may laman** ito.
Hindi ko ito binago: ang bantay (d) ng deploy (Day 89) na ang sumusuri ng schema bago mag-restart. Pero **hindi alarma ng nawawalang data ang "ready"**.

## RPO at RTO (tapat)
| | Resulta |
|---|---|
| **RPO** | Neon: segundo, **kung** napansin sa loob ng 6 na oras · sariling dump: **hanggang 24 oras** · kapag migration ang sanhi: **0** (backup bago mag-migrate) |
| **RTO (lokal)** | **0.7s** na restore — pero napakaliit pa ng database (8MB, 1 user) |
| **RTO (production)** | **☐ hindi pa nasusukat.** Ang totoo: restore **papunta sa Neon** (sa internet) + palitan ang `DATABASE_URL` + deploy. Naghihintay ang `restore-drill-neon.sh` ng staging branch |

## 🐛 Mga nahuli
- **Walang laman ang `.counts` sa unang takbo (0 table).** Sa loob ng `sh -c`, ang `$$` ay **process ID** (1), hindi SQL na quote, kaya naging `1public1` ang query.
  Ayos: iisang SQL query, ipinapasa bilang env var.
- **`644` ang unang dump, hindi `600`.** Hindi umaabot sa container ang `umask` ng PC. May personal na data ang file na iyon. Ayos: `umask 077` sa loob ng container.
- **Dalawang beses kong sinabing tapos na, pero wala ang file sa `database/backups/.env.staging`** (hindi alam ng AI kung nagawa ang branch sa Neon). Ang una ay may `…` sa path ng `chmod`, na hindi totoong path.
  Ang pangalawa ay buo na, pero wala pa rin ang file. Posibleng pinatakbo sa PowerShell (iba ang `~` doon), hindi sa WSL. **Naiwang hindi tapos ang Neon drill.**

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| `backup.sh` | ✅ 7 table · 600 · checksum OK |
| `restore-drill.sh` (dalawang beses) | ✅ 0.9s at 1.0s mula sa sira hanggang tama |
| `restore-drill-neon.sh` na ang target ay ang **production** | ✅ tumanggi bago gumawa ng kahit ano |
| systemd timer | ✅ naka-install, linger = yes, **isang takbo sa loob ng systemd: OK** (10s) |
| `.http` 35 (laban sa staging na `KEEP_STAGING=1`) | ✅ 200 · `{"count":1}` |
| 53 diagram | ✅ 53/53 |

## Kumpara sa reference
Walang sariling backup o restore drill ang reference (umaasa rin sa backup ng database provider). Lahat ng ito ay bago.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang RPO at RTO?**
  S: **RPO:** gaano karaming data ang puwede kong mawala, ibig sabihin gaano kaluma ang huling backup. Kapag araw-araw ang backup, hanggang 24 oras ng data.
  **RTO:** gaano katagal bago bumalik ang serbisyo pagkatapos ng sakuna. Magkaiba sila: puwedeng mabilis ang pagbalik pero maraming nawala, o kabaligtaran.
- **T: Bakit may sariling backup pa kung may backup na ang Neon?**
  S: Dahil 6 na oras lang ito, at nasa parehong account. Ang maraming problema ay napapansin pagkalipas ng ilang araw. At "huwag ilagay ang lahat sa iisang basket":
  kapag nawala ang account, kasama ang backup.
- **T: Bakit backup bago mag-migrate?**
  S: Ang migration ang pinakamapanganib na bahagi ng deploy: puwede itong magbura o magbago ng data. Kapag may kopya mula mismo bago nito, walang data na mawawala kung may mali.
- **T: Bakit kailangan ang drill? Hindi ba sapat na may backup?**
  S: Ang backup na hindi pa nasusubukang i-restore ay pag-asa lang. Ngayong araw, dalawang bug sa backup script ang nahuli bago pa ito kinailangan
  (walang laman ang `.counts`, maluwag ang permission). Kung sa totoong sakuna ko ito natuklasan, huli na.

## Susunod
- **☐ Neon drill:** gawin ang `database/backups/.env.staging` (sa **WSL** na terminal), tapos `database/backups/restore-drill-neon.sh`.
- **Day 91b — Load balancing:** 2 backend container + Caddy.
