ALTER TABLE "public"."clients" ADD COLUMN IF NOT EXISTS "telegram_chat_id" text;
ALTER TABLE "public"."clients" ADD COLUMN IF NOT EXISTS "telegram_connected_at" timestamp with time zone;
