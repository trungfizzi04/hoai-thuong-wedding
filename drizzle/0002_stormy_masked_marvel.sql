ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "zalo_is_sensitive" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "zalo_raw_profile" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");