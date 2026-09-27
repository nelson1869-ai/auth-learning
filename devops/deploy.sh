#!/usr/bin/env bash
# =============================================================================
# 🚀 Deploy ng backend sa production (Day 37) — "manual muna, tapos automate"
#
#   ./devops/deploy.sh            # ang huling commit sa main na PUMASA ang CI
#   ./devops/deploy.sh <sha>      # isang tiyak na commit (hal. para bumalik/rollback)
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

# Pre-flight (Day 84): binabasa ng compose ang BUONG file, kaya kapag kulang ang devops/.env (GRAFANA_ADMIN_PASSWORD,
# ALERT_EMAIL_TO, ALERT_SMTP_PASSWORD), pati ang `up backend` ay tatanggi. Mas mabuting malaman ito bago mag-pull at mag-migrate
if ! IMAGE_TAG="$SHA" docker compose -f docker-compose.prod.yml config -q; then
  echo "❌ Kulang ang devops/.env (tingnan ang .env.example) — walang ginalaw" >&2
  exit 1
fi

# 2. Kunin ang image ng eksaktong commit na iyon
docker pull --quiet "$IMAGE:$SHA"

# 3. Migrations MUNA (gamit ang parehong image) — bago patakbuhin ang bagong code.
#    Kapag pumalya, huminto: hindi pa nagagalaw ang tumatakbong app
docker run --rm --env-file "$ENV_FILE" "$IMAGE:$SHA" node src/db/migrate.ts

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
  echo "   Para bumalik sa dati: ./deploy.sh \"\$(cat .deployed-sha)\"" >&2
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
