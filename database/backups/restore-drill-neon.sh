#!/usr/bin/env bash
# =============================================================================
# 🧯 Backup drill sa NEON (Day 91) — ang totoong landas ng production restore, sa isang STAGING branch
#
#   database/backups/restore-drill-neon.sh [file.dump]
#
# Kailangan: database/backups/.env.staging (gitignored) na may
#   STAGING_DATABASE_URL=postgresql://…@ep-XXXX….neon.tech/neondb?sslmode=verify-full
# ang connection string ng Neon branch na "staging" (ginawa sa Neon console, HINDI ang production branch).
#
# ⚠️ BINUBURA nito ang LAHAT ng laman ng target bago mag-restore (iyon ang "sakuna"). Kaya tumatanggi ito kapag ang
#    target ay ang production (parehong Neon endpoint ng backend/.env.production).
#
# Inoorasan: 💥 sira → restore sa Neon (sa internet) → suriin ang bilang → ang production image laban dito → tama ang sagot.
# Ito ang pinakamalapit sa totoong RTO: sa totoong sakuna, idadagdag pa ang pagpalit ng DATABASE_URL at isang deploy.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."

DEST="${BACKUP_DIR:-$HOME/backups/auth-learning}"
DUMP="${1:-$(ls -1t "$DEST"/*.dump 2>/dev/null | head -1)}"
[[ -f "$DUMP" ]] || { echo "❌ Walang dump" >&2; exit 1; }
BASE="${DUMP%.dump}"
STAGING_ENV=database/backups/.env.staging
[[ -f "$STAGING_ENV" ]] || { echo "❌ Walang $STAGING_ENV (tingnan ang itaas ng script)" >&2; exit 1; }
git check-ignore -q "$STAGING_ENV" || { echo "❌ Hindi gitignored ang $STAGING_ENV — huminto" >&2; exit 1; }

# 🔐 Bantay: HINDI ang production. Ikinukumpara ang Neon endpoint (ep-…) — hindi ipinapakita ang URL
endpoint() { grep "^$1=" "$2" | cut -d= -f2- | sed -E 's#^[a-z]+://[^@]*@([^/.:]+).*#\1#'; }
PROD_EP="$(endpoint DATABASE_URL backend/.env.production)"
STAGING_EP="$(endpoint STAGING_DATABASE_URL "$STAGING_ENV")"
if [[ -z "$STAGING_EP" || "$STAGING_EP" == "$PROD_EP" ]]; then
  echo "❌ Ang target ay ang PRODUCTION endpoint (o hindi mabasa) — HINDI ito tatakbo" >&2
  exit 1
fi
[[ "$STAGING_EP" == ep-* ]] || { echo "❌ Hindi mukhang Neon endpoint ang target — huminto" >&2; exit 1; }
echo "🧯 Neon drill: $(basename "$DUMP") → staging endpoint (iba sa production ✅)"

APP_IMAGE="ghcr.io/nelson1869-ai/auth-learning-backend:$(cat devops/.deployed-sha)"
APP=auth-learning-staging-app
PORT=3098
trap 'docker rm -f "$APP" >/dev/null 2>&1 || true' EXIT
now() { date +%s.%N; }
secs() { printf '%.1f' "$(echo "$2 - $1" | bc)"; }
# pg tools sa loob ng container; ang URL ay galing sa env file (hindi sa command line)
pg() { docker run --rm -i --env-file "$STAGING_ENV" -e PGSSLROOTCERT=system -v "$DEST:/backups:ro" postgres:17-alpine sh -euc "$1"; }

COUNT_SQL="select table_schema || '.' || table_name || ' ' ||
  (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
  from information_schema.tables where table_schema in ('public', 'drizzle') and table_type = 'BASE TABLE' order by 1"

( cd "$(dirname "$DUMP")" && sha256sum -c --quiet "$(basename "$BASE").sha256" ) || { echo "❌ Sira ang dump (checksum)" >&2; exit 1; }
echo "   ✅ checksum"

# 💥 Ang sakuna: burahin ang lahat (ang branch ay kopya ng production, kaya may laman ito)
pg 'psql "$STAGING_DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;"' 2>&1 | grep -v NOTICE || true
t_break=$(now)
echo "💥 Sinira ang staging: walang table"

t0=$(now)
pg "pg_restore -d \"\$STAGING_DATABASE_URL\" --no-owner --no-privileges --exit-on-error /backups/$(basename "$DUMP")"
t1=$(now)
echo "   ✅ restore sa Neon: $(secs "$t0" "$t1")s"
if diff <(pg "psql \"\$STAGING_DATABASE_URL\" -Atc \"$COUNT_SQL\"") "$BASE.counts" >/dev/null; then
  echo "   ✅ bilang ng row: tugma sa backup"
else
  echo "   ❌ HINDI tugma ang bilang ng row" >&2; exit 1
fi

# Ang production image laban sa na-restore na staging (TLS verify-full papunta sa Neon, dev na JWT key)
URL="$(grep '^STAGING_DATABASE_URL=' "$STAGING_ENV" | cut -d= -f2-)"
docker run -d --name "$APP" -p "127.0.0.1:$PORT:3000" --env-file backend/.env \
  -e NODE_ENV=production -e RESEND_API_KEY=re_dummy_not_real -e DATABASE_URL="$URL" "$APP_IMAGE" >/dev/null
unset URL
for _ in $(seq 60); do curl -s -m1 -o /dev/null "localhost:$PORT/api/health/live" && break; sleep 0.5; done
expected="$(awk '$1=="public.users"{print $2}' "$BASE.counts")"
count="$(curl -s -m 15 "localhost:$PORT/api/users/count")"
t2=$(now)
echo "   app: /api/users/count $count (inaasahan: {\"count\":$expected})"
[[ "$count" == "{\"count\":$expected}" ]] || { echo "❌ Mali ang sagot ng app" >&2; exit 1; }
echo "⏱️  Mula sa sira hanggang tama ulit ang sagot ng app: $(secs "$t_break" "$t2")s (restore lang: $(secs "$t0" "$t1")s)"
