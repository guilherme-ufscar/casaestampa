"""Aplica o schema das persianas direto via psycopg2 (bypass Prisma engine)."""
import psycopg2

DATABASE_URL = "postgresql://postgres.eqouuvhwbcqzerbywvos:CoderMaster20262026@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

SQL = """
CREATE TABLE IF NOT EXISTS "Persiana" (
    "id" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "colecao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "codigo" TEXT,
    "larguraMaxima" DECIMAL(6,2),
    "valorM2" DECIMAL(10,2) NOT NULL,
    "minM2" DECIMAL(5,2) NOT NULL DEFAULT 1.50,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Persiana_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AcessorioPersiana" (
    "id" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorMetro" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AcessorioPersiana_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MotorPersiana" (
    "id" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "marca" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "larguraMax" DECIMAL(6,2),
    "cargaMaxKg" DECIMAL(6,2),
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "MotorPersiana_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ControleRemotoPersiana" (
    "id" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "canais" INTEGER,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ControleRemotoPersiana_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AmbientePersianaOrcamento" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "nomeAmbiente" TEXT NOT NULL,
    "persianaId" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "colecao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "largura" DECIMAL(6,2) NOT NULL,
    "altura" DECIMAL(6,2) NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "lado" TEXT,
    "acionamento" TEXT NOT NULL,
    "instalacaoLocal" TEXT,
    "trilhoLargura" DECIMAL(6,2),
    "bandoId" TEXT,
    "bandoNome" TEXT,
    "bandoValorMetro" DECIMAL(10,2),
    "bandoLado" TEXT,
    "guiaLateralId" TEXT,
    "guiaLateralNome" TEXT,
    "guiaLateralValorMetro" DECIMAL(10,2),
    "guiaLateralFator" INTEGER,
    "guiaBaseId" TEXT,
    "guiaBaseNome" TEXT,
    "guiaBaseValorMetro" DECIMAL(10,2),
    "motorId" TEXT,
    "motorNome" TEXT,
    "motorValor" DECIMAL(10,2),
    "controleRemotoId" TEXT,
    "controleRemotoNome" TEXT,
    "controleRemotoValor" DECIMAL(10,2),
    "m2Calculado" DECIMAL(10,4) NOT NULL,
    "m2Cobrado" DECIMAL(10,4) NOT NULL,
    "custoPersiana" DECIMAL(10,2) NOT NULL,
    "custoBando" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoGuiaLateral" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoGuiaBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoMotor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoControle" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoInstalacaoMotor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoInstalacao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoTotal" DECIMAL(10,2) NOT NULL,
    "precoFinalVenda" DECIMAL(10,2) NOT NULL,
    "instalacao" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    CONSTRAINT "AmbientePersianaOrcamento_pkey" PRIMARY KEY ("id")
);
"""

FK_SQL = [
    ('AmbientePersianaOrcamento_orcamentoId_fkey',
     'ALTER TABLE "AmbientePersianaOrcamento" ADD CONSTRAINT "AmbientePersianaOrcamento_orcamentoId_fkey" '
     'FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;'),
    ('AmbientePersianaOrcamento_persianaId_fkey',
     'ALTER TABLE "AmbientePersianaOrcamento" ADD CONSTRAINT "AmbientePersianaOrcamento_persianaId_fkey" '
     'FOREIGN KEY ("persianaId") REFERENCES "Persiana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;'),
]


def main():
    print("Conectando...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    print("Criando tabelas (IF NOT EXISTS)...")
    cur.execute(SQL)

    print("Adicionando FKs (se ainda não existem)...")
    for name, stmt in FK_SQL:
        cur.execute("""
            SELECT 1 FROM pg_constraint WHERE conname = %s
        """, (name,))
        if cur.fetchone():
            print(f"  - {name} já existe, pulando")
        else:
            cur.execute(stmt)
            print(f"  + {name} adicionada")

    print("\nVerificando tabelas criadas:")
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_name LIKE '%Persiana%'
        ORDER BY table_name
    """)
    for (t,) in cur.fetchall():
        print(f"  ✓ {t}")

    cur.close()
    conn.close()
    print("\n✅ Migration aplicada com sucesso.")


if __name__ == "__main__":
    main()
