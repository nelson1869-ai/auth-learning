#!/usr/bin/env bash
# =============================================================================
# 🧯 Backup drill (Day 91) — "ang backup na hindi pa nasusubukang i-restore ay hindi backup"
#
#   database/backups/restore-drill.sh [file.dump]     # default: ang pinakabagong dump sa $BACKUP_DIR
#   KEEP_STAGING=1 database/backups/restore-drill.sh  # huwag burahin ang staging pagkatapos (para silipin)
#
# HINDI ginagalaw ang production. Gumagawa ng pansamantalang STAGING database (container, data sa memory lang),
# at doon ginagawa ang lahat:
#   1. suriin ang checksum ng dump (sira ba ang file?)
#   2. i-restore → ikumpara ang bilang ng bawat table sa .counts ng backup
#   3. patakbuhin ang PRODUCTION image laban sa staging → /api/health/ready at /api/users/count
#   4. SADYANG SIRAIN ang staging (DROP SCHEMA public CASCADE) → makitang pumapalya ang app
#   5. i-restore ulit → suriin ulit → ORASAN mula "nakita ang sira" hanggang "tama na ang sagot ng app" (RTO)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."

DEST="${BACKUP_DIR:-$HOME/backups/auth-learning}"
DUMP="${1:-$(ls -1t "$DEST"/*.dump 2>/dev/null | head -1)}"
[[ -f "$DUMP" ]] || { echo "❌ Walang dump (patakbuhin muna ang database/backups/backup.sh)" >&2; exit 1; }
BASE="${DUMP%.dump}"
APP_IMAGE="ghcr.io/nelson1869-ai/auth-learning-backend:$(cat devops/.deployed-sha)"
NET=auth-learning-staging-net
PG=auth-learning-staging
APP=auth-learning-staging-app
PORT=3098
PW="$(openssl rand -hex 16)" # pansamantala, para lang sa drill na ito — hindi ipinapakita
STAGING_URL="postgres://postgres:$PW@$PG:5432/staging"

cleanup() {
  if [[ "${KEEP_STAGING:-}" != "1" ]]; then
    docker rm -f "$APP" "$PG" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
now() { date +%s.%N; }
secs() { printf '%.1f' "$(echo "$2 - $1" | bc)"; }
psql_staging() { docker exec -e PGPASSWORD="$PW" "$PG" psql -U postgres -d staging -v ON_ERROR_STOP=1 -Atc "$1"; }

COUNT_SQL="select table_schema || '.' || table_name || ' ' ||
  (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
  from information_schema.tables where table_schema in ('public', 'drizzle') and table_type = 'BASE TABLE' order by 1"

restore() {
  psql_staging "select 1" >/dev/null 2>&1 && docker exec -e PGPASSWORD="$PW" "$PG" dropdb -U postgres --force staging
  docker exec -e PGPASSWORD="$PW" "$PG" createdb -U postgres staging
  docker exec -e PGPASSWORD="$PW" "$PG" pg_restore -U postgres -d staging --no-owner --no-privileges --exit-on-error "/backups/$(basename "$DUMP")"
}
verify_counts() {
  if diff <(psql_staging "$COUNT_SQL") "$BASE.counts" >/dev/null; then
    echo "   ✅ bilang ng row: tugma sa backup ($(wc -l < "$BASE.counts") table)"
  else
    echo "   ❌ HINDI tugma ang bilang ng row:" >&2
    diff <(psql_staging "$COUNT_SQL") "$BASE.counts" | sed 's/^/      /' >&2
    exit 1
  fi
}
app_check() { # ready + users/count na tugma sa backup
  local ready count expected
  ready="$(curl -s -o /dev/null -w '%{http_code}' "localhost:$PORT/api/health/ready")"
  count="$(curl -s "localhost:$PORT/api/users/count")"
  expected="$(awk '$1=="public.users"{print $2}' "$BASE.counts")"
  echo "   app: ready $ready · /api/users/count $count (inaasahan: {\"count\":$expected})"
  [[ "$ready" == "200" && "$count" == "{\"count\":$expected}" ]]
}

echo "🧯 Drill: $(basename "$DUMP") → staging (hindi ginagalaw ang production)"

# 1. Checksum
( cd "$(dirname "$DUMP")" && sha256sum -c --quiet "$(basename "$BASE").sha256" ) || { echo "❌ Sira ang dump (checksum)" >&2; exit 1; }
echo "   ✅ checksum"

# 2. Staging + unang restore
docker network create "$NET" >/dev/null
docker run -d --name "$PG" --network "$NET" -e POSTGRES_PASSWORD="$PW" --tmpfs /var/lib/postgresql/data \
  -v "$DEST:/backups:ro" postgres:17-alpine >/dev/null
for _ in $(seq 60); do docker exec "$PG" pg_isready -U postgres -q 2>/dev/null && break; sleep 0.5; done
t0=$(now); restore; t1=$(now)
echo "   ✅ restore #1: $(secs "$t0" "$t1")s"
verify_counts

# 3. Ang production image laban sa staging (dev na JWT key — hindi ang sa production)
docker run -d --name "$APP" --network "$NET" -p "127.0.0.1:$PORT:3000" --env-file backend/.env \
  -e NODE_ENV=production -e RESEND_API_KEY=re_dummy_not_real -e DATABASE_URL="$STAGING_URL" "$APP_IMAGE" >/dev/null
for _ in $(seq 60); do curl -s -m1 -o /dev/null "localhost:$PORT/api/health/live" && break; sleep 0.5; done
app_check || { echo "❌ Hindi gumana ang app sa na-restore na database" >&2; exit 1; }

# 4. SADYANG SIRAIN
psql_staging "drop schema public cascade" >/dev/null
t_break=$(now)
echo "💥 Sinira: DROP SCHEMA public CASCADE"
if app_check; then echo "   ⚠️ hindi napansin ng app ang sira?" >&2; else echo "   ✅ napansin: pumapalya ang app (gaya ng inaasahan)"; fi

# 5. I-restore ulit at orasan (RTO: mula sa sira hanggang tama ulit ang sagot ng app)
t2=$(now); restore; t3=$(now)
echo "   ✅ restore #2: $(secs "$t2" "$t3")s"
verify_counts
for _ in $(seq 20); do app_check >/dev/null && break; sleep 0.5; done
app_check || { echo "❌ Hindi bumalik ang app" >&2; exit 1; }
t4=$(now)
echo "⏱️  Mula sa sira hanggang tama ulit ang sagot ng app: $(secs "$t_break" "$t4")s (restore lang: $(secs "$t2" "$t3")s)"
echo "   Backup na ginamit: $(basename "$DUMP") — ang data pagkatapos ng oras na iyon ay WALA (RPO = edad ng backup)"
