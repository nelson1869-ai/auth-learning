# =============================================================================
# 🐳 Backend image — ISANG stage lang: walang build step, si Node 24 mismo ang
# nagpapatakbo ng .ts (D-018). Ikumpara sa reference: 2 stages (tsc → dist/).
# =============================================================================
FROM node:24-alpine
# Iniuugnay ang image sa repo sa GitHub (GHCR) — makikita kung saang code ito galing
LABEL org.opencontainers.image.source=https://github.com/nelson1869-ai/auth-learning
WORKDIR /app
ENV NODE_ENV=production

# package*.json MUNA, saka ang source: naka-cache ang layer ng npm ci, at uulit
# lang ito kapag nagbago ang dependencies — hindi sa bawat pagbabago ng code
COPY package.json package-lock.json ./
# --omit=dev: walang typescript/vitest/drizzle-kit/nodemon sa production
RUN npm ci --omit=dev && npm cache clean --force

# Hindi kailangan ang npm/npx/corepack sa runtime (CMD ay `node` na direkta).
# Mas maliit ang image, at nawawala ang mga CVE sa loob ng npm mismo (aral ng reference)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
  /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Ang code lang — ang .dockerignore ang nag-aalis ng tests, .env at iba pa
COPY src ./src
# Ang mga migration (SQL) — pinapatakbo ng `node src/db/migrate.ts` bago i-restart ang app (Day 37)
COPY drizzle ./drizzle

# Huwag tumakbo bilang root: kung may butas ang app, limitado ang magagawa ng attacker
USER node

EXPOSE 3000

# Walang curl sa alpine — Node na mismo ang sumusuri kung buhay ang server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Mga secret (DATABASE_URL, JWT_SECRET, CLIENT_URL) ay ibinibigay sa pagpapatakbo
# (docker run --env-file / compose env_file) — HINDI kailanman nasa loob ng image
CMD ["node", "src/index.ts"]
