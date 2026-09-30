# 28 — Pagdagdag ng passkey (WebAuthn registration ceremony)

> 📅 Day 95–96 · Phase 19 (Passkeys) · **Desisyon:** D-037
> **Code:** `backend/src/services/auth/passkey.service.ts` · `lib/webauthn.ts` · `controllers/passkey.controller.ts` · `routes/auth.ts` · `db/schema.ts` (`passkeys`, `webauthn_challenges`)
> · frontend: `src/pages/PasskeysPage.tsx` · `src/api/auth.ts` (`addPasskey`)
> **Subukan:** `backend/http/38-passkeys.http` (options at mga pagtanggi) · ang buong flow: `http://localhost:5173/passkeys` · test: `backend/src/routes/passkeys.test.ts`
> **Ang ideya muna:** `27-webauthn-concept.md`

## Ang buong flow (naka-login na ang user)

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend (PasskeysPage)
    participant B as Browser + Device
    participant A as API
    participant D as Postgres
    U->>F: pangalan + KASALUKUYANG password → "Magdagdag ng passkey"
    F->>A: POST /api/auth/passkeys/register/options { currentPassword }
    A->>D: users: password_hash
    A->>A: argon2.verify
    alt maling password
        A->>D: audit: passkey_add_failed (wrong_password)
        A-->>F: 400 { fields: { currentPassword } }
    else tama
        A->>D: passkeys ng user (para sa excludeCredentials · limit 10)
        A->>A: generateRegistrationOptions — bagong random na challenge
        A->>D: webauthn_challenges: UPSERT (isa lang bawat user · 5 minuto)
        A-->>F: 200 options { challenge, rp.id, user, excludeCredentials … }
    end
    F->>B: startRegistration(options) → navigator.credentials.create()
    B->>U: fingerprint · mukha · PIN
    U-->>B: ✅
    B->>B: bagong KEY PAIR para sa rp.id<br/>private key: nananatili sa device
    B-->>F: { id, clientDataJSON (challenge + ORIGIN), attestationObject (public key) }
    F->>A: POST /api/auth/passkeys/register/verify { response, name }
    A->>D: DELETE FROM webauthn_challenges … RETURNING challenge<br/>(kunin AT burahin: isang subok lang)
    A->>A: verifyRegistrationResponse:<br/>challenge = ang ibinigay ko? · origin = ang frontend ko? ·<br/>RP ID = ang domain ko? · may user verification?
    alt hindi pumasa (o walang challenge, o expired)
        A->>D: audit: passkey_add_failed (kategorya lang)
        A-->>F: 400 "Passkey registration failed" (iisang mensahe)
    else pumasa
        A->>D: INSERT INTO passkeys (public key, credential_id UNIQUE …)
        A->>D: audit: passkey_added
        A-->>F: 201 { passkey: { id, name, deviceType … } }
    end
```

## Ano ang sinusuri sa hakbang 2, at anong atake ang pinipigilan

```mermaid
flowchart TD
    In(["POST …/register/verify"]) --> Auth{"naka-login?<br/>(requireAuth)"}
    Auth -->|"hindi"| E401["401"]
    Auth -->|"oo"| Zod{"tamang HUGIS?<br/>(Zod: base64url, haba)"}
    Zod -->|"hindi"| E400a["400 Invalid input + fields<br/>(hindi nasusunog ang challenge)"]
    Zod -->|"oo"| Ch{"may buhay na challenge<br/>ang user na ITO?<br/>DELETE … RETURNING"}
    Ch -->|"wala · expired · nagamit na"| Fail
    Ch -->|"mayroon (burado na ngayon)"| V1{"challenge sa sagot<br/>= ang sa database?"}
    V1 -->|"hindi → REPLAY o challenge ng iba"| Fail
    V1 -->|"oo"| V2{"origin = CLIENT_URL?"}
    V2 -->|"hindi → PHISHING"| Fail
    V2 -->|"oo"| V3{"RP ID hash = ang domain natin?"}
    V3 -->|"hindi → passkey ng ibang site"| Fail
    V3 -->|"oo"| V4{"na-verify ang user?<br/>(fingerprint / PIN)"}
    V4 -->|"hindi"| Fail
    V4 -->|"oo"| Ins{"INSERT passkeys<br/>credential_id UNIQUE"}
    Ins -->|"23505: nakarehistro na<br/>(kahit sa ibang account)"| E409["409"]
    Ins -->|"ok"| OK["201 · audit: passkey_added"]
    Fail["400 — IISANG mensahe<br/>audit: passkey_add_failed { reason: kategorya }"]
```

## Mga desisyon sa likod ng flow (D-037)

| Tanong | Sagot | Bakit |
|---|---|---|
| Sapat na ba ang session para magdagdag? | **Hindi — kailangan ang kasalukuyang password** | Ang passkey ay bagong paraan ng pagpasok. Ang nakaw na session ay makakapagdagdag sana ng sarili niyang passkey, at mananatili kahit palitan ang password |
| Saan galing ang RP ID at origin? | **Hinango sa `CLIENT_URL`** | Walang hiwalay na env variable na maiiwang `localhost` sa production (nangyari sa reference) |
| Saan nakatago ang challenge? | **Database**, 5 minuto, isa bawat user | Opsyonal at fail-open ang Redis natin; ang challenge ay hindi puwedeng "mawala na lang" |
| Ilang subok bawat challenge? | **Isa** — burado na bago pa suriin | Walang paulit-ulit na panghuhula laban sa iisang challenge |
| Ano ang sinasabi sa client kapag pumalya? | **Iisang 400** | Ang dahilan ay nasa audit log (kategorya lang, hindi ang mensahe ng library — kasama roon ang challenge) |
| Ano ang naka-save? | **Public key**, credential id, counter, transports | Walang sikreto. Ang nakaw na database ay hindi makakapirma |

**Hindi pa kasama (Day 97–98):** ang login gamit ang passkey. Sa ngayon, nairerehistro pa lang.
