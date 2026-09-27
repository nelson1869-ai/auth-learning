-- Day 69: bago gawin ang mga UNIQUE index, linisin ang mga dati nang doble (kung mayroon) — kung hindi, papalya ang migration.
-- Iniwan ang PINAKABAGO (pinakamataas na id) bilang aktibo. Noong 2026-09-27: 0 doble sa dev at production.
UPDATE "verification_tokens" SET "used_at" = now()
WHERE "used_at" IS NULL AND "id" NOT IN (
  SELECT max("id") FROM "verification_tokens" WHERE "used_at" IS NULL GROUP BY "user_id", "purpose"
);--> statement-breakpoint
UPDATE "refresh_tokens" SET "revoked_at" = now(), "revoke_reason" = 'rotated'
WHERE "revoked_at" IS NULL AND "id" NOT IN (
  SELECT max("id") FROM "refresh_tokens" WHERE "revoked_at" IS NULL GROUP BY "family_id"
);--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_one_active_per_family_idx" ON "refresh_tokens" USING btree ("family_id") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_one_active_idx" ON "verification_tokens" USING btree ("user_id","purpose") WHERE used_at IS NULL;