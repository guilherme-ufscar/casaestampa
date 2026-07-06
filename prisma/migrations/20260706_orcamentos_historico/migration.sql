ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "origemHistorico" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "numeroHistorico" INTEGER;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "servicoHistorico" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "descricaoHistorico" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "instaladorId" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "instaladorNomeOriginal" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "vendedorNomeOriginal" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN IF NOT EXISTS "indicacaoHistorica" TEXT;

ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_instaladorId_fkey" FOREIGN KEY ("instaladorId") REFERENCES "Instalador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
