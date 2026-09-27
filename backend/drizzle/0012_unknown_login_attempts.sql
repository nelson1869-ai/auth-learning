CREATE TABLE "unknown_login_attempts" (
	"email_hash" text PRIMARY KEY NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL
);
