# Day 61 — 2026-09-27 · Phase 12 · Mga page sa frontend para sa email

## Ano ang ginawa
Dati, ang link sa email ay papunta sa page na **wala pa**. Ngayon, may mga page na:
- **`/forgot-password`** (may link na "Nakalimutan ang password?" sa Login): email → **laging** "Kung may account ang email na iyon…",
  gaya ng sagot ng backend (hindi malalaman kung sino ang may account).
- **`/reset-password#token=…`**: form ng bagong password. Kapag tapos na: "Na-logout ang lahat ng device" → Login.
- **`/verify-email#token=…`**: may **button na "Kumpirmahin ang email"**, hindi kusang nagve-verify pagbukas ng page.
- **Profile:** dilaw na paalala na **"⚠️ Hindi pa verified ang email mo"** na may button na **"Ipadala ulit ang link"**
  (409 = verified na pala, hal. na-verify sa phone habang bukas ang page sa PC). Soft (D-026): paalala lang, walang hinaharangan.
- **`hooks/useHashToken.ts`:** binabasa ang token mula sa `#`, at **tinatanggal agad sa address bar**.

## Ang bug na nahanap ng browser test
Binuksan ko ang lumang link (error, tama), tapos binuksan ko ang bagong link **sa parehong tab**. **Nandoon pa rin ang lumang error**, at nasa address bar pa ang token.
Bakit: `#` lang ang nagbago, kaya **walang reload**, at hindi binabasa ulit ng React ang token.
Ayos: binabantayan ng `useHashToken` ang `hashchange`, at may `key={token}` ang form, kaya bagong form (malinis na state) sa bawat bagong link.
Pinatunayan: tinanggal ko ang listener → bumagsak ang test sa mismong hakbang na iyon. Ibinalik → pasado.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Frontend | lint · typecheck · build | ✅ |
| Dev (Playwright, 15 check) | register → banner · resend → bagong link · lumang link → error · walang `#` sa URL · verify → wala na ang banner · forgot (may account at wala: parehong mensahe) · maikling password → error · bagong password → login · gamit na ang link → error · page na walang token | ✅ 15/15 |
| Sadyang sinira | walang `hashchange` listener | ✅ bumagsak |
| Linis | 5 test account sa dev, binura ayon sa id | ✅ admin lang ang natira |

## Kumpara sa reference
- **Walang frontend ang reference** (`CLIENT_URL` ay placeholder lang). Ang link sa email nito ay papunta sa page na wala.
  Dito, gumagana ang buong daloy mula sa email hanggang sa browser.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit may button pa sa verify? Hindi ba mas madali kung kusa na?**
  S: Dalawang dahilan. (1) Sa dev, dalawang beses tumatakbo ang `useEffect` (StrictMode). Ang una ang gagamit sa token, kaya 400 ang pangalawa, at puwedeng error ang makita ko kahit na-verify na.
  (2) May mga email scanner (lalo na sa trabaho) na **binubuksan ang lahat ng link** para suriin. Kung kusa, ang scanner ang magve-verify, hindi ako. Isang click lang naman ang dagdag.
- **T: Bakit tinatanggal ang token sa address bar?**
  S: Para hindi ito maiwan sa history ng browser, sa screenshot, o sa kopya ng URL na ipapadala ko sa iba. Parang susi ang token: isang oras, kaya ng kahit sinong may hawak nito na palitan ang password ko.
  Kaya rin **hindi dapat i-paste ang buong link sa chat** (nagawa ko iyon noong Day 59, at kinailangang patayin ang token sa database).
- **T: Kung wala sa address bar, paano kung i-refresh ko ang page?**
  S: Mawawala ang token, at "Walang reset link" ang lalabas. Ayos lang: buksan ulit ang link mula sa email (gagana pa kung hindi pa nagamit), o humingi ng bago.
- **T: Ano ang `key` sa React?**
  S: Pagkakakilanlan ng component. Kapag nagbago ang `key`, **tinatapon ng React ang lumang component at gumagawa ng bago**, kasama ang lahat ng state nito.
  Kaya kapag bagong token, nawawala ang lumang error nang hindi ko kailangang burahin isa-isa.

## Susunod
- Sa production (pagka-deploy): ive-verify ko ang admin email ko gamit ang totoong page. **Buksan lang ang link, huwag i-paste.**
- Day 62 — Review day at ang checkpoint ng Phase 12 (`checkpoint-phase-12`).
