# Day 54 — 2026-09-27 · Phase 11 · Mga device ko (sessions) at IDOR

## Ano ang ginawa
- **`refresh_tokens` + `user_agent` at `ip`** (migration `0006`). Isinusulat ang mga ito sa login at sa bawat rotation,
  kaya ang pinakabagong token ng family ang nagsasabi ng huling gamit.
- **`GET /api/auth/sessions`**: isang entry bawat login (family): device, IP, kailan nag-login (`since`), huling gamit,
  at `current` (ang device na nagtatanong).
- **`DELETE /api/auth/sessions/:id`**: i-logout ang isang device. 🔐 **IDOR-safe**:
  - nasa `WHERE` mismo ang `user_id` ng naka-login;
  - ang session ng ibang user, ang id na wala, at ang hindi UUID → **iisang 404**;
  - may audit row na `session_revoked`.
- **Frontend `/sessions`** ("📱 Mga device ko" sa Profile): pangalan ng device (hal. "Safari sa iPhone"), badge na "ito ang device mo", at Logout bawat isa.
- **Tests: 102** (8 bago).

## Ano ang IDOR
**Insecure Direct Object Reference:** ang id ng bagay ay nasa URL (`/sessions/<id>`), kaya kayang palitan ng kahit sino.
Hindi sapat na "naka-login ka"; kailangang **iyo ang bagay**. Kung wala ang `user_id` sa `WHERE`, kayang i-logout ni Bob si Alice.
At **404, hindi 403**: ang 403 ay nagsasabing "totoo ang id, pero hindi sa iyo".

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | walang `user_id` sa WHERE (ang IDOR bug) · walang UUID check · hindi ina-update ang device sa rotation | ✅ bumagsak ang bawat isa |
| Dev, browser | iPhone at Windows na context; i-logout ang laptop mula sa phone | ✅ "Safari sa iPhone/iPad [ito]" · "Chrome sa Windows" · laptop → `/login` pagkatapos mag-expire ang access token |
| Dev | `17-sessions.http` | ✅ 200 · 404 ×3 (PASTE, wala, hindi UUID) · 401 |
| Production, browser | Alice (2 device) + **Bob na umaatake** | ✅ Bob → **404** · 2 device pa rin si Alice · na-logout ang laptop · 0 CSP violation · 7 migrations |

## Kumpara sa reference
- Pareho: family bilang id ng session, IDOR-scoped na pagbawi, at 404 sa session ng iba.
- **Iba:** may device at IP bawat session. Id at mga petsa lang ang sa reference, kaya hindi makikilala ng user kung aling device.
- **Iba:** UUID check bago ang database.

## Ang pinakanatutunan
- **Laging itanong: "sa kanya ba ito?"** Hindi lang "naka-login ba siya?". Nasa `WHERE` ang bantay, hindi sa hiwalay na `if`.
- **Iisang sagot para sa "wala" at "hindi sa iyo".** Walang impormasyon para sa attacker.
- **Hindi agad nala-logout ang device.** Gagana pa ang access token nang ≤ 15 minuto (stateless, Day 53).

## Mga tanong ko pa / hindi pa malinaw

**Sarili kong tanong (2026-09-27, sinubukan ko sa production):** *"Naka-login ako sa phone, pero sa PC ay 'Chrome sa Windows' lang ang lumalabas. Nasaan ang phone?"*
Magkaibang **account** pala: sa PC ay `nel…@gmail.com` (admin #7), at sa phone ay `phone@gmail.com` (user #1). Kinumpirma sa database.
Ang "Mga device ko" ay mga device ng **account na ito**, hindi ng tao. Hindi alam ng server na iisa ang may-ari ng dalawang account.
Kung lalabas ang phone ng ibang account sa listahan ko, **IDOR bug** iyon. Para makita ang dalawa, dapat iisang account ang naka-login
sa dalawang device. (Muntik pang mag-login ulit ang phone sa lumang account dahil sa autofill ng Chrome.)


> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung UUID ang id (mahirap hulaan), kailangan pa ba ng IDOR check?**
  S: Oo. Nalalaman ang id sa ibang paraan: logs, screenshot, kasamahan sa trabaho, o ibang endpoint. "Security through obscurity" ang pag-asa sa hirap hulaan.
  Ang tunay na bantay: `user_id` sa `WHERE`.
- **T: Bakit may IP ng device? Hindi ba personal data iyon?**
  S: Oo, pero para ito sa **sariling** user, para makilala niya kung may hindi kilalang device (hal. IP mula sa ibang bansa).
  Kapag bukas na sa lahat: dapat nakasulat sa privacy notice, at nabubura kasama ng lumang sessions (retention).
- **T: Paano kung ang magnanakaw ang nag-logout sa device ko?**
  S: Kaya niya kung may session siya. Pero kapag napansin ko ang hindi kilalang device, ila-logout ko ito at **papalitan ang password**:
  iyan ang Day 55, na nagla-logout ng LAHAT ng session.

## Susunod
- Day 55 — change password: kailangan ang kasalukuyang password, at binabawi ang LAHAT ng session.
