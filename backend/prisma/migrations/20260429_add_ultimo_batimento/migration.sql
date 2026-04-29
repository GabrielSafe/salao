-- Add ultimo_batimento column to funcionarias table
ALTER TABLE "funcionarias" ADD COLUMN IF NOT EXISTS "ultimo_batimento" TIMESTAMP(3);
