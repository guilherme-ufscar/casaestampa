#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige dados RioFlex:
  1. Atualiza guias laterais RioFlex para preço de PAR (Branca 80, Preta/Bege/Cinza 90, Estrelinha 100).
  2. Popula 'codigo' (coluna COR) das persianas RioFlex (Rolo/Romana/Painel).
  3. Recria PAINEL_SEM_HASTES e PAINEL_COM_HASTES da aba 'Cortina Painel' com preços corretos.
Run: python scripts/fix-rioflex.py
"""
import psycopg2, openpyxl, re, sys

DB_URL = "postgresql://postgres.eqouuvhwbcqzerbywvos:CoderMaster20262026@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
XLSX = r"D:\coder\casaestampa\alteracoes\TABELA PERSIANA RIOFLEX.xlsx"


def parse_preco(s):
    if s is None:
        return None
    s = str(s)
    m = re.findall(r"(\d+(?:[.,]\d+)?)", s.replace(".", "").replace(",", "."))
    return float(m[0]) if m else None


def base_key(colecao):
    if not colecao:
        return ""
    c = str(colecao).split("(")[0].strip().upper()
    return c


def run():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    conn = psycopg2.connect(DB_URL, sslmode="require")
    cur = conn.cursor()

    # ── 1. Guias laterais RioFlex → preço de par ──────────────────────────────
    guia_precos = {
        "Guia Lateral Par Branca 5,5cm": 80.00,
        "Guia Lateral Par Preta/Bege/Cinza 5,5cm": 90.00,
        "Guia Lateral Par Estrelinha 8cm Branca": 100.00,
    }
    for nome, valor in guia_precos.items():
        cur.execute(
            'UPDATE "AcessorioPersiana" SET "valorMetro"=%s WHERE fornecedor=%s AND nome=%s',
            (valor, "RIOFLEX", nome),
        )
    print("Guias laterais RioFlex atualizadas para par.")

    # ── 2. Mapa de codigos (COR) e larguras a partir da aba Persiana Rolo ──────
    codigo_map = {}
    larg_map = {}
    ws = wb["Persiana Rolo"]
    for row in ws.iter_rows(min_row=4, values_only=True):
        colecao, cor, larg, _ = row[0], row[1], row[2], row[3]
        if not colecao or str(colecao).strip().startswith(("1 ", "2 ", "Prazo")):
            continue
        bk = base_key(colecao)
        if bk and cor:
            codigo_map[bk] = str(cor).replace("\n", " ").strip()
        if bk and larg:
            lm = re.findall(r"(\d+(?:[.,]\d+)?)\s*m", str(larg))
            if lm:
                larg_map[bk] = float(lm[-1].replace(",", "."))

    # Atualiza codigo das persianas RioFlex existentes (Rolo/Romana)
    cur.execute('SELECT id, colecao FROM "Persiana" WHERE fornecedor=%s', ("RIOFLEX",))
    rows = cur.fetchall()
    upd = 0
    for pid, colecao in rows:
        cod = codigo_map.get(base_key(colecao))
        if cod:
            cur.execute('UPDATE "Persiana" SET codigo=%s WHERE id=%s', (cod[:255], pid))
            upd += 1
    print(f"Codigos atualizados em {upd} persianas RioFlex.")

    # ── 3. Recria painéis RioFlex a partir da aba Cortina Painel ──────────────
    cur.execute('DELETE FROM "Persiana" WHERE fornecedor=%s AND tipo IN (%s,%s)',
                ("RIOFLEX", "PAINEL_COM_HASTES", "PAINEL_SEM_HASTES"))

    ws = wb["Cortina Painel"]
    inseridos = 0
    for row in ws.iter_rows(min_row=4, values_only=True):
        colecao, cor, sem, com = row[0], row[1], row[2], row[3]
        if not colecao:
            continue
        cl = str(colecao).strip()
        if cl.startswith(("1 ", "2 ", "Prazo")) or "TABELA" in cl.upper() or "COLE" in cl.upper():
            continue
        preco_sem = parse_preco(sem)
        preco_com = parse_preco(com)
        codigo = str(cor).replace("\n", " ").strip()[:255] if cor else None
        larg = larg_map.get(base_key(colecao))
        for tipo, preco in (("PAINEL_SEM_HASTES", preco_sem), ("PAINEL_COM_HASTES", preco_com)):
            if preco is None:
                continue
            cur.execute(
                '''INSERT INTO "Persiana" (id, fornecedor, tipo, colecao, modelo, codigo, "valorM2", "minM2", "larguraMaxima", ativo)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, %s, true)''',
                ("RIOFLEX", tipo, cl, "PAINEL", codigo, preco, 1.5, larg),
            )
            inseridos += 1
    print(f"Paineis RioFlex inseridos: {inseridos}")

    conn.commit()
    cur.close()
    conn.close()
    print("OK")


if __name__ == "__main__":
    run()
