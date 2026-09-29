# 24 — Data retention: oras-oras na paglilinis ng lumang data

> 📅 Day 90 · Phase 18 (Production maturity) · **Desisyon:** D-032
> **Code:** `backend/src/services/retention.service.ts` · `backend/src/jobs/retentionScheduler.ts` · `backend/src/index.ts` (start + shutdown) · `backend/src/lib/metrics.ts`
> **Subukan:** `backend/http/34-retention.http` · test: `backend/src/services/retention.service.test.ts` · Grafana: 2 panel (Retention)

```mermaid
flowchart TD
    Start(["index.ts — pagka-start"]) --> Timer["startRetentionScheduler()<br/>unang takbo: +60s · tapos bawat 1 oras"]
    Timer --> BG["runInBackground('retention', …)<br/>hinihintay ng graceful shutdown (Day 85)"]
    BG --> Tx["db.transaction"]
    Tx --> Lock{"pg_try_advisory_xact_lock(90001)<br/>nakuha ba?"}
    Lock -->|"hindi — may ibang instance"| Skip["status: skipped<br/>walang binura"]
    Lock -->|"oo"| D1["refresh_tokens: BUONG family<br/>kapag max(expires_at) &lt; now"]
    D1 --> D2["verification_tokens · trusted_devices<br/>kapag expired"]
    D2 --> D3["unknown_login_attempts<br/>idle 30+ araw AT hindi naka-lock"]
    D3 --> D4["audit_logs<br/>mahigit 1 taon"]
    D4 --> Commit["COMMIT → kusang binibitawan ang lock<br/>(pati sa rollback o pagkamatay ng process)"]
    Commit --> Obs["log: retention_done { deleted, ms }<br/>metrics: auth_retention_deleted_total{table}<br/>· auth_retention_runs_total{status}"]
    Skip --> Obs2["log: retention_skipped · runs{status=skipped}"]
    Stop(["SIGTERM"]) --> S1["1. ihinto ang timer (walang bagong takbo)"]
    S1 --> S2["2. drainBackground() — tapusin ang takbong nasa kalagitnaan"]
    S2 --> S3["3. closeDb()"]
```

## Bakit BUONG family ang refresh tokens (hindi bawat token)

Hinahanap ng reuse detection (Day 52, `lib/session.ts`) ang **revoked** na row ng token na ipinakita. Kapag nabura ang row na iyon habang
buhay pa ang family, ang ninakaw na lumang token ay magiging **"invalid"** na lang, hindi **"reused"**, at **hindi na babawiin** ang family.
May test na nagre-replay ng ganoong token pagkatapos ng cleanup; bumabagsak ito kapag ginawang per-token ang patakaran.

## Mga dapat pansinin
- **Advisory lock na nakatali sa transaction:** kapag dalawang instance, isa lang ang naglilinis. Walang lock na maiiwan kahit mamatay ang process.
  Ang test ay deterministiko: HINAHAWAKAN nito ang lock sa ibang koneksyon (ang dalawang sabay na takbo ay kadalasang hindi nagsasabay).
- **Hindi naka-lock:** ang `unknown_login_attempts` na naka-lock pa ay hindi binubura, kaya hindi nabubura ang lock ng umaatake dahil lang sa paghihintay.
  **Tinanggap:** ang bilang ng email na totoong account (nasa `users`) ay hindi kailanman nag-e-expire; ang napakatiyagang attacker (≤4 na subok, maghintay ng 30 araw)
  ay puwedeng makakita ng pagkakaiba.
- **Sa loob ng app** (hindi hiwalay na cron/container): walang dagdag na bahagi. Ang kapalit: tumatakbo lang kapag buhay ang app.
