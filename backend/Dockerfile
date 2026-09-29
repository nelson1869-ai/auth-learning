# =============================================================================
# 🐳 Backend image — DALAWANG stage (Day 88). Wala pa ring build step: si Node 24 mismo ang nagpapatakbo ng .ts (D-018).
#
#   1. deps    — ang opisyal na node image (may npm): `npm ci --omit=dev` lang
#   2. runtime — malinis na Alpine + ang `node` binary + node_modules + code. WALANG npm, npx, corepack, yarn, C headers,
#                package manager (apk), OpenSSL/zlib ng system (naka-embed na sa node)
#
# Bakit hindi na lang `rm -rf` sa iisang stage (gaya dati)? Ang pagbura sa BAGONG layer ay nagtatago lang ng file —
# nasa ibabang layer pa rin ito, kaya hindi lumiliit ang image (sinukat: 24.6kB na layer, 332MB pa rin).
# Sa multi-stage, ang hindi kinopya ay wala talaga.
#
# ⚠️ PAREHONG Alpine version sa dalawang stage (3.24): ang `node` binary ay binuo para sa libstdc++ ng version na iyon.
#    Magkasama silang ina-update ng Dependabot (iisang group sa .github/dependabot.yml)
# =============================================================================
FROM node:24-alpine3.24 AS deps
WORKDIR /app
# package*.json MUNA: naka-cache ang layer ng npm ci, uulit lang kapag nagbago ang dependencies
COPY package.json package-lock.json ./
# --omit=dev: walang typescript/vitest/drizzle-kit/nodemon sa production
RUN npm ci --omit=dev && npm cache clean --force

FROM alpine:3.24
# Iniuugnay ang image sa repo sa GitHub (GHCR) — makikita kung saang code ito galing
LABEL org.opencontainers.image.source=https://github.com/nelson1869-ai/auth-learning

# Ang kailangan lang ng `node` (sinuri gamit ang `ldd`): musl (nasa Alpine na), libstdc++ at libgcc.
# Tapos, sa PAREHONG layer (para talagang wala), inaalis ang package manager at ang mga library na IYON lang ang gumagamit:
# apk-tools, libapk, ssl_client (TLS ng busybox wget), libssl3, libcrypto3, zlib — kasama ang mga CVE nila (zlib: High, Day 88).
# Naiiwan ang busybox (shell): kailangan ng HEALTHCHECK at ng `docker exec … sh` sa pag-debug — sadyang trade-off (D-030)
# User `node` (UID 1000), gaya ng opisyal na image; ang code ay pag-aari ng root → hindi ito mababago ng app
RUN apk add --no-cache libstdc++ \
  && apk del --no-cache apk-tools libapk ssl_client libssl3 libcrypto3 zlib \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node

COPY --from=deps /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
# "type": "module" — kailangan ng node para basahin ang src/*.ts bilang ESM
COPY package.json ./
# Ang code lang — ang .dockerignore ang nag-aalis ng tests, .env at iba pa
COPY src ./src
# Ang mga migration (SQL) — pinapatakbo ng `node src/db/migrate.ts` bago i-restart ang app (Day 37)
COPY drizzle ./drizzle

# Huwag tumakbo bilang root: kung may butas ang app, limitado ang magagawa ng attacker
USER node

EXPOSE 3000

# Walang curl sa alpine — Node na mismo ang sumusuri kung buhay ang server.
# LIVENESS lang (Day 80): walang database — kung hindi, bawat 30s ay gigisingin ang Neon at hindi na ito makakatulog
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health/live').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Mga secret (DATABASE_URL, JWT_PRIVATE_KEY, CLIENT_URL…) ay ibinibigay sa pagpapatakbo
# (docker run --env-file / compose env_file) — HINDI kailanman nasa loob ng image.
# Walang ENTRYPOINT (ang opisyal na image ay may docker-entrypoint.sh): ang `node` ay direktang PID 1,
# at gumagana pa rin ang `docker run IMAGE node src/db/migrate.ts` ng deploy.sh
CMD ["node", "src/index.ts"]
