# Day 84 — 2026-09-27 · Phase 17 · Alerts (Alertmanager → email)

## Ang tanong ng araw
Ang dashboard (Day 82) ay nakakatulong lang kapag **tinitingnan** ko. Ang alert ang **tumatawag sa akin**: kapag may problema, may email, kahit tulog ako o nasa ibang ginagawa.

## Ano ang ginawa
- **5 alert rule** (`devops/monitoring/prometheus/alerts.yml`), sinusuri ng Prometheus bawat 15s:

  | Alert | Kailan | `for:` |
  |---|---|---|
  | `AppDown` | `up == 0` | 1m |
  | `HighErrorRate` | 5xx > 5% | 5m |
  | `HighLatency` | p95 > 1s | 10m |
  | 🔐 `RefreshTokenReuse` | kahit 1 sa 10m | wala (dapat malaman agad) |
  | 🔐 `ManyAccountLockouts` | ≥ 3 sa 15m | wala |

- **Alertmanager v0.28.1** (127.0.0.1:9094): pinagsasama-sama ang mga alert (`group_wait` 30s), nagpapadala ng **FIRING at RESOLVED**,
  at may **inhibit**: kapag `AppDown`, hindi na ipinapadala ang "maraming 5xx" o "mabagal" (iisang problema, iisang email).
- **Email sa pamamagitan ng Resend SMTP**, pareho ng provider at domain ng mga email ng app (Day 58): `alerts@nelson1869.com`.
- **Mga unit test ng rule** (`alerts.test.yml`, promtool, 7 test): pekeng data, walang kailangang tumatakbo.
- **`deploy.sh`:** kasama na ang alertmanager sa step 7, at may **pre-flight** sa simula (tingnan sa ibaba).

## 🔐 Walang secret sa Git, kahit sa gitignored na config
Sa reference, ang `alertmanager.yml` na may totoong password ay gitignored, at may hiwalay na `.example`. Dalawang file na puwedeng magkaiba nang walang nakakapansin.
Dito, **naka-commit ang totoong config**, at ang dalawang bagay na hindi dapat nasa Git ay nasa `devops/.env` (kasama ng password ng Grafana):
- **`ALERT_SMTP_PASSWORD`** (ang Resend key) → isinusulat ng `start.sh` sa isang **tmpfs** file (nasa memory lang), `0600`, ang may-ari ay ang user ng alertmanager.
  Tapos inaalis ito sa environment bago simulan ang alertmanager. Sinuri: wala sa environment ng process, wala sa `/api/v2/status`.
- **`ALERT_EMAIL_TO`** → pinapalitan ang `__ALERT_EMAIL_TO__` sa config.

**Unang sinubukan:** ang `secrets:` ng Docker Compose (ang karaniwang paraan). **Hindi gumana:** hindi sinusunod ng Compose ang `uid`/`mode` sa labas ng swarm,
kaya ang user ng alertmanager (`nobody`) ay hindi mabasa ang file na `0600`. Ang tanging ibang paraan ay gawing `0644`, ibig sabihin kahit sinong user sa PC ay mababasa ito. Hindi.

## Ang totoong pagsubok: pinatay ko ang app (production)
| Oras | Nangyari |
|---|---|
| 0s | `docker compose stop backend` → mula sa internet: **502** |
| +52s | `AppDown` **pending** (pumalya ang scrape; naghihintay ng `for: 1m`) |
| +117s | **firing** |
| +149s | 📧 **naipadala ang email** (pagkalipas ng `group_wait` 30s) |
| +157s | pinaandar ulit → healthy, **200** |
| ~5m pagkatapos ng unang email | 📧 **RESOLVED** (naghihintay ng `group_interval` 5m) |

Mga **2.5 minutong** down ang production, sinadya (iyon ang hinihingi ng roadmap).

## 🐛 Muntik ko nang maling basahin ang resulta
Bago patayin ang app, nagpadala ako ng **pekeng alert** (`Day84SmtpTest`) para subukan muna ang SMTP. Pagkatapos ng pagsubok, naghintay ako ng RESOLVED email,
at dumating ang "email #3" pagkalipas ng 75s. **Pero hindi iyon ang RESOLVED ng AppDown:** ang pekeng alert ay kusang nare-resolve pagkalipas ng 5 minuto,
at ang RESOLVED nito ang dumating (tugma ang oras: ~15:49, samantalang ang sa AppDown ay hindi puwedeng mas maaga sa ~15:52).
Naghintay ako ng **#4**, at dumating ito sa 15:52:59, eksaktong 5 minuto pagkatapos ng FIRING. **Aral:** alisin o isaalang-alang ang sariling mga pagsubok bago bilangin ang resulta.

## Iba pang nahuli
- **Kapag kulang ang `devops/.env`, pati ang backend ay hindi made-deploy.** Binabasa ng Compose ang BUONG file, kaya ang kulang na `ALERT_EMAIL_TO` ay nagpapapalya rin sa `up backend`
  (totoo na ito sa password ng Grafana mula pa Day 82). Hindi nito sinisira ang tumatakbong app, pero sa step 4 pa lang ito lalabas, pagkatapos ng pull at migrate.
  **Ayos:** pre-flight na `docker compose config -q` sa simula ng `deploy.sh`. Sinubukan: kulang → exit 1 "walang ginalaw"; kumpleto → tuloy.
- **Walang log ang Alertmanager kapag nagtagumpay ang email** (debug level lang). Kaya binabasa ang sarili nitong metric (`alertmanager_notifications_total`).
  Para matiyak na makikita ang pagpalya, nagpatakbo ako ng pansamantalang alertmanager na **mali ang password**: may WARN agad na `535` (auth error). Sa totoo: 0 WARN.
- **Naka-on ang "gossip" (HA cluster) bilang default**, hindi kailangan sa iisang instance → pinatay (`--cluster.listen-address=`).

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| promtool: 7 test (timing, threshold, blip, aral ng Day 82) | ✅ SUCCESS |
| Sadyang sira: walang `for:` sa AppDown · lockout ≥ 2 · 5xx > 0.5% | ✅ bumagsak ang tamang test sa bawat isa |
| Pekeng alert → SMTP | ✅ 1 naipadala, 0 pumalya · mali ang password → WARN `535` |
| Pinatay ang backend sa production | ✅ FIRING email (+149s) · RESOLVED email · 0 WARN |
| Mga secret | ✅ tmpfs 0600 `nobody` · wala sa env ng process · wala sa `/api/v2/status` |
| `.http` 29 laban sa totoong stack | ✅ 8/8 (kasama ang gumawa at nagtapos ng silence) |
| 49 diagram | ✅ 49/49 |
| Deploy ng `e59d90e` gamit ang bagong `deploy.sh` | ✅ pre-flight tumuloy · Live · step 7: alertmanager/grafana Running, prometheus na-recreate (bagong flag) at buo pa ang data · **walang maling AppDown** sa pag-restart ng backend (`up` = 1 sa lahat ng sample, 4 na email pa rin) |

## 📧 Ang email sa sarili kong inbox
Ang unang pagsubok ay sa **`delivered+alerts@resend.dev`** (test address ng Resend), dahil hindi nagpapadala ang AI sa totoong address nang walang pahintulot ko.
Pumayag ako ("Gmail ko + ulitin"), kaya pinalitan ang `ALERT_EMAIL_TO` sa `devops/.env` ng Gmail ko, at **pinatay ulit ang backend**:

| Oras (UTC) | Nangyari |
|---|---|
| 16:07:58 | stop backend |
| +29s · +94s | pending · firing |
| **16:10:05** (+127s) | 📧 **FIRING** → Gmail ko |
| +135s | buhay ulit, 200 |
| **16:15:29** | 📧 **RESOLVED** → Gmail ko |

0 WARN, kaya **tinanggap ng Resend ang dalawa**. Ang hindi nakikita ng AI: kung pumasok ba talaga sa inbox ko (o sa Spam).
**☐ Kukumpirmahin ko:** hanapin ang "[FIRING:1] AppDown" at "[RESOLVED] AppDown" mula sa `alerts@nelson1869.com`. Iyan ang checkpoint ng Phase 17 (Day 86).

## Ano ang HINDI kayang makita ng setup na ito
- **Patay ang buong PC o ang Docker:** kasama nitong namamatay ang Prometheus at Alertmanager, kaya **walang email**. Ang pinaka-karaniwang dahilan ng pagka-down
  ng app natin (nakapatay ang PC!) ay hindi mahuhuli.
- **Patay ang tunnel, buhay ang backend:** `up == 1` pa rin, pero hindi maabot ng mga user.
- **Ayos (backlog):** isang bantay sa **labas** ng PC na tumitingin sa `https://api.nelson1869.com/api/health` (hal. isang libreng uptime monitor), o isang "dead man's switch".

## Kumpara sa reference
- **Pareho:** AppDown / HighErrorRate / HighLatency, may `for:`, email na may RESOLVED, memory limit, naka-pin na version.
- **Iba:** walang secret sa kahit anong config file (tmpfs + `.env`), 127.0.0.1 lang (ang sa reference ay `9093:9093`), **may unit test ang mga rule**,
  mga security alert (refresh reuse, lockouts), inhibit, walang gossip, at ang HighErrorRate ay porsiyento (> 5%), hindi "kahit isang 5xx".

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit may `for:`? Hindi ba mas mabuting malaman agad?**
  S: Kapag walang `for:`, isang pumalyang scrape (hal. habang nagde-deploy) ay email na. Kapag madalas ang maling alarma, natututo akong balewalain ang mga email,
  at doon ko mapapalampas ang totoo. May test para rito: ang 30 segundong blip ay hindi dapat mag-alert.
- **T: Bakit walang `for:` ang mga security alert?**
  S: Ang isang `refresh_reuse` ay hindi "blip": ibig sabihin, may gumamit ng lumang token, posibleng ninakaw. Isa lang ay sapat para tumingin ako.
- **T: Ano ang pagkakaiba ng Prometheus at Alertmanager sa alert?**
  S: Ang **Prometheus** ang nagpapasya kung may problema (ang mga rule). Ang **Alertmanager** ang nagpapasya kung **paano at kailan ako sasabihan**:
  pagsasama-sama, hindi pag-uulit bawat 15s, inhibit, silence, at kung saan ipapadala (email ngayon; puwedeng Slack o Telegram sa hinaharap).
- **T: Ano ang silence?**
  S: "Huwag muna akong i-email tungkol dito hanggang sa oras na ito." Para sa planong maintenance: kapag alam kong papatayin ko ang PC nang isang oras,
  gumawa ako ng silence para sa `AppDown`. Nasa `29-alerts.http` #6 ang halimbawa.
- **T: Bakit dumating ang RESOLVED 5 minuto pagkatapos, kahit 8 segundo lang pagkatapos ng FIRING email ay buhay na ulit ang app?**
  S: Ang `group_interval` (5m): hindi nagpapadala ang Alertmanager ng update sa parehong grupo nang mas madalas kaysa rito, para hindi ako bahain ng email
  kapag pabalik-balik ang problema.

## Susunod
- **Day 85 — Graceful shutdown:** tapusin ang mga kasalukuyang request bago mag-exit sa deploy.
