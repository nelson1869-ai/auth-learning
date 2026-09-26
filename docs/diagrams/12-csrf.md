# 12 — CSRF (Cross-Site Request Forgery)

> 📅 Day 44 · Phase 9 (Pangunahing hardening) · **Desisyon:** D-022
> **Code:** `backend/src/middleware/csrf.ts` · `backend/src/app.ts` · cookie: `backend/src/routes/auth.ts` (`COOKIE_OPTIONS`)
> **Subukan:** `backend/http/12-csrf.http` · test: `backend/src/middleware/csrf.test.ts`

## Ang atake

Naka-login ka sa `nelson1869.com` (may cookie). Binuksan mo ang ibang site. Ang site na iyon ay nagpapadala
ng request sa API **gamit ang browser mo**, at kusang isinasama ng browser ang cookie. Kaya CSRF ang tawag:
may "pekeng" request na mukhang galing sa iyo.

```mermaid
sequenceDiagram
    participant V as 👤 Browser ng biktima (naka-login)
    participant E as 😈 Pekeng site
    participant A as API
    V->>E: binisita ang "Libreng load! 🎁"
    E-->>V: page na may nakatagong form → POST /api/auth/logout
    V->>A: POST /api/auth/logout · Origin: pekeng site · (cookie?)
    Note over V,A: Depensa 1 · SameSite=Lax: mula sa IBANG site → HINDI isinama ang cookie
    Note over A: Depensa 4 · Origin check (Day 44): hindi frontend → 403, hindi na binasa ang body
    A-->>V: 403 { error: "Forbidden" }
    Note over V: naka-login pa rin ✅ (sinubukan sa Chromium, Day 44)
```

## Ang apat na depensa, at ang butas na isinara ng Origin check

```mermaid
flowchart TD
    Atk(["Request mula sa pekeng site,<br/>gamit ang browser ng biktima"]) --> Where{"Saan galing?"}
    Where -->|"ibang site<br/>hal. evil.com"| SS["1 · SameSite=Lax cookie<br/>hindi isinasama ang cookie"]
    Where -->|"ibang SUBDOMAIN natin<br/>hal. blog.nelson1869.com (na-hack)"| Same["⚠️ parehong 'site' para sa SameSite<br/>→ ISINASAMA ang cookie"]
    SS --> Blocked1["❌ walang epekto"]
    Same --> Kind{"Anong uri?"}
    Kind -->|"fetch na may JSON"| CORS["3 · CORS preflight<br/>hindi pinapayagan ang origin<br/>→ hindi ipinadala"]
    Kind -->|"HTML form<br/>(text/plain, urlencoded)"| JSONonly["2 · JSON lang ang tinatanggap<br/>→ 400 sa register/login"]
    Kind -->|"HTML form sa /logout<br/>(walang body na kailangan)"| Gap["🕳️ BUTAS bago ang Day 44<br/>tatagos"]
    Gap --> Origin["4 · Origin check (Day 44)<br/>Origin ≠ https://nelson1869.com → 403"]
    CORS --> Blocked2["❌ hinarang"]
    JSONonly --> Blocked2
    Origin --> Blocked2
```

## Mga dapat pansinin

- **Nakakarating sa server ang CSRF request.** Ang CORS ay humaharang lang sa *pagbasa* ng sagot
  at sa mga "hindi simpleng" request (hal. JSON). Ang HTML form ay laging naipapadala.
- **Site vs origin:**
  - **Site** = domain + TLD (`nelson1869.com`). Ito ang tinitingnan ng SameSite.
  - **Origin** = scheme + buong host + port (`https://nelson1869.com`). Ito ang tinitingnan ng Origin check at ng CORS.
  - Kaya ang `blog.nelson1869.com` ay parehong **site**, pero ibang **origin**.
- **Hindi kayang pekein ang `Origin` sa browser.** Kusa itong inilalagay ng browser, at hindi ito mababago ng
  JavaScript. Kaya itong pekein ng curl, pero ang curl ay walang cookie ng biktima, kaya walang CSRF.
- **Walang `Origin` = pinapayagan** (curl, REST Client, tests). Pero kapag may `Sec-Fetch-Site: cross-site`,
  browser iyon kahit walang `Origin` → 403.
- **Karaniwang pagkakamali:** `origin.endsWith('nelson1869.com')`. Papasok diyan ang `blog.nelson1869.com`
  at pati ang `evilnelson1869.com`. Eksaktong paghahambing ang ginagamit natin, at may test para dito.
- **Kaiba sa reference:** double-submit token (`csrf-csrf`) ang gamit ng reference. Bakit Origin check sa amin: D-022.
