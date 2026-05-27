-- CreateTable
CREATE TABLE "PapelParede" (
    "id" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "dimensao" TEXT NOT NULL,
    "valorRolo" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PapelParede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbientePapelOrcamento" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "nomeAmbiente" TEXT NOT NULL,
    "papelId" TEXT NOT NULL,
    "medicoes" JSONB NOT NULL,
    "metrosQuadrados" DECIMAL(10,2),
    "quantidadeRolos" INTEGER,
    "custoTotal" DECIMAL(10,2),
    "precoFinalVenda" DECIMAL(10,2),
    "observacoes" TEXT,

    CONSTRAINT "AmbientePapelOrcamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AmbientePapelOrcamento" ADD CONSTRAINT "AmbientePapelOrcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbientePapelOrcamento" ADD CONSTRAINT "AmbientePapelOrcamento_papelId_fkey" FOREIGN KEY ("papelId") REFERENCES "PapelParede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
