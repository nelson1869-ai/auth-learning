# Day 77 — 2026-09-27 · Phase 16 · Mass-assignment guard

## Ang atake
Nagpapadala ang attacker ng **dagdag na field** sa body, umaasang basta ipapasa ng code ang buong body sa database:
- `"role": "admin"` sa register → admin na siya;
- `"userId": 7` sa change-password → napalitan ang password ng **ibang tao**;
- `"device": { "ip": "6.6.6.6" }` sa login → pekeng IP sa "Mga device ko".

## Ang ginawa: mga test, hindi bagong code
Mayroon nang **apat na depensa** mula Day 55 at Day 74–76. Ngayon, **pinatunayan** ang bawat isa:
1. **`parseOr400` (Zod):** tinatanggal ang mga field na wala sa schema.
2. **Pagkakasunod ng spread** sa controller: `{ ...input, userId }`. Ang galing sa server ang nasa huli, kaya ito ang nananalo.
3. **Tahasang pagpili ng field** sa service: `values({ email: input.email, name: input.name, passwordHash })`, hindi `values(input)`.
4. **Reauthentication** (Day 55): kailangan ang kasalukuyang password ng may-ari.

**`routes/mass-assignment.test.ts`** (4 na test) at **`24-mass-assignment.http`**:
- register na may `role`, `emailVerifiedAt`, `failedLoginAttempts: -1000`, `id: 1` → `user`, hindi verified, 0, hindi id 1;
- change-password na may `userId` ng biktima → ang password lang ng attacker ang napalitan;
- login na may `device` sa body → ang totoong IP at browser ang naitala;
- ang `parseOr400` mismo → ang mga field lang ng schema ang ibinabalik.

## Ang pinakamahalagang bahagi: sinira ang mga depensa, isa-isa at magkasama
| Sinira | Resulta |
|---|---|
| **1 lang** (raw na body) | ✅ ligtas pa rin ang lahat ng HTTP test. Bumagsak lang ang unit test ng `parseOr400` |
| **2 lang** (baligtad ang spread) | ✅ ligtas (4/4): tinatanggal ni Zod ang `userId` |
| **1 + 2**, change-password | ❌ napalitan ang password ng biktima (sa test, **parehong password** ang dalawa) |
| **1 + 2**, pero **iba** ang password ng biktima | ✅ **400 "Incorrect password"**: ang reauthentication (4) ang humarang |
| **1 + 3**, register | ❌ **naging admin** ang attacker |
| **1 + 2**, login | ❌ IP ng attacker sa "Mga device ko" |

**Aral: depensa sa lalim.** Walang iisang depensa na sapat kapag nagkamali ang code. Sa bawat kaso, **kailangang magkamali ang dalawang layer** bago magtagumpay ang atake.
Kaya may unit test ang `parseOr400` mismo: kung sisirain ito, walang HTTP test na babagsak (sasaluhin ng ibang layer), pero ang unit test, babagsak.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 4 na bagong test | ✅ pumasa (mayroon na ang mga depensa) |
| Sinira ang mga depensa (tingnan ang table sa itaas) | ✅ bumagsak ang tamang test sa bawat kaso |
| `24-mass-assignment.http` sa bagong server + DB | ✅ 201 201 200 200 204 200 403 · sa DB: `user`, hindi verified, 0, hindi id 1 |
| 24 `.http` (review script, may 24 na) | ✅ 24/24 |
| Walang binagong app code | walang deploy |

## Kumpara sa reference
- **Pareho:** ang test na "ignores a userId smuggled in the change-password body".
- **Dagdag dito:** register (role/verified/lockout/id), login (device), unit test ng `parseOr400`, at ang table ng pagsira na nagpapakita kung aling depensa ang sumasalo sa alin.
- **Isang pagkakaiba sa disenyo ng test:** sa reference, **magkaiba** ang password ng biktima at attacker. Kaya kapag sira ang depensa 1 at 2, ang reauthentication
  ang humaharang (400), at bumabagsak ang test nila dahil sa **status**, hindi dahil napalitan ang password ng biktima. Dito, **pareho** ang password sa test,
  kaya ipinapakita nito ang **tunay na pinsala** kapag bumigay ang 1 at 2. Ang reauthentication ay sinubok nang hiwalay (probe na iba ang password → 400).
  *(Una kong isinulat na pareho ang password sa reference. Mali iyon, at nahuli ko nang basahin ulit ang test nila.)*

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung tinatanggal na ni Zod, bakit kailangan pa ng pagkakasunod ng spread?**
  S: Dahil puwedeng magbago ang schema balang araw (hal. may magdagdag ng `.passthrough()`), o may bagong code na makalimot sa `parseOr400`. Sa table:
  kapag sira ang Zod (1 lang), ang spread at ang service pa rin ang sumasalo.
- **T: Bakit may test na pumapasa kahit sira ang depensa?**
  S: Dahil sinasalo ng ibang layer. Kaya may unit test para sa bawat depensa na sinusubok ito nang mag-isa, hindi lang ang buong request.
- **T: Ano ang pagkakaiba nito sa IDOR (Day 54)?**
  S: Sa IDOR, ang id ay nasa URL (`/sessions/:id`), at ang ayos ay i-scope ang query sa naka-login na user. Sa mass assignment, ang id ay nasa body,
  at ang ayos ay huwag itong tanggapin: laging mula sa login token.

## Susunod
- **Day 78 — API documentation:** OpenAPI + Swagger UI mula sa parehong Zod schemas, at mga type ng frontend mula sa spec.
