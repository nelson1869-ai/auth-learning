#!/usr/bin/env bash
# =============================================================================
# 🚀 Deploy ng backend sa production (Day 37) — "manual muna, tapos automate"
#
#   ./devops/deploy.sh                       # ang huling commit sa main na PUMASA ang CI
#   ROLLBACK=1 ./devops/deploy.sh <lumang sha>  # bumalik sa mas lumang commit (sadyang desisyon)
#
# Mga bantay (Day 89 — "deploy lang ang eksaktong commit na pumasa sa CI"):
#   a. hindi babalik sa mas lumang commit nang hindi sinasadya (kailangan ng ROLLBACK=1)
#   b. ang compose at monitoring config sa PC ay DAPAT pareho ng nasa commit na iyon (hindi ang nasa kasalukuyang branch)
#   c. ang image ay may attestation: binuo ng ci.yml, mula sa commit na iyon, sa main (hindi lang "may ganitong tag")
#   d. ang migrations ay SINUSURI pagkatapos (lahat ng nasa image ay nasa database) — bago i-restart ang backend
#   e. (Day 91) BACKUP ng database bago mag-migrate — kapag may sirang migration, may kopya mula mismo bago nito
#
# Hinihila (pull) ng PC ang image na ginawa ng CI — walang code mula sa labas na
# kusang tumatakbo dito (walang self-hosted runner, D-020).
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

REPO=nelson1869-ai/auth-learning
IMAGE=ghcr.io/nelson1869-ai/auth-learning-backend
ENV_FILE=../backend/.env.production

# 1. Aling commit: ang ibinigay, o ang huling main na BERDE ang buong CI (kasama ang image job)
SHA="${1:-$(gh run list --repo "$REPO" --branch main --event push --workflow CI --status success --limit 1 --json headSha --jq '.[0].headSha')}"
if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "❌ Walang valid na commit SHA ('$SHA')" >&2
  exit 1
fi
echo "▶ Deploy: $SHA"
DEPLOYED="$(cat .deployed-sha 2>/dev/null || true)"

# Kailangang nasa lokal na git ang commit (para sa a at b). HTTPS ang fetch: pagkatapos ng restart ng PC, walang laman ang ssh-agent
if ! git cat-file -e "$SHA^{commit}" 2>/dev/null; then
  git fetch -q "https://github.com/$REPO.git" main
fi
if ! git cat-file -e "$SHA^{commit}" 2>/dev/null; then
  echo "❌ Hindi makita ang commit $SHA sa main — walang ginalaw" >&2
  exit 1
fi

# a. Mas luma ba ito kaysa sa naka-deploy? Maaaring typo, o ang huling "berde" ay mas luma (hal. tumatakbo pa ang CI ng bago)
if [[ -n "$DEPLOYED" && "$SHA" != "$DEPLOYED" ]] && git merge-base --is-ancestor "$SHA" "$DEPLOYED" 2>/dev/null; then
  if [[ "${ROLLBACK:-}" != "1" ]]; then
    echo "❌ Mas LUMA ang $SHA kaysa sa naka-deploy ($DEPLOYED). Kung sinasadya: ROLLBACK=1 ./deploy.sh $SHA — walang ginalaw" >&2
    exit 1
  fi
  echo "⚠️ ROLLBACK: babalik sa mas lumang commit"
fi

# b. Ang config na gagamitin (compose, monitoring, cloudflared, ang script na ito) ay galing sa WORKING COPY ng PC.
#    Kapag ibang branch ang naka-checkout, o may binago na hindi pa naka-commit, iba ito sa sinuri ng CI (insidente #18 ng reference).
#    Sa rollback, pinapayagan (ang config ngayon ang gagamitin) pero sinasabi
#    Kasama ang database/backups/ (Day 91): ang backup script na tatakbo ay dapat ang nasa commit din
if ! changed="$(git diff --name-only "$SHA" -- . ../database/backups)" || [[ -n "$changed" ]]; then
  if [[ "${ROLLBACK:-}" != "1" ]]; then
    echo "❌ Iba ang devops/ sa PC kaysa sa commit $SHA — walang ginalaw:" >&2
    echo "$changed" | sed 's/^/     /' >&2
    echo "   Ayusin: git checkout main && git pull (o i-commit/itapon ang binago)" >&2
    exit 1
  fi
  echo "⚠️ ROLLBACK: iba ang devops/ sa commit na iyon — ang config NGAYON ang gagamitin:"
  echo "$changed" | sed 's/^/     /'
fi

# Pre-flight (Day 84): binabasa ng compose ang BUONG file, kaya kapag kulang ang devops/.env (GRAFANA_ADMIN_PASSWORD,
# ALERT_EMAIL_TO, ALERT_SMTP_PASSWORD), pati ang `up backend` ay tatanggi. Mas mabuting malaman ito bago mag-pull at mag-migrate
if ! IMAGE_TAG="$SHA" docker compose -f docker-compose.prod.yml config -q; then
  echo "❌ Kulang ang devops/.env (tingnan ang .env.example) — walang ginalaw" >&2
  exit 1
fi

# 2. Kunin ang image ng eksaktong commit na iyon
docker pull --quiet "$IMAGE:$SHA"

# c. Attestation (Day 89): patunay na ang image na ito (ang DIGEST, hindi ang tag) ay binuo ng .github/workflows/ci.yml,
#    mula sa commit $SHA, sa refs/heads/main, sa runner ng GitHub. Ang tag ay puwedeng ilipat; ang lagda ay hindi mapepeke.
#    Ang mga image bago ang Day 89 ay walang attestation: ALLOW_UNATTESTED=1 (para lang sa rollback sa mga iyon)
DIGEST="$(docker inspect --format '{{index .RepoDigests 0}}' "$IMAGE:$SHA" | cut -d@ -f2)"
if gh attestation verify "oci://$IMAGE@$DIGEST" --repo "$REPO" \
    --signer-workflow "$REPO/.github/workflows/ci.yml" --source-ref refs/heads/main --source-digest "$SHA" \
    --deny-self-hosted-runners >/dev/null 2>&1; then
  echo "   attestation: ✅ binuo ng ci.yml mula sa $SHA (main) · $DIGEST"
elif [[ "${ALLOW_UNATTESTED:-}" == "1" ]]; then
  echo "⚠️ WALANG valid na attestation ang image — pinayagan ng ALLOW_UNATTESTED=1"
else
  echo "❌ Hindi mapatunayan na ang image ay galing sa ci.yml at sa commit $SHA — walang ginalaw" >&2
  echo "   Tingnan: gh attestation verify oci://$IMAGE@$DIGEST --repo $REPO" >&2
  exit 1
fi

# e. Backup BAGO mag-migrate (Day 91): sariling pg_dump sa PC (~/backups/auth-learning), hindi lang ang 6 na oras ng Neon.
#    Kapag pumalya ang backup, HUWAG mag-migrate (iyon ang pinakamapanganib na hakbang). ALLOW_NO_BACKUP=1 para lumampas (sadya)
if ! ../database/backups/backup.sh "pre-deploy-${SHA:0:7}"; then
  if [[ "${ALLOW_NO_BACKUP:-}" == "1" ]]; then
    echo "⚠️ WALANG backup — pinayagan ng ALLOW_NO_BACKUP=1"
  else
    echo "❌ Pumalya ang backup — hindi nag-migrate, walang ginalaw sa app. Tingnan ang error sa itaas" >&2
    exit 1
  fi
fi

# 3. Migrations MUNA (gamit ang parehong image) — bago patakbuhin ang bagong code.
#    d. (Day 89) Pagkatapos, SINUSURI ng migrate.ts na lahat ng migration sa image ay nasa database (hindi lang "applied").
#    Hindi-0 na exit (kulang, o mas bago ang database nang walang ROLLBACK=1) → huminto: hindi pa nagagalaw ang tumatakbong app
if ! docker run --rm --env-file "$ENV_FILE" -e ROLLBACK="${ROLLBACK:-}" "$IMAGE@$DIGEST" node src/db/migrate.ts; then
  echo "❌ Hindi napatunayan ang migrations — hindi ni-restart ang backend" >&2
  exit 1
fi

# 4. Palitan ang backend ng bagong image (hindi ginagalaw ang cloudflared)
IMAGE_TAG="$SHA" docker compose -f docker-compose.prod.yml up -d --no-deps backend

# 5. Hintaying maging "healthy" (HEALTHCHECK ng image), tapos subukan mula sa internet
for _ in $(seq 1 30); do
  status="$(docker inspect -f '{{.State.Health.Status}}' auth-learning-prod-backend-1 2>/dev/null || true)"
  [[ "$status" == "healthy" ]] && break
  sleep 2
done
if [[ "$status" != "healthy" ]]; then
  echo "❌ Hindi naging healthy ang backend (status: $status) — tingnan: docker compose -f docker-compose.prod.yml logs backend" >&2
  exit 1
fi
# 6. Readiness mula sa internet (Day 80): tunnel → bagong code → Neon. Ang HEALTHCHECK ay liveness lang (walang database),
#    kaya dito sinusuri — isang beses — na naaabot ng bagong code ang database. 503 = hindi handa → pumalya ang deploy
if ! ready="$(curl -fsS --max-time 15 https://api.nelson1869.com/api/health/ready)"; then
  echo "❌ Buhay ang backend pero HINDI handa (database?) — tingnan: docker compose -f docker-compose.prod.yml logs backend" >&2
  echo "   Para bumalik sa dati: ROLLBACK=1 ./deploy.sh \"\$(cat .deployed-sha)\"" >&2
  exit 1
fi
echo "   $ready"
echo "$SHA" > .deployed-sha
echo "✅ Live: https://api.nelson1869.com — $SHA"

# 7. Monitoring (Day 82, + Alertmanager Day 84): tiyaking tumatakbo (walang gagawin kung buhay na at walang nagbago
#    sa compose). HINDI fatal: live na ang app, at hindi dapat magpabagsak ng deploy ang monitoring (parehong aral ng Day 81).
#    Kapag binago ang prometheus.yml o alerts.yml: docker compose -f docker-compose.prod.yml restart prometheus (tingnan ang README)
if ! IMAGE_TAG="$SHA" docker compose -f docker-compose.prod.yml up -d prometheus grafana alertmanager; then
  echo "⚠️ Hindi na-start ang monitoring (live pa rin ang app) — tingnan: docker compose -f docker-compose.prod.yml logs prometheus grafana alertmanager" >&2
fi
