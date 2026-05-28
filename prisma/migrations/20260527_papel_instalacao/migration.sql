ALTER TABLE "AmbientePapelOrcamento" ADD COLUMN IF NOT EXISTS "instalacao" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AmbientePapelOrcamento" ADD COLUMN IF NOT EXISTS "custoInstalacao" DECIMAL(10,2);
