# 29 — Login gamit ang passkey (WebAuthn authentication ceremony) at ang decoy

> 📅 Day 97–98 · Phase 19 (Passkeys) · **Desisyon:** D-038
> **Code:** `backend/src/services/auth/passkey.service.ts` (`startPasskeyLogin`, `finishPasskeyLogin`) · `lib/webauthn.ts` (challenge, `decoyCredentialId`) · `controllers/passkey.controller.ts`
> · frontend: `src/pages/LoginPage.tsx` · `src/api/auth.ts` (`loginWithPasskey`)
> **Subukan:** `backend/http/39-passkey-login.http` · test: `backend/src/routes/passkey-login.test.ts` · **Bago ito:** `28-passkey-register.md`

## Ang buong flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend (LoginPage)
    participant B as Browser + Device
    participant A as API
    participant D as Postgres
    U->>F: "🪪 Mag-login gamit ang passkey" (email: opsyonal)
    F->>A: POST /api/auth/passkeys/login/options { email? }
    alt walang email
        A->>A: allowCredentials = [] — ang DEVICE ang pipili ng account
    else may email
        A->>D: mga passkey ng email na ito
        alt may passkey
            A->>A: allowCredentials = ang mga credential id (walang transports)
        else walang account, o walang passkey
            A->>A: 🔐 DECOY: isang pekeng id = HMAC(sikreto, email)<br/>pareho sa bawat hingi
        end
    end
    A->>D: webauthn_challenges: INSERT (walang user · 5 minuto)
    A-->>F: 200 options { challenge, rpId, allowCredentials, userVerification }
    F->>B: startAuthentication(options) → navigator.credentials.get()
    B->>U: piliin ang passkey · fingerprint / PIN
    B->>B: PIRMA sa authenticatorData + hash(clientDataJSON)<br/>gamit ang PRIVATE key (hindi umaalis sa device)
    B-->>F: { id, clientDataJSON (challenge + origin), authenticatorData, signature, userHandle }
    F->>A: POST /api/auth/passkeys/login/verify { response }
    A->>D: DELETE FROM webauthn_challenges WHERE challenge = … RETURNING<br/>(ang challenge mula sa clientDataJSON — isang subok lang)
    A->>D: passkeys JOIN users WHERE credential_id = response.id
    A->>A: userHandle = ang may-ari? · verifyAuthenticationResponse:<br/>pirma (PUBLIC key) · challenge · origin · RP ID · user verification · counter
    alt hindi pumasa
        A->>D: audit: login_failed { method: passkey, reason }
        A-->>F: 401 "Passkey login failed" (iisang mensahe)
    else pumasa
        A->>D: TRANSACTION: counter + last_used_at · refresh token · trusted device
        A->>D: audit: login { method: passkey }
        A-->>F: 200 { user } + cookies (pareho ng password login)
    end
```

## Ang mga bantay sa hakbang 2

```mermaid
flowchart TD
    In(["POST …/login/verify"]) --> Zod{"tamang HUGIS?"}
    Zod -->|"hindi"| E400["400 + fields"]
    Zod -->|"oo"| Ch{"ang challenge sa clientDataJSON<br/>ay buhay at hindi pa nagamit?<br/>DELETE … RETURNING"}
    Ch -->|"hindi → REPLAY, gawa-gawa, expired"| Fail
    Ch -->|"oo (burado na ngayon)"| Pk{"kilala ang credential id?"}
    Pk -->|"hindi → binura dito, o hindi taga-rito"| Fail
    Pk -->|"oo"| Uh{"userHandle = ang may-ari?"}
    Uh -->|"hindi"| Fail
    Uh -->|"oo / wala"| Lib{"library: pirma gamit ang PUBLIC key ·<br/>origin · RP ID · user verification"}
    Lib -->|"maling pirma → ibang private key<br/>maling origin/RP ID → PHISHING"| Fail
    Lib -->|"pumasa"| Cnt{"counter > ang naka-save?<br/>(kapag hindi parehong 0)"}
    Cnt -->|"hindi → posibleng KINOPYANG key"| Fail
    Cnt -->|"oo"| OK["200 · session · audit login { method: passkey }"]
    Fail["401 — IISANG mensahe<br/>audit: login_failed { method: passkey, reason }"]
```

## 🔐 Ang decoy: ano ang ipinapakita sa labas

| Email sa options | `allowCredentials` | Ang makikita ng umaatake |
|---|---|---|
| (wala) | `[]` | — walang tinatanong tungkol sa kahit sino |
| May account **at** may passkey | ang mga totoong id | isang (o higit pang) id |
| May account pero **walang** passkey | 1 pekeng id (HMAC) | isang id — pareho ang hugis |
| **Walang** account | 1 pekeng id (HMAC) | isang id — pareho ang hugis, pareho sa pag-ulit |

**Ang hindi tinatakpan (D-038):** ang account na may **2+ passkey** ay may 2+ id, at ang decoy ay laging 1. Ang haba ng totoong id ay depende sa device (ang decoy ay laging 43 na titik).
Kaya ang pinakaligtas na paraan ay ang **walang email** — wala itong tinatanong tungkol sa kahit sino. Iyon ang default sa Login page.

## Bakit hindi hinaharang ng password lockout ang passkey
Ang lockout (Day 63) ay laban sa **panghuhula** ng password. Hindi nahuhulaan ang pirma ng private key. Kaya kapag naka-lock ang password dahil may nanghuhula, makakapasok pa rin ang totoong may-ari gamit ang passkey niya.
May sariling limit ang passkey login: 30 options at 10 palpak na verify bawat 15 minuto bawat IP.
