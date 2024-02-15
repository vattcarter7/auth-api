ALTER TABLE "users" ALTER COLUMN "verification_code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "verification_code" SET NOT NULL;