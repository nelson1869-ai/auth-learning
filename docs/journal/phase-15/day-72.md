# Day 72 — 2026-09-27 · Phase 15 · Pareho ang oras (timing attack)

## Ang tanong
Pareho na ang sagot mula Day 71. Pero kung **mas mabilis** ang sagot para sa email na walang account, iyon mismo ang magsasabi kung sino ang may account.
Ito ang **timing attack**: hindi ang laman ng sagot ang binabasa, kundi ang tagal nito.

May `DUMMY_HASH` na mula Day 15 (laging may isang `argon2.verify`, may account man o wala). Pero marami nang nadagdag sa login mula noon:
lockout (Day 63), device cookies (Day 64), atomic na bilang (Day 67), transaction (Day 68), at bilang para sa walang account (Day 71). Kaya **sinukat ulit**.

## Ano ang ginawa
1. **Sinuri ang argon2 settings:** ang dummy at lahat ng totoong password (dev at production) ay `argon2id m=65536, t=3, p=4`.
   Kung mas magaan ang dummy (hal. mas mababang `m`), mas mabilis ang walang account, kahit may dummy.
2. **`npm run timing:login`** (`backend/src/scripts/login-timing.ts`, dev lang):
   - **salitan** ang may account at wala, at **palit ang nauuna bawat round** (para walang panig na laging nakikinabang sa mainit na cache);
   - **ibinabalik sa 0 ang mga bilang** bawat 4 na subok, sa labas ng sinusukat na oras, para walang umabot sa 423 (na walang argon2, kaya iba ang tagal);
   - **tinitiyak na 401 ang bawat sagot** (precondition, aral ng reference: minsan, sinukat nila ang account na hindi pala nagawa);
   - tumatanggi kung hindi `localhost` ang URL o ang database.

## Resulta
| | Takbo 1 | Takbo 2 | Takbo 3 |
|---|---|---|---|
| May account (median, n=80) | 109.4 ms | 103.9 ms | 101.3 ms |
| Walang account (median, n=80) | 109.5 ms | 103.0 ms | 101.8 ms |
| **Pagkakaiba** | **−0.0 ms** | **+0.9 ms** | **−0.4 ms** |

**Nakikita ba talaga ng pagsukat ang pagkakaiba?** Sinira ko nang sadya (walang dummy argon2 para sa walang account):
**47 ms vs 103 ms, pagkakaiba 56 ms.** Kaya totoo ang "±1 ms", hindi lang dahil hindi kayang makakita ng script. Naibalik gamit ang `trap`.

**Forgot-password** (20 bawat panig, salitan): 1.2 vs 1.3 ms. Sumasagot muna, saka ang lahat sa background (Day 59).

## Bakit halos pareho na
Pareho na ang ginagawa ng dalawang daan: isang SELECT ng user, **isang database write** (UPDATE ng bilang ng account, o upsert ng bilang ng walang account),
isang `argon2.verify`, at isang audit. Mula Day 63 hanggang Day 70, ang totoong account lang ang may UPDATE. Isang dagdag na query iyon (hindi nasukat noon).
Ang Day 71 ay nagpantay din sa ORAS, hindi lang sa sagot.

## Mga limitasyon (tapat)
- **Sa dev lang sinukat**, sa iisang PC. Sa production, mas maingay ang internet (Cloudflare, tunnel), kaya mas mahirap pa sa attacker. Pero hindi ko sinukat doon:
  10 palpak lang bawat IP bawat 15 minuto, at sa IP mo rin iyon.
- **Ang ±1 ms ay hindi "zero".** Sa napakaraming sukat, baka makakita ang attacker ng maliit na pagkakaiba. Ang IP rate limit at ang lockout ang naglilimita
  sa dami ng sukat na makukuha niya.
- **Ang register ay 409 pa rin** (Day 71). Hindi na kailangan ng timing doon para malaman kung may account.

## Kumpara sa reference
- **Pareho:** dummy hash, sinukat nang salitan sa dev server (sila: median 110 vs 100 ms, "overlapping ranges").
- **Dagdag dito:** sinuri ang argon2 settings ng dummy laban sa totoong mga hash, may sadyang sira para patunayang nakakakita ang pagsukat, at may script na magagamit ulit.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano masusukat ng attacker ang ilang millisecond sa internet?**
  S: Sa maraming sukat at estadistika. Isang sukat ay maingay, pero 1000 sukat ay nagpapakita ng median. Kaya mahalaga ang malaking pagkakaiba (hal. 56 ms
  kung walang dummy): madaling makita. Ang ±1 ms ay natatabunan ng ingay ng internet, lalo na't 10 palpak lang bawat IP.
- **T: Bakit "salitan" at "palit ang nauuna"?**
  S: Kapag lahat ng "may account" muna, tapos lahat ng "wala", puwedeng magbago ang kalagayan ng PC sa gitna (hal. uminit ang cache o may ibang proseso).
  Kapag salitan, pareho ang kalagayan para sa dalawa.
- **T: Bakit may sadyang sira pa?**
  S: Ang "walang pagkakaiba" ay puwedeng mangahulugang "hindi kayang makita ng pagsukat". Nang alisin ang dummy at lumabas ang 56 ms, napatunayang kaya nitong makakita.

## Susunod
- **Day 73 — Review day** ng Phase 15 (walang checkpoint question sa roadmap ang Phase 15, pero susulat ako ng buod).
