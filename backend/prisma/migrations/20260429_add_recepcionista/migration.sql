-- Add RECEPCIONISTA to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RECEPCIONISTA';

-- Add recepcionista_id to atendimentos
ALTER TABLE "atendimentos"
  ADD COLUMN IF NOT EXISTS "recepcionista_id" TEXT
  REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
