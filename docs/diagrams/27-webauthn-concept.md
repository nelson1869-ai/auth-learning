# 27 — Passkeys (WebAuthn): ang konsepto

> 📅 Day 94 · Phase 19 (Passkeys) · **Konsepto lang — wala pang endpoint**
> **Code (practice):** `backend/playground/02-passkey-concept.js` · **Subukan:** `cd backend && node playground/02-passkey-concept.js`
> Ang totoong mga flow (may library at database) ay darating sa Day 95–98, na may sariling diagram.

## Sino ang may hawak ng ano

```mermaid
flowchart LR
    subgraph Device["📱 Device ng user (authenticator)"]
        Priv["🔑 PRIVATE key<br/>hindi kailanman umaalis dito<br/>nakatali sa site: nelson1869.com"]
        Unlock["fingerprint · mukha · PIN<br/>(sa device lang — hindi ipinapadala)"]
        Unlock -->|"pahintulot na pumirma"| Priv
    end
    subgraph Browser["🌐 Browser"]
        Origin["alam ang TOTOONG origin ng page<br/>ito ang naglalagay nito sa pinipirmahan"]
    end
    subgraph Server["🖥️ Server natin"]
        Pub["PUBLIC key + credential id<br/>(hindi sikreto)"]
        Chal["challenge: random, isang gamit"]
    end
    Chal -->|"1. 'pirmahan mo ito'"| Origin
    Origin -->|"2. challenge + origin"| Priv
    Priv -->|"3. pirma"| Origin
    Origin -->|"4. pirma + challenge + origin"| Pub
    Pub -->|"5. tama ang pirma? tama ang challenge? tama ang origin?"| OK(["✅ naka-login"])
```

## Password vs passkey sa isang pekeng site (phishing)

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🎣 Pekeng site (nelson1869.com.evil.example)
    participant S as Totoong server
    Note over U,S: PASSWORD
    U->>F: tina-type ang email + password
    F->>S: parehong email + password
    S-->>F: ✅ naka-login (ang umaatake)
    Note over F: hawak na ng umaatake ang password — magagamit ulit kahit kailan
    Note over U,S: PASSKEY
    F->>S: humingi ng challenge
    S-->>F: challenge
    F->>U: "pirmahan mo ito"
    Note over U: ang passkey ay para sa nelson1869.com.<br/>Ibang site ito → walang iaalok ang device.
    U--xF: walang pirma
    Note over U,S: kahit may pirma: ang origin na inilagay ng browser ay ang pekeng site,<br/>kaya tatanggihan ng server (tingnan ang #3 sa playground)
```

## Ang tatlong tanong ng server, at kung anong atake ang pinipigilan ng bawat isa

| Sinusuri ng server | Pinipigilan | Sa `02-passkey-concept.js` |
|---|---|---|
| Ang **challenge** ba ay ang ibinigay ko, at hindi pa nagagamit? | **Replay:** lumang sagot na ipinadala ulit | #2 → ❌ |
| Ang **origin** ba ay ang site ko? | **Phishing:** pirma mula sa pekeng site | #3 → ❌ |
| Tama ba ang **pirma** ayon sa public key na naka-save? | **Pagbabago** ng laman, at pirma ng **ibang key** | #4, #5 → ❌ |

Kumpara sa mga alam ko na: ang **RS256 JWT** (Day 56) ay parehong ideya — private key ang pumipirma, public key ang nagve-verify. Ang pagkakaiba: doon, ang **server** ang may private key; dito, ang **device ng user**.
