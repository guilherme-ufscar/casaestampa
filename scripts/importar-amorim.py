#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importa as persianas do fornecedor AMORIM (TABELA PERSIANAS AMORIM 2026 v.03).
Parser genérico: detecta o cabeçalho (ITEM/COLEÇÃO/COR/LAR.MAX/VALOR À VISTA),
trata coleção mesclada (carrega para baixo) e usa a coluna "VALOR À VISTA (R$)/M²".
Run: python scripts/importar-amorim.py
"""
import psycopg2, openpyxl, re

DB_URL = "postgresql://postgres.eqouuvhwbcqzerbywvos:CoderMaster20262026@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
XLSX = r"D:\coder\casaestampa\alteracoes2\TABELA PERSIANAS AMORIM 2026 - v.03 (1).xlsx"

# keyword no nome da aba -> tipo de persiana
SHEET_TIPOS = [
    ("Rolô", "ROLO"),
    ("Premium", "ROLO"),
    ("Romana", "ROMANA"),
    ("Painel", "PAINEL_COM_HASTES"),
    ("Teto", "ROLO"),
    ("Soltis", "ROLO"),
    ("Vertical", "VERTICAL"),
    ("PH Alum", "HORIZONTAL_25"),
    ("PH 50", "HORIZONTAL_50"),
    ("PH 75", "HORIZONTAL_75"),
    ("Celular", "CELULAR"),
    ("Plissada", "PLISSADA"),
]


def to_float(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).replace("R$", "").strip()
    m = re.findall(r"(\d+(?:[.,]\d+)?)", s.replace(".", "").replace(",", "."))
    return float(m[0]) if m else None


def header_indices(row):
    idx = {}
    for i, c in enumerate(row):
        if c is None:
            continue
        t = str(c).strip().upper()
        if t == "ITEM":
            idx["item"] = i
        elif "COLE" in t:
            idx["colecao"] = i
        elif t == "COR":
            idx["cor"] = i
        elif "LAR" in t and "MAX" in t.replace(".", "").replace(" ", "") + t:
            idx["lar"] = i
        elif "LAR" in t:
            idx.setdefault("lar", i)
        elif "VALOR" in t and "VISTA" in t:
            idx["valor"] = i
    return idx


def run():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    conn = psycopg2.connect(DB_URL, sslmode="require")
    cur = conn.cursor()

    # Limpa importações Amorim anteriores
    cur.execute('DELETE FROM "Persiana" WHERE fornecedor=%s', ("AMORIM",))

    total = 0
    for kw, tipo in SHEET_TIPOS:
        sheet = next((s for s in wb.sheetnames if kw.lower() in s.lower()), None)
        if not sheet:
            continue
        ws = wb[sheet]
        rows = list(ws.iter_rows(values_only=True))
        # acha cabeçalho
        hidx = None
        for r in rows:
            if r and any(str(c).strip().upper() == "ITEM" for c in r if c is not None):
                cand = header_indices(r)
                if "valor" in cand and "colecao" in cand:
                    hidx = cand
                    header_row = r
                    break
        if not hidx:
            continue
        start = rows.index(header_row) + 1
        col_col = hidx["colecao"]
        col_cor = hidx.get("cor", col_col + 2)
        col_lar = hidx.get("lar")
        col_val = hidx["valor"]

        atual = None
        inseridos_sheet = 0
        for r in rows[start:]:
            if not r:
                continue
            def get(i):
                return r[i] if i is not None and i < len(r) else None
            col_v = get(col_col)
            if col_v is not None and str(col_v).strip():
                txt = str(col_v).strip()
                if "TABELA" in txt.upper() or "CONFORMIDADE" in txt.upper() or txt.upper().startswith("CORTINA"):
                    continue
                atual = re.sub(r"\s+", " ", txt)
            valor = to_float(get(col_val))
            if not atual or valor is None or valor <= 0:
                continue
            cor = get(col_cor)
            modelo = re.sub(r"\s+", " ", str(cor).strip()) if cor and str(cor).strip() else "PADRÃO"
            larmax = to_float(get(col_lar))
            if larmax is not None and (larmax <= 0 or larmax > 10):
                larmax = None
            # evita duplicado
            cur.execute(
                'SELECT id FROM "Persiana" WHERE fornecedor=%s AND tipo=%s AND colecao=%s AND modelo=%s',
                ("AMORIM", tipo, atual, modelo[:255]),
            )
            if cur.fetchone():
                continue
            cur.execute(
                '''INSERT INTO "Persiana" (id, fornecedor, tipo, colecao, modelo, "valorM2", "minM2", "larguraMaxima", ativo)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, true)''',
                ("AMORIM", tipo, atual[:255], modelo[:255], valor, 1.5, larmax),
            )
            inseridos_sheet += 1
            total += 1
        print(f"  {sheet} ({tipo}): {inseridos_sheet}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"OK - {total} persianas Amorim inseridas.")


if __name__ == "__main__":
    run()
