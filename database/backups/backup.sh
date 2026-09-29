#!/usr/bin/env bash
# =============================================================================
# 💾 Sariling backup ng production database (Day 91) — sa LABAS ng Neon
#
#   database/backups/backup.sh [label]      # hal. label = "pre-deploy-<sha>"
#
# Bakit, kung may point-in-time restore na ang Neon? Ang Neon (Free plan) ay 6 na ORAS lang ang history,
# at nasa iisang account. Kapag napansin ang maling pagbura pagkalipas ng 6 na oras (hal. bug sa retention job),
# o nagkaproblema ang account, wala nang maibabalik. Ang dump na ito ay nasa PC, may sariling haba ng panahon.
#
# Ang lumalabas (sa $BACKUP_DIR, default ~/backups/auth-learning — HINDI sa repo, 700/600 ang permission):
#   <oras>.dump    pg_dump --format=custom (para sa pg_restore)
#   <oras>.counts  bilang ng row bawat table sa oras ng backup — pang-verify ng restore
#   <oras>.sha256  checksum ng .dump — para malaman kung sira ang file bago umasa rito
# 🔐 May personal na data ang dump (email, password HASH, IP sa audit logs). Huwag ilagay sa Git, cloud drive o chat.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."

DEST="${BACKUP_DIR:-$HOME/backups/auth-learning}"
KEEP="${BACKUP_KEEP:-14}"            # ilang dump ang itatago (ang pinakaluma ang binubura)
ENV_FILE=backend/.env.production     # DATABASE_URL ng Neon — hindi kailanman ipinapakita
IMAGE=postgres:17-alpine             # PAREHONG major version ng Neon (17) — ang pg_dump ay hindi puwedeng mas luma sa server

umask 077
# Magkahiwalay na linya: sa `a && b`, HINDI humihinto ang `set -e` kapag pumalya ang `a` (nahuli noong Day 91:
# pumalya ang mkdir pero tumuloy sa docker run)
mkdir -p "$DEST"
chmod 700 "$DEST"
NAME="$(date -u +%Y%m%dT%H%M%SZ)${1:+-$1}"

# Bilang ng row bawat table (public + drizzle), sa IISANG query — ikukumpara ng restore-drill.sh
COUNT_SQL="select table_schema || '.' || table_name || ' ' ||
  (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
  from information_schema.tables where table_schema in ('public', 'drizzle') and table_type = 'BASE TABLE' order by 1"

# Sa loob ng container (walang pg_dump sa PC). PGSSLROOTCERT=system: sslmode=verify-full gamit ang mga CA ng system.
# umask 077 SA LOOB: hindi umaabot sa container ang umask ng PC (nahuli: 644 ang unang dump)
docker run --rm --env-file "$ENV_FILE" -e PGSSLROOTCERT=system -e NAME="$NAME" -e COUNT_SQL="$COUNT_SQL" \
  -v "$DEST:/out" --user "$(id -u):$(id -g)" "$IMAGE" sh -euc '
    umask 077
    pg_dump --format=custom --no-owner --no-privileges --file "/out/$NAME.dump" "$DATABASE_URL"
    psql "$DATABASE_URL" -Atc "$COUNT_SQL" > "/out/$NAME.counts"
  '
( cd "$DEST" && sha256sum "$NAME.dump" > "$NAME.sha256" )

# Retention ng mga backup: ang pinakabagong $KEEP lang
ls -1t "$DEST"/*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  rm -f "$old" "${old%.dump}.counts" "${old%.dump}.sha256"
done

echo "💾 $DEST/$NAME.dump ($(du -h "$DEST/$NAME.dump" | cut -f1), $(wc -l < "$DEST/$NAME.counts") table)"
