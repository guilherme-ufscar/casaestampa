#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importa o catálogo de pisos (Tabela BADIA B3) para a tabela ProdutoPiso.
Run: python scripts/importar-pisos.py
"""
import psycopg2

DB_URL = "postgresql://postgres.eqouuvhwbcqzerbywvos:CoderMaster20262026@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

# (categoria, modelo, unidade, valor, medidaPeca, rendimento)
LAMINADO = [
    ("PRIME CLICK EUCAFLOOR", 56.73), ("PRIME COLADO", 54.65), ("GRAN ELEGANCE", 79.50),
    ("NEW EVIDENCE", 57.32), ("SQUARE", 63.26), ("MAX ELEGANCE", 75.71), ("NEW WAY", 60.35),
    ("SPOT", 58.68), ("UNIQUE *RESISTENTE A AGUA*", 93.15), ("STUDIO", 93.15), ("NATURE", 73.24),
    ("LINK", 79.72), ("STREET", 86.41), ("MATA ATLANTICA", 54.56), ("FLOREST FIT", 59.33),
    ("MATA ATLANTICA PV", 56.57), ("SMART", 92.29), ("PREMIERE *RESISTENTE A AGUA*", 79.12),
    ("ELIGNA WIDE", 108.16), ("VISION", 112.97), ("IMPRESSIVE", 162.20), ("CLASSIC", 66.42),
]

MANTAS = [
    ("MANTA SIMPLES 1MM", 3.97), ("MANTA SIMPLES 2MM", 4.84), ("MANTA SIMPLES GROSSA 4MM", 6.64),
    ("MANTA LISA DURAFLOOR 2MM", 6.46), ("MANTA RECICLADA DURAFLOOR 2,5", 7.61),
    ("MANTA LISA EUCAFLOOR 2MM", 7.94), ("MANTA LISA QUICK-STEP 2MM", 7.97),
    ("MANTA VINYL COMFORT QUICK-STEP", 7.97), ("MANTA STANDARD QUICK-STEP", 7.97),
    ("MANTA UNISOUND", 43.84), ("MANTA DURASILENT BLACK PLACA 1,80", 52.34),
]

RODAPE_LAMINADO = [
    ("RODAPE 5 CM ESTILO", 19.86), ("RODAPE 7 CM ESTILO", 23.85), ("RODAPE 7 CM BRANCO", 24.71),
    ("RODAPE 10 CM ESTILO MAX", 38.79), ("CORDAO", 18.30), ("RODAPE BORDER", 31.22),
    ("RODAPE CINQ", 24.00), ("RODAPE MIDI", 28.31), ("RODAPE NOBLE", 53.29), ("RODAPE FIXO", 17.93),
    ("RODAPE CLEAN", 26.20), ("RODAPE EASY Y01 80", 29.27), ("RODAPE EASY Y01 120 (2100 mm)", 41.80),
    ("RODAPE SANTA LUZIA RODAMEIO 30MM", 34.74), ("RODAPE SANTA LUZIA 70MM LEV", 46.32),
    ("RODAPE SANTA LUZIA 100MM LEV", 71.52), ("RODAPE SANTA LUZIA 150MM LEV", 108.65),
    ("RODAPE SANTA LUZIA 150MM", 148.26), ("RODAPE SANTA LUZIA 100MM", 97.61),
    ("RODAPE SANTA LUZIA 70MM", 70.64),
]

PERFIS = [
    ("PERFIL T (TRANSICAO)", 49.70), ("PERFIL R (REDUTOR)", 66.57), ("FRONTAL ESCADA", 115.60),
    ("PISO PAREDE", 65.70), ("CANTONEIRA", 15.38), ("PERFIL INCIZO", 80.89),
    ("PERFIL T (DURAFLOOR)", 45.26), ("PERFIL R (DURAFLOOR)", 51.22), ("PISO PAREDE (DURAFLOOR)", 42.76),
    ("FRONTAL ESCADA (DURAFLOOR)", 76.33), ("CANTONEIRA (DURAFLOOR)", 13.60),
]

VINILICO = [
    ("ECO HOME 2MM", 60.91), ("ECO HARD 3MM", 97.59), ("ECO PREMIUM 4MM", 130.59),
    ("ECO DESIGN 6,5MM", 163.01), ("ECO SQUARE 3MM PLACA", 105.42), ("INJOY", 93.96),
    ("INJOY ROSEO", 120.40), ("ESSENCE HIT", 127.54), ("ENC AMBIENTA", 145.08),
    ("ENC ESSENCE 30", 148.23), ("ENC AMBIENTA SERIES", 170.50), ("AMBIENTA TECH", 176.45),
    ("ESSENCE TECH", 174.61), ("ELEMENTAR", 79.06), ("PERSONNALITE", 79.94), ("VITAL", 89.99),
    ("MAXIMUM", 102.36), ("IMPONENTE", 118.99), ("QUADRATTA PRO", 135.76),
    ("QUADRATTA PRO MARMORIZADO", 138.51), ("NATIVA", 150.00),
    ("LINHA VITA (BIANCOGRES) 19X130", 65.21), ("LINHA NUOVA (BIANCOGRES) 180X1220 CLICK", 130.82),
    ("LINHA HOME (BIANCOGRES) 94X94", 80.19), ("LINHA NOBILE (BIANCOGRES) 2,5MM", 108.54),
]

RODAPE_VINILICO = [
    ("RODAPE 3 CM", 29.64), ("RODAPE 7 CM", 38.79), ("RODAPE 10 CM", 66.11), ("RODAPE 15 CM", 94.25),
]

# Colas vinílicas (galão) — rendimento 12 m²/galão
COLAS = [
    ("COLA VINILICA GLOBALFIX 4KG", 119.56), ("COLA VINILICA PROTEC 4KG", 126.36),
    ("COLA VINILICA RAFAELA 4KG", 100.44), ("COLA VINILICA QUARTZOLIT 4KG", 124.46),
    ("COLA VINILICA MAPEI 4KG", 171.61),
]

# Massas niveladoras (saco) — rendimento 10 m²/saco
MASSAS = [
    ("FLOOR FIX NIVELANTE SC 20KG", 65.21, 10), ("PROTEC NIVELANTE SC 20KG", 82.62, 10),
    ("QUARTZOLIT NIVELANTE SC 20KG", 102.45, 10), ("NOVOPLAN NIVELANTE SC 20KG", 115.44, 10),
    ("PREPARA PRO QUARTZOLIT (ROXA) SC 10KG", 150.97, 10),
]

CHAPAS = [
    ("BASE DE FIXACAO ALUMINIO S1800", 15.92), ("CHAPA ALUMINIO A100", 21.44),
    ("CANTONEIRA 16X16", 21.86), ("AMERICANO SEM GARRA", 26.51), ("CHAPA ALUMINIO B200", 27.40),
    ("CANTONEIRA 3X0,7", 30.52), ("REDUTOR ALUMINIO LAMINADO", 31.48), ("AMERICANO COM GARRA", 32.63),
    ("FRONTAL DE ESCADA VINILICO", 33.14), ("REDUTOR ALUMINIO VINILICO 2MM", 36.33),
    ("REDUTOR ALUMINIO VINILICO 3,2MM", 42.66), ("CANTONEIRA ALUMINIO 5X3", 53.51),
    ("PERFIL T ALUMINIO LAMINADO", 31.63), ("CANTONEIRA ALUMINIO POLIDO 20X20", 159.36),
]

PREGOS = [
    ("PREGO 10X10", 17.20), ("PREGO 10X11", 17.20), ("PREGO 15X15", 17.20), ("PREGO 17X18", 20.82),
]

OUTROS = [
    ("COLA PARA RODAPE RAFAELA 1KG", 28.67), ("COLA PARA RODAPE RAFAELA 5KG", 129.60),
]


def run():
    conn = psycopg2.connect(DB_URL, sslmode="require")
    cur = conn.cursor()
    total = 0

    def insert(categoria, modelo, unidade, valor, medida=None, rendimento=None):
        nonlocal total
        cur.execute('SELECT id FROM "ProdutoPiso" WHERE categoria=%s AND modelo=%s', (categoria, modelo))
        if cur.fetchone():
            return
        cur.execute(
            '''INSERT INTO "ProdutoPiso" (id, categoria, fabricante, modelo, unidade, valor, "medidaPeca", rendimento, ativo)
               VALUES (gen_random_uuid()::text, %s, 'BADIA', %s, %s, %s, %s, %s, true)''',
            (categoria, modelo, unidade, valor, medida, rendimento)
        )
        total += 1

    for m, v in LAMINADO: insert("LAMINADO", m, "M2", v)
    for m, v in VINILICO: insert("VINILICO", m, "M2", v)
    for m, v in MANTAS: insert("MANTA", m, "M2", v)
    for m, v in RODAPE_LAMINADO: insert("RODAPE_LAMINADO", m, "PC", v, 2.10)
    for m, v in RODAPE_VINILICO: insert("RODAPE_VINILICO", m, "PC", v, 2.10)
    for m, v in PERFIS: insert("PERFIL", m, "PC", v, 2.10)
    for m, v in COLAS: insert("COLA", m, "GALAO", v, None, 12)
    for m, v, r in MASSAS: insert("MASSA", m, "SACO", v, None, r)
    for m, v in CHAPAS: insert("CHAPA", m, "METRO", v)
    for m, v in PREGOS: insert("PREGO", m, "PCT", v)
    for m, v in OUTROS: insert("OUTROS", m, "UN", v)

    # Configs de cálculo de piso
    configs = [
        ("markup_piso", "35"),
        ("instalacao_piso_laminado_m2", "25"),
        ("instalacao_piso_vinilico_m2", "30"),
        ("cola_vinilica_rendimento_m2", "12"),
        ("massa_niveladora_rendimento_m2", "10"),
    ]
    for chave, valor in configs:
        cur.execute('SELECT id FROM "ConfiguracaoCalculo" WHERE chave=%s', (chave,))
        if not cur.fetchone():
            cur.execute('INSERT INTO "ConfiguracaoCalculo" (id, chave, valor) VALUES (gen_random_uuid()::text, %s, %s)', (chave, valor))

    conn.commit()
    cur.close()
    conn.close()
    print(f"OK - {total} produtos de piso inseridos.")


if __name__ == "__main__":
    run()
