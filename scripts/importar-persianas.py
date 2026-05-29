#!/usr/bin/env python3
"""
Populates persiana catalog in the database.
Data sourced from _dump.txt (extracted from xlsx files).

Run: python scripts/importar-persianas.py
"""

import psycopg2
import sys

DB_URL = "postgresql://postgres.eqouuvhwbcqzerbywvos:CoderMaster20262026@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

def get_conn():
    return psycopg2.connect(DB_URL, sslmode="require")

# ─── Persianas (Persiana table) ──────────────────────────────────────────────
PERSIANAS_GABRIEL_ROLO = [
    # (colecao, modelo, valorM2, larguraMaxima, minM2)
    # From TABELA GABRIEL ROLO sheet
    ("ANGKOR", "LARG 2,80m", 99.00, 2.80, 1.50),
    ("ALT. VISION", "LARG 2,20m SOMENTE ROLLUX", 110.00, 2.20, 1.50),
    ("ALT. VISION", "LARG 2,70m SEMI BLACKOUT", 98.00, 2.70, 1.50),
    ("ALT. VISION", "LARG 2,70m SOMENTE ROLLUX", 98.00, 2.70, 1.50),
    ("MIAMI BK", "BLACKOUT LARG 2,50m", 100.00, 2.50, 1.50),
    ("DÖHLER SEM BLACKOUT", "LARG 2,00m", 106.50, 2.00, 1.50),
    ("DÖHLER TIPO PALHA", "LARG 2,00m", 98.00, 2.00, 1.50),
    ("DÖHLER C/ PROTEÇÃO", "PROTEÇÃO ÁGUA E ÓLEO LARG 2,00m", 99.00, 2.00, 1.50),
    ("DOHLER BLACK", "BLACKOUT LARG 2,00m/2,80m", 117.50, 2.80, 1.50),
    ("DOHLER BLACK DIGITAL", "BLACKOUT LARG 3,00m", 124.00, 3.00, 1.50),
    ("DOHLER BLACK DIGITAL INFANTIL", "BLACKOUT LARG 3,00m", 126.50, 3.00, 1.50),
    ("PINPOINT", "BLACKOUT LARG 3,00m", 134.50, 3.00, 1.50),
    ("PINPOINT MATTE", "LARG 1,83m", 134.50, 1.83, 1.50),
    ("FLORENÇA RUSTIC", "LARG 1,80m", 95.50, 1.80, 1.50),
    ("FLORENCE BLACKOUT", "BLACKOUT LARG 1,80m", 146.00, 1.80, 1.50),
    ("JS SCREEN 5%", "LARG 2,50m", 112.00, 2.50, 1.50),
    ("SCREEN 1% (PVC+POLIÉSTER)", "LARG 3,00m", 122.00, 3.00, 1.50),
    ("SCREEN 3% (PVC+POLIÉSTER)", "LARG 3,00m", 117.00, 3.00, 1.50),
    ("SCREEN 5% (PVC+POLIÉSTER)", "LARG 3,00m", 112.00, 3.00, 1.50),
    ("TELA SOLAR 1% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 134.50, 3.00, 1.50),
    ("TELA SOLAR 3% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 128.50, 3.00, 1.50),
    ("TELA SOLAR 5% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 122.50, 3.00, 1.50),
    ("TELA SOLAR 5% GRAFITE", "LARG 3,10m", 122.50, 3.10, 1.50),
    ("TELA SOLAR 8%", "LARG 3,10m", 117.50, 3.10, 1.50),
    ("SCREEN RUSTIC", "LARG 2,43m", 171.00, 2.43, 1.50),
    ("MONTES", "LARG 2,25m", 86.00, 2.25, 1.50),
    ("CETIM", "LARG 2,80m", 143.00, 2.80, 1.50),
    ("LONDRES", "LARG 2,80m", 148.00, 2.80, 1.50),
    ("NOBLETTE I", "LARG 2,80m", 163.00, 2.80, 1.50),
    ("NOBLETTE II", "LARG 2,60m", 163.00, 2.60, 1.50),
    ("NAPOLES BK", "BLACKOUT LARG 2,40m", 128.50, 2.40, 1.50),
    ("TORONTO BK", "BLACKOUT LARG 2,40m", 135.00, 2.40, 1.50),
    ("STUCCO BK", "BLACKOUT LARG 2,80m", 160.00, 2.80, 1.50),
    ("MONTEVIDEU BK", "BLACKOUT LARG 2,00m", 132.00, 2.00, 1.50),
    ("FIBRAS SINTÉTICAS", "LARG 1,75m", 154.00, 1.75, 1.50),
    ("ALT. VISION (DOHLER) PARALELOGRAMA", "LARG 2,25m", 210.00, 2.25, 1.50),
    ("JS ALT. VISION", "LARG 2,50m", 110.00, 2.50, 1.50),
    ("ALT. VISION (DOHLER)", "LARG 2,20m", 148.00, 2.20, 1.50),
    ("ALT. VISION SOFT TRANSLÚCIDO", "LARG 2,95m", 160.00, 2.95, 1.50),
    ("ALT. VISION SEMI BLACK", "LARG 2,20m", 182.00, 2.20, 1.50),
    ("ALT. VISION SCREEN", "LARG 2,50m", 220.00, 2.50, 1.50),
    ("ALT. VISION SONATURA", "LARG 2,80m", 168.00, 2.80, 1.50),
    ("ALT. VISION SEMI BLACK 2,80m", "LARG 2,80m", 265.00, 2.80, 1.50),
    ("SONATINE II", "LARG 2,70m", 296.00, 2.70, 1.50),
    ("ECOLUX", "LARG 2,80m", 225.00, 2.80, 1.50),
    ("LUXURY", "LARG 2,60m BANDO ALUMÍNIO", 225.00, 2.60, 1.50),
    ("BLINDS TOP", "LARG 2,80m BANDO ALUMÍNIO", 225.00, 2.80, 1.50),
]

PERSIANAS_GABRIEL_ROMANA = [
    ("DÖHLER SEM BLACKOUT", "LARG 2,00m/2,80m", 120.00, 2.80, 1.50),
    ("DÖHLER TIPO PALHA", "LARG 2,00m", 107.00, 2.00, 1.50),
    ("DÖHLER C/ PROTEÇÃO", "PROTEÇÃO LARG 2,00m", 94.00, 2.00, 1.50),
    ("DOHLER BLACK", "BLACKOUT LARG 2,00m/2,80m", 123.00, 2.80, 1.50),
    ("DOHLER BLACK DIGITAL", "BLACKOUT LARG 3,00m", 130.00, 3.00, 1.50),
    ("DOHLER BLACK DIGITAL INFANTIL", "BLACKOUT LARG 3,00m", 128.00, 3.00, 1.50),
    ("JS SCREEN 5%", "LARG 2,50m", 125.00, 2.50, 1.50),
    ("SCREEN 1% (PVC+POLIÉSTER)", "LARG 3,00m", 147.00, 3.00, 1.50),
    ("SCREEN 3% (PVC+POLIÉSTER)", "LARG 3,00m", 142.00, 3.00, 1.50),
    ("SCREEN 5% (PVC+POLIÉSTER)", "LARG 3,00m", 140.00, 3.00, 1.50),
    ("TELA SOLAR 1% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 159.00, 3.00, 1.50),
    ("TELA SOLAR 3% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 155.00, 3.00, 1.50),
    ("TELA SOLAR 5% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 150.00, 3.00, 1.50),
    ("TELA SOLAR 5% GRAFITE", "LARG 3,20m", 135.00, 3.20, 1.50),
    ("TELA SOLAR 8%", "LARG 3,20m", 138.00, 3.20, 1.50),
    ("TELA SOLAR RUSTIC", "LARG 2,43m", 195.00, 2.43, 1.50),
    ("BALI", "LARG 1,83m", 99.00, 1.83, 1.50),
    ("MONTES", "LARG 2,25m", 90.00, 2.25, 1.50),
    ("CETIM", "LARG 2,80m", 180.00, 2.80, 1.50),
    ("MIAMI BK", "BLACKOUT LARG 2,50m", 120.00, 2.50, 1.50),
    ("STUCCO BK", "BLACKOUT LARG 2,80m", 163.00, 2.80, 1.50),
    ("HOUS", "LARG 2,80m", 162.00, 2.80, 1.50),
    ("LONDRES", "LARG 2,80m", 175.00, 2.80, 1.50),
    ("IMETEXTIL", "LARG 2,80m", 150.00, 2.80, 1.50),
    ("NOBLETTE I", "LARG 2,80m", 184.00, 2.80, 1.50),
    ("NOBLETTE II", "LARG 2,80m", 184.00, 2.80, 1.50),
    ("HUSTON BK", "BLACKOUT LARG 2,80m", 195.00, 2.80, 1.50),
    ("ANGKOR BK", "BLACKOUT LARG 2,80m", 198.00, 2.80, 1.50),
    ("NAPOLES BK", "BLACKOUT LARG 1,40m", 168.00, 1.40, 1.50),
    ("TORONTO BK", "BLACKOUT LARG 2,40m", 168.00, 2.40, 1.50),
    ("PINPOINT BK", "BLACKOUT LARG 3,00m", 162.00, 3.00, 1.50),
    ("FLORENCE BK", "BLACKOUT LARG 1,83m", 160.00, 1.83, 1.50),
    ("FIBRAS SINTÉTICAS", "LARG 1,75m", 143.00, 1.75, 1.50),
]

PERSIANAS_GABRIEL_PAINEL_COM = [
    # Painel com hastes = PAINEL_COM_HASTES (+20% sobre Rolo)
    ("ANGKOR", "LARG 2,80m", 118.80, 2.80, 1.50),
    ("MIAMI BK", "BLACKOUT LARG 2,50m", 120.00, 2.50, 1.50),
    ("DÖHLER SEM BLACKOUT", "LARG 2,00m/2,80m", 127.80, 2.80, 1.50),
    ("DÖHLER TIPO PALHA", "LARG 2,00m", 117.60, 2.00, 1.50),
    ("DÖHLER C/ PROTEÇÃO", "PROTEÇÃO LARG 2,00m", 118.80, 2.00, 1.50),
    ("DOHLER BLACK", "BLACKOUT LARG 2,00m/2,80m", 141.00, 2.80, 1.50),
    ("DOHLER BLACK DIGITAL", "BLACKOUT LARG 3,00m", 148.80, 3.00, 1.50),
    ("DOHLER BLACK DIGITAL INFANTIL", "BLACKOUT LARG 3,00m", 151.80, 3.00, 1.50),
    ("PINPOINT", "BLACKOUT LARG 3,00m", 161.40, 3.00, 1.50),
    ("FLORENÇA RUSTIC", "LARG 1,80m", 114.60, 1.80, 1.50),
    ("FLORENCE BLACKOUT", "BLACKOUT LARG 1,80m", 175.20, 1.80, 1.50),
    ("JS SCREEN 5%", "LARG 2,50m", 134.40, 2.50, 1.50),
    ("SCREEN 1% (PVC+POLIÉSTER)", "LARG 3,00m", 146.40, 3.00, 1.50),
    ("SCREEN 3% (PVC+POLIÉSTER)", "LARG 3,00m", 140.40, 3.00, 1.50),
    ("SCREEN 5% (PVC+POLIÉSTER)", "LARG 3,00m", 134.40, 3.00, 1.50),
    ("TELA SOLAR 1% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 161.40, 3.00, 1.50),
    ("TELA SOLAR 3% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 154.20, 3.00, 1.50),
    ("TELA SOLAR 5% (PVC+FIBRA DE VIDRO)", "LARG 3,00m", 147.00, 3.00, 1.50),
    ("TELA SOLAR 8%", "LARG 3,10m", 141.00, 3.10, 1.50),
    ("MONTES", "LARG 2,25m", 103.20, 2.25, 1.50),
    ("Londres", "LARG 2,80m", 177.60, 2.80, 1.50),
    ("NOBLETTE I", "LARG 2,80m", 195.60, 2.80, 1.50),
    ("NOBLETTE II", "LARG 2,60m", 195.60, 2.60, 1.50),
    ("NAPOLES BK", "BLACKOUT LARG 2,40m", 154.20, 2.40, 1.50),  # 128.50*1.2=154.20 (approx)
    ("TORONTO BK", "BLACKOUT LARG 2,40m", 162.00, 2.40, 1.50),
    ("STUCCO BK", "BLACKOUT LARG 2,80m", 192.00, 2.80, 1.50),
    ("ECOLUX", "LARG 2,80m SEM HASTES", 225.00, 2.80, 1.50),
    ("SONATINE II", "LARG 2,70m SEM HASTES", 296.00, 2.70, 1.50),
]

PERSIANAS_GABRIEL_PAINEL_SEM = [
    # Same prices as Rolo (sem hastes = sem +20%)
    ("ANGKOR", "LARG 2,80m", 99.00, 2.80, 1.50),
    ("DÖHLER SEM BLACKOUT", "LARG 2,00m/2,80m", 106.50, 2.80, 1.50),
    ("DOHLER BLACK", "BLACKOUT LARG 2,00m/2,80m", 117.50, 2.80, 1.50),
    ("PINPOINT", "BLACKOUT LARG 3,00m", 134.50, 3.00, 1.50),
    ("TELA SOLAR 1%", "LARG 3,00m", 134.50, 3.00, 1.50),
    ("TELA SOLAR 3%", "LARG 3,00m", 128.50, 3.00, 1.50),
    ("TELA SOLAR 5%", "LARG 3,00m", 122.50, 3.00, 1.50),
    ("ECOLUX", "LARG 2,80m", 225.00, 2.80, 1.50),
    ("SONATINE II", "LARG 2,70m", 296.00, 2.70, 1.50),
]

# Horizontal Gabriel
PERSIANAS_GABRIEL_HZ16 = [
    ("HZ 16mm LISA E METALIZADA", "16mm / 0.21mm Larg máx 2,20m", 103.50, 2.20, 1.00),
    ("HZ 16mm TEXTURIZADO", "16mm / 0.21mm", 110.50, 2.20, 1.00),
]

PERSIANAS_GABRIEL_HZ25 = [
    ("HZ 25mm / 0.18mm", "Espessura 0,18mm", 75.90, None, 1.00),
    ("HZ 25mm LISA E METALIZADA", "25mm / 0.21mm", 87.00, None, 1.00),
    ("HZ 25mm TEXTURIZADO", "25mm / 0.21mm", 94.00, None, 1.00),
    ("HZ 25mm PERFURADA", "25mm / 0.21mm", 107.00, None, 1.00),
    ("HZ 25mm IMITANDO MADEIRA", "25mm / 0.21mm Limpeza só com água", 120.00, None, 1.00),
]

PERSIANAS_GABRIEL_HZ50 = [
    ("ALUMÍNIO / METALIZADA 50mm CADARÇO", "50mm cadarço", 130.00, None, 1.00),
    ("ALUMÍNIO / METALIZADA 50mm FITA", "50mm fita", 165.00, None, 1.00),
    ("PERFURADA 50mm CADARÇO", "50mm cadarço", 160.00, None, 1.00),
    ("PERFURADA 50mm FITA", "50mm fita", 195.00, None, 1.00),
    ("ALUM. IMITANDO MADEIRA 50mm CADARÇO", "50mm cadarço", 190.00, None, 1.00),
    ("ALUM. IMITANDO MADEIRA 50mm FITA", "50mm fita", 225.00, None, 1.00),
    ("TECIDO LANTEX 50mm CADARÇO", "50mm cadarço PROMOÇÃO", 110.00, None, 1.00),
    ("TECIDO LANTEX 50mm FITA", "50mm fita PROMOÇÃO", 140.00, None, 1.00),
    ("MADEIRA SINTÉTICA 50mm CADARÇO", "50mm cadarço", 245.00, None, 1.00),
    ("MADEIRA SINTÉTICA 50mm FITA", "50mm fita", 280.00, None, 1.00),
    ("SINTÉTICA PADRÃO MADEIRA 50mm CADARÇO", "50mm cadarço Larg 2,40m", 280.00, 2.40, 1.00),
    ("SINTÉTICA PADRÃO MADEIRA 50mm FITA", "50mm fita Larg 2,40m", 315.00, 2.40, 1.00),
    ("MADEIRA NATURAL 50mm CADARÇO", "50mm cadarço", 365.00, None, 1.00),
    ("MADEIRA NATURAL 50mm FITA", "50mm fita", 400.00, None, 1.00),
    ("PVC LISO 50mm CADARÇO", "50mm cadarço Larg 3,00m", 160.00, 3.00, 1.00),
    ("PVC LISO 50mm FITA", "50mm fita Larg 3,00m", 195.00, 3.00, 1.00),
    ("PVC ARIZONA 50mm CADARÇO", "50mm cadarço Larg 3,00m", 175.00, 3.00, 1.00),
    ("PVC ARIZONA 50mm FITA", "50mm fita Larg 3,00m", 209.00, 3.00, 1.00),
    ("PVC MADEIRA 50mm CADARÇO", "50mm cadarço Larg 3,00m", 175.00, 3.00, 1.00),
    ("PVC RUSTIC 50mm CADARÇO", "50mm cadarço Larg 3,00m", 175.00, 3.00, 1.00),
]

# Rioflex Rolo
PERSIANAS_RIOFLEX_ROLO = [
    ("PINPOINT COM FIBRA", "Larg 3,00m/2,50m Chumbo", 110.00, 3.00, 1.50),
    ("TIJUCA BK (Dohler BK)", "Larg 2,00m", 110.00, 2.00, 1.50),
    ("COPACABANA BK (Poliéster)", "Larg 2,00m", 100.00, 2.00, 1.50),
    ("GÁVEA BK", "Larg 2,40m", 120.00, 2.40, 1.50),
    ("JOÁ TRANSLÚCIDO (Dohler transl)", "Larg 2,00m", 90.00, 2.00, 1.50),
    ("LEBLON BK (Dohler BK)", "Larg 2,00m", 110.00, 2.00, 1.50),
    ("LEBLON BK (Napoles BK)", "Larg 2,40m", 120.00, 2.40, 1.50),
    ("URCA TRANSLÚC.", "Larg 2,00m", 90.00, 2.00, 1.50),
    ("BARRA (Tela Solar 5%) 3m", "Larg 3,00m", 100.00, 3.00, 1.50),
    ("BARRA (Tela Solar 5%) 2,5m", "Larg 2,50m Rústica", 120.00, 2.50, 1.50),
    ("RECREIO (Tela Solar 3%)", "Larg 3,00m", 110.00, 3.00, 1.50),
    ("BOTAFOGO BK (Brisk/Miami)", "Larg 2,20m", 100.00, 2.20, 1.50),
    ("FLAMENGO BK (Toronto/Shantung)", "Larg 2,40m", 130.00, 2.40, 1.50),
    ("CATETE (Tela Solar 1%)", "Larg 3,00m", 120.00, 3.00, 1.50),
    ("VIANNA (Alt Vision SEM BK)", "Larg 2,25m", 130.00, 2.25, 1.50),
    ("VIANNA SEMI BK (Alt Vision SEMI BK)", "Até 3,00m", 190.00, 3.00, 1.50),
    ("HUMAITÁ TRANSLÚC.", "Larg 2,20m", 90.00, 2.20, 1.50),
    ("CORCOVADO TRANSLÚC.", "Larg 2,20m", 100.00, 2.20, 1.50),
    ("ICARAÍ BK", "Larg 2,00m/2,80m", 110.00, 2.80, 1.50),
    ("GRUMARI BK", "Larg 2,40m", 120.00, 2.40, 1.50),
    ("MARACANÃ BK", "Larg 2,40m", 130.00, 2.40, 1.50),
    ("PIRATININGA BK", "Larg 2,50m LANÇAMENTO", 120.00, 2.50, 1.50),
    ("CACHAMBI BK", "Larg 2,50m LANÇAMENTO", 120.00, 2.50, 1.50),
    ("MÉIER BK", "Larg 2,50m LANÇAMENTO", 110.00, 2.50, 1.50),
    ("IPANEMA", "Larg 2,20m LANÇAMENTO", 90.00, 2.20, 1.50),
    ("INHAUMA", "Larg 2,20m LANÇAMENTO", 90.00, 2.20, 1.50),
    ("DISNEY", "Larg 2,50m LANÇAMENTO", 120.00, 2.50, 1.50),
]

PERSIANAS_RIOFLEX_ROMANA = [
    ("PINPOINT COM FIBRA", "Larg 3,00m/2,50m Chumbo", 130.00, 3.00, 1.50),
    ("TIJUCA BK (Dohler BK)", "Larg 2,00m", 130.00, 2.00, 1.50),
    ("COPACABANA BK (Poliéster)", "Larg 2,00m", 120.00, 2.00, 1.50),
    ("GÁVEA BK", "Larg 2,40m", 140.00, 2.40, 1.50),
    ("JOÁ TRANSLÚCIDO", "Larg 2,00m", 110.00, 2.00, 1.50),
    ("LEBLON BK (Dohler BK)", "Larg 2,00m", 130.00, 2.00, 1.50),
    ("LEBLON BK (Napoles BK)", "Larg 2,40m", 140.00, 2.40, 1.50),
    ("BARRA (Tela Solar 5%) 3m", "Larg 3,00m", 120.00, 3.00, 1.50),
    ("BARRA (Tela Solar 5%) 2,5m", "Larg 2,50m Rústica", 140.00, 2.50, 1.50),
    ("RECREIO (Tela Solar 3%)", "Larg 3,00m", 130.00, 3.00, 1.50),
    ("BOTAFOGO BK", "Larg 2,20m", 120.00, 2.20, 1.50),
    ("FLAMENGO BK", "Larg 2,40m", 150.00, 2.40, 1.50),
    ("CATETE (Tela Solar 1%)", "Larg 3,00m", 140.00, 3.00, 1.50),
    ("HUMAITÁ TRANSLÚC.", "Larg 2,20m", 110.00, 2.20, 1.50),
    ("URCA TRANSLÚC.", "Larg 2,00m", 110.00, 2.00, 1.50),
    ("CORCOVADO TRANSLÚC.", "Larg 2,20m", 120.00, 2.20, 1.50),
    ("ICARAÍ BK", "Larg 2,00m", 130.00, 2.00, 1.50),
    ("GRUMARI BK", "Larg 2,40m", 140.00, 2.40, 1.50),
    ("MARACANÃ BK", "Larg 2,40m", 140.00, 2.40, 1.50),
    ("PIRATININGA BK", "Larg 2,50m LANÇAMENTO", 140.00, 2.50, 1.50),
    ("CACHAMBI BK", "Larg 2,50m LANÇAMENTO", 140.00, 2.50, 1.50),
    ("MÉIER BK", "Larg 2,50m LANÇAMENTO", 130.00, 2.50, 1.50),
    ("IPANEMA", "Larg 2,20m LANÇAMENTO", 110.00, 2.20, 1.50),
    ("INHAUMA", "Larg 2,20m LANÇAMENTO", 110.00, 2.20, 1.50),
    ("DISNEY", "Larg 2,50m LANÇAMENTO", 140.00, 2.50, 1.50),
]

# Rioflex Painel = Romana prices + R$20
PERSIANAS_RIOFLEX_PAINEL = [(c, m+" PAINEL", v+20.00, l, mn) for c, m, v, l, mn in PERSIANAS_RIOFLEX_ROMANA]

# ─── Acessórios ──────────────────────────────────────────────────────────────
ACESSORIOS_GABRIEL = [
    # tipo, nome, valorMetro
    # Bandos MDF
    ("BANDO", "Bandô Reto MDF 10cm", 45.00),
    ("BANDO", "Bandô Reto MDF 15cm", 51.50),
    ("BANDO", "Bandô Reto MDF 20cm", 60.50),
    # Bandos Alumínio
    ("BANDO", "Bandô Alumínio Pintado 8cm", 65.90),
    ("BANDO", "Caixa Box 70 (Mini)", 88.90),
    ("BANDO", "Caixa Box 90 (Maxi)", 109.90),
    # Guias Laterais
    ("GUIA_LATERAL", "Guia Lateral 3,0x2,2cm (até 1,50m)", 35.00),
    ("GUIA_LATERAL", "Guia Lateral 5,5x2,2cm", 50.00),
    ("GUIA_LATERAL", "Guia Lateral 8,0x2,2cm", 60.00),
]

ACESSORIOS_RIOFLEX = [
    ("BANDO", "Bandô Conjugado Alumínio Branco", 65.00),
    ("BANDO", "Bandô Conjugado Alumínio Preto/Bege/Cinza", 70.00),
    ("BANDO", "Galeria de Madeira MDF Avulsa", 60.00),
    ("BANDO", "Galeria de Madeira MDF", 50.00),
    ("BANDO", "Bandô Box Mini", 90.00),
    ("BANDO", "Bandô Box Max", 100.00),
    ("GUIA_LATERAL", "Guia Lateral Par Branca 5,5cm", 40.00),   # R$80/par ÷ 2
    ("GUIA_LATERAL", "Guia Lateral Par Preta/Bege/Cinza 5,5cm", 45.00),
    ("GUIA_LATERAL", "Guia Lateral Par Estrelinha 8cm Branca", 50.00),
]

# ─── Motores Gabriel ─────────────────────────────────────────────────────────
MOTORES_GABRIEL = [
    # nome, marca, valor, larguraMax, cargaMaxKg
    ("Motor LSN RTS 6/33 s/ emissor Rolo", "SOMFY LSN", 950.00, None, None),
    ("Motor LSN RTS 6/33 c/ emissor 1ch Rolo", "SOMFY LSN", 1035.00, None, None),
    ("Motor LSN RTS 6/33 Romana HZ 50mm", "SOMFY LSN", 1170.00, None, None),
    ("Motor Rollux RTS 510R2 10/38 110V", "SOMFY", 1215.00, None, 23.00),
    ("Motor Sonesse RTS 409 R2 Romana HZ 50mm", "SOMFY", 1640.00, None, 35.00),
    ("Motor Altus 28 WireFree RTS Rolo/Romana s/ emissor", "SOMFY", 1080.00, None, None),
    ("Motor Romana Teto Enteco c/ emissor 6ch", "ENTECO", 1350.00, None, None),
    ("Motor GP Elétrico 2Nm 25rpm Rolo até 10kg", "AUTOMAÇÃO GP", 380.00, None, 10.00),
    ("Motor GP Elétrico 10Nm 17rpm Rolo até 20kg", "AUTOMAÇÃO GP", 480.00, None, 20.00),
    ("Motor GP Elétrico 2Nm 25rpm Romana HZ50 até 10kg", "AUTOMAÇÃO GP", 500.00, None, 10.00),
    ("Motor GP Elétrico 10Nm 17rpm Romana HZ50 até 20kg", "AUTOMAÇÃO GP", 600.00, None, 20.00),
    ("Motor GP Bateria 2Nm 25rpm Rolo até 10kg", "AUTOMAÇÃO GP", 480.00, None, 10.00),
    ("Motor GP Bateria 13Nm 13rpm Rolo até 26kg", "AUTOMAÇÃO GP", 720.00, None, 26.00),
    ("Motor GP Bateria 2Nm 25rpm Romana HZ50 até 10kg", "AUTOMAÇÃO GP", 600.00, None, 10.00),
    ("Motor GP Bateria 13Nm 13rpm Romana HZ50 até 26kg", "AUTOMAÇÃO GP", 820.00, None, 26.00),
]

MOTORES_RIOFLEX = [
    ("Motor EMTECO Bivolt WiFi 6N Rolo até 2,50m", "EMTECO", 600.00, 2.50, None),
    ("Motor EMTECO Bivolt WiFi 13N Rolo 2,51m-3,20m", "EMTECO", 800.00, 3.20, None),
    ("Motor EMTECO Bivolt WiFi 20N Rolo 3,20m-4,50m", "EMTECO", 1200.00, 4.50, None),
]

# ─── Controles Remotos ───────────────────────────────────────────────────────
CONTROLES_GABRIEL = [
    # nome, canais, valor
    ("Telis 1 Canal (SOMFY)", 1, 180.00),
    ("Telis 5 Canais (SOMFY)", 5, 290.00),
    ("Telis 16 Canais (SOMFY)", 16, 840.00),
    ("Situo 1 Variation Pure (SOMFY)", 1, 435.00),
    ("Situo 5 Variation Pure (SOMFY)", 5, 549.00),
    ("Smoove 1 Canal RTS Shine Pure (SOMFY)", 1, 280.00),
    ("Smoove 4 Canais RTS Shine Pure (SOMFY)", 4, 600.00),
    ("GP 01 Canal", 1, 70.00),
    ("GP 15 Canais", 15, 98.00),
    ("Enteco 01 Canal", 1, 127.00),
    ("Enteco 06 Canais", 6, 170.00),
    ("Enteco 16 Canais", 16, 225.00),
]

CONTROLES_RIOFLEX = [
    ("Controle Remoto 6 Canais EMTECO", 6, 180.00),
    ("Controle Remoto 15 Canais EMTECO", 15, 300.00),
]

# ─── Configs ─────────────────────────────────────────────────────────────────
CONFIGS = [
    ("instalacao_persiana_rolo", "60"),
    ("instalacao_persiana_romana", "60"),
    ("instalacao_persiana_horizontal", "60"),
    ("instalacao_persiana_painel", "120"),
    ("instalacao_motor_persiana", "120"),
    ("markup_persiana", "40"),
]


def run():
    print("Conectando ao banco...")
    conn = get_conn()
    cur = conn.cursor()

    total_persianas = 0
    total_acessorios = 0
    total_motores = 0
    total_controles = 0

    # ── Insert Persianas ──────────────────────────────────────────────────────
    datasets = [
        ("GABRIEL", "ROLO", PERSIANAS_GABRIEL_ROLO),
        ("GABRIEL", "ROMANA", PERSIANAS_GABRIEL_ROMANA),
        ("GABRIEL", "PAINEL_COM_HASTES", PERSIANAS_GABRIEL_PAINEL_COM),
        ("GABRIEL", "PAINEL_SEM_HASTES", PERSIANAS_GABRIEL_PAINEL_SEM),
        ("GABRIEL", "HORIZONTAL_16", PERSIANAS_GABRIEL_HZ16),
        ("GABRIEL", "HORIZONTAL_25", PERSIANAS_GABRIEL_HZ25),
        ("GABRIEL", "HORIZONTAL_50", PERSIANAS_GABRIEL_HZ50),
        ("RIOFLEX", "ROLO", PERSIANAS_RIOFLEX_ROLO),
        ("RIOFLEX", "ROMANA", PERSIANAS_RIOFLEX_ROMANA),
        ("RIOFLEX", "PAINEL_COM_HASTES", PERSIANAS_RIOFLEX_PAINEL),
    ]

    for fornecedor, tipo, rows in datasets:
        for colecao, modelo, valorM2, larguraMaxima, minM2 in rows:
            # Check if already exists
            cur.execute(
                'SELECT id FROM "Persiana" WHERE fornecedor=%s AND tipo=%s AND colecao=%s AND modelo=%s',
                (fornecedor, tipo, colecao, modelo)
            )
            if cur.fetchone():
                continue
            cur.execute(
                '''INSERT INTO "Persiana" (id, fornecedor, tipo, colecao, modelo, "valorM2", "minM2", "larguraMaxima", ativo)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, true)''',
                (fornecedor, tipo, colecao, modelo, valorM2, minM2, larguraMaxima)
            )
            total_persianas += 1

    # ── Insert Acessórios ─────────────────────────────────────────────────────
    for fornecedor, rows in [("GABRIEL", ACESSORIOS_GABRIEL), ("RIOFLEX", ACESSORIOS_RIOFLEX)]:
        for tipo, nome, valorMetro in rows:
            cur.execute(
                'SELECT id FROM "AcessorioPersiana" WHERE fornecedor=%s AND nome=%s',
                (fornecedor, nome)
            )
            if cur.fetchone():
                continue
            cur.execute(
                '''INSERT INTO "AcessorioPersiana" (id, fornecedor, tipo, nome, "valorMetro", ativo)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, true)''',
                (fornecedor, tipo, nome, valorMetro)
            )
            total_acessorios += 1

    # ── Insert Motores ────────────────────────────────────────────────────────
    for fornecedor, rows in [("GABRIEL", MOTORES_GABRIEL), ("RIOFLEX", MOTORES_RIOFLEX)]:
        for row in rows:
            nome, marca, valor, larguraMax, cargaMaxKg = row
            cur.execute(
                'SELECT id FROM "MotorPersiana" WHERE fornecedor=%s AND nome=%s',
                (fornecedor, nome)
            )
            if cur.fetchone():
                continue
            cur.execute(
                '''INSERT INTO "MotorPersiana" (id, fornecedor, nome, marca, valor, "larguraMax", "cargaMaxKg", ativo)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, true)''',
                (fornecedor, nome, marca, valor, larguraMax, cargaMaxKg)
            )
            total_motores += 1

    # ── Insert Controles ──────────────────────────────────────────────────────
    for fornecedor, rows in [("GABRIEL", CONTROLES_GABRIEL), ("RIOFLEX", CONTROLES_RIOFLEX)]:
        for nome, canais, valor in rows:
            cur.execute(
                'SELECT id FROM "ControleRemotoPersiana" WHERE fornecedor=%s AND nome=%s',
                (fornecedor, nome)
            )
            if cur.fetchone():
                continue
            cur.execute(
                '''INSERT INTO "ControleRemotoPersiana" (id, fornecedor, nome, canais, valor, ativo)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, true)''',
                (fornecedor, nome, canais, valor)
            )
            total_controles += 1

    # ── Upsert Configs ────────────────────────────────────────────────────────
    for chave, valor in CONFIGS:
        cur.execute(
            'SELECT id FROM "ConfiguracaoCalculo" WHERE chave=%s',
            (chave,)
        )
        if cur.fetchone():
            print(f"  Config '{chave}' já existe — ignorando")
        else:
            cur.execute(
                '''INSERT INTO "ConfiguracaoCalculo" (id, chave, valor)
                   VALUES (gen_random_uuid()::text, %s, %s)''',
                (chave, valor)
            )
            print(f"  Config '{chave}' = {valor} inserida")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✓ Persianas inseridas:       {total_persianas}")
    print(f"✓ Acessórios inseridos:      {total_acessorios}")
    print(f"✓ Motores inseridos:         {total_motores}")
    print(f"✓ Controles remotos inser.:  {total_controles}")
    print("\nConcluído!")


if __name__ == "__main__":
    run()
