import sys
try:
    import openpyxl
except ImportError:
    print("MISSING_OPENPYXL")
    sys.exit(1)

try:
    wb = openpyxl.load_workbook('analisis.xlsx', read_only=True)
    ws = wb.active
    # Read first row
    headers = []
    for row in ws.iter_rows(min_row=1, max_row=1):
        for cell in row:
            if cell.value is not None:
                headers.append(str(cell.value))
            else:
                headers.append("(Vacio)")
    print("HEADERS_FOUND:", " | ".join(headers))
except Exception as e:
    print(f"ERROR: {e}")
