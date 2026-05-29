import sys, openpyxl, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
for f in os.listdir(r'D:\coder\casaestampa\alteracoes'):
    if not f.endswith('.xlsx'): continue
    p = os.path.join(r'D:\coder\casaestampa\alteracoes', f)
    print('\n\n########## FILE:', f)
    wb = openpyxl.load_workbook(p, data_only=True)
    for s in wb.worksheets:
        print('\n===SHEET:', s.title)
        for r in s.iter_rows(values_only=True):
            row = '|'.join('' if c is None else str(c) for c in r)
            if row.strip('|').strip(): print(row)
