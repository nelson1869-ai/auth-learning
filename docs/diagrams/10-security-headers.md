# 10 — Security headers (helmet + CSP)

> 📅 Day 39 · Phase 9 (Pangunahing hardening) · **Code:** `backend/src/app.ts` (`helmet()`) ·
> `frontend/public/_headers` · test: `backend/src/routes/security.test.ts`
> **Subukan:** `backend/http/09-security-headers.http` · `backend/http/prod/01-production.http` (#7–8)

## Saan galing ang bawat header

Dalawang magkaibang server, kaya dalawang magkaibang lugar ng headers:

```mermaid
flowchart LR
    Browser(["🌐 Browser"])
    subgraph Pages["Cloudflare Pages · nelson1869.com"]
        H["frontend/public/_headers<br/>CSP · X-Frame-Options: DENY ·<br/>nosniff · Referrer-Policy ·<br/>Permissions-Policy"]
    end
    subgraph API["Backend · api.nelson1869.com"]
        Helmet["app.use(helmet())<br/>backend/src/app.ts<br/>UNA sa lahat ng middleware"]
        Cors["cors() → express.json() →<br/>cookieParser() → routes"]
        Helmet --> Cors
    end
    Browser -->|"GET /login (HTML, JS)"| H
    Browser -->|"fetch /api/... (JSON)"| Helmet
```

- **Ang frontend ang may mahalagang CSP.** Doon tumatakbo ang JavaScript, kaya doon
  may silbi ang "anong script ang puwedeng tumakbo".
- **Sa API, helmet ang bahala.** Nagdadagdag ito ng HSTS, nosniff, CSP at iba pa, at
  **inaalis ang `X-Powered-By: Express`** (hindi na alam ng attacker kung anong server
  ang gamit namin).
- **Nauuna ang `helmet()`** para may headers kahit ang mga sagot na hindi umaabot sa
  route (hal. 404, 429).

## Anong atake ang hinaharang ng bawat header

```mermaid
flowchart TD
    CSP["Content-Security-Policy<br/>script-src 'self'"] -->|"hinaharang"| XSS["XSS: script na naipasok<br/>ng attacker sa page"]
    XFO["X-Frame-Options: DENY<br/>frame-ancestors 'none'"] -->|"hinaharang"| Click["Clickjacking: site namin<br/>sa loob ng invisible na iframe"]
    NS["X-Content-Type-Options:<br/>nosniff"] -->|"hinaharang"| Sniff["MIME sniffing: text file<br/>na pinatakbo bilang script"]
    HSTS["Strict-Transport-Security<br/>(helmet, API)"] -->|"hinaharang"| Down["Downgrade sa http://<br/>(password na hindi encrypted)"]
    RP["Referrer-Policy"] -->|"binabawasan"| Leak["Buong URL na naipapasa<br/>sa ibang site"]
    PP["Permissions-Policy"] -->|"pinapatay"| Dev["camera · mic · lokasyon<br/>(hindi kailangan ng app)"]
```

## Kapag may naipasok na script (sinubukan, Day 39)

```mermaid
sequenceDiagram
    participant A as 😈 Attacker
    participant P as Page (nelson1869.com)
    participant B as Browser
    A->>P: naipasok ang inline script (hal. XSS bug)
    P->>B: ipinapatakbo ang inline script
    B->>B: CSP script-src 'self' — inline ito, hindi galing sa sariling file
    B--xP: ❌ HINDI pinatakbo · console: "violates the following CSP directive"
    Note over B: Ang sariling /assets/index-*.js ay tumatakbo nang normal
```

## Mga dapat pansinin

- **Walang `'unsafe-inline'` sa `script-src`.** Walang inline script ang Vite build,
  kaya hindi ito kailangan. Kapag idinagdag ito, wala nang silbi ang CSP laban sa XSS.
- **`connect-src`** ang listahan ng mga puwedeng tawagan ng `fetch`: sarili, ang API,
  at ang Cloudflare Web Analytics.
- **Nahuli ng production ang hindi nakita sa preview:** sinisingit ng Cloudflare ang
  Web Analytics beacon (`static.cloudflareinsights.com`) sa custom domain lang. Hinarang
  ito ng CSP, kaya **eksaktong host lang** ang idinagdag (PR #53), hindi ang buong `https:`.
- **Ang reference** (`server/src/app.ts`) ay may `helmet()` rin, at may hiwalay na
  mas maluwag na CSP para sa `/api-docs` (kailangan ng Swagger UI ang inline scripts).
  Wala pa kaming Swagger, kaya hindi pa kailangan iyon.
