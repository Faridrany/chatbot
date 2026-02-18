import pandas as pd

# Baca Excel
df = pd.read_excel("Book1.xlsx")

# Simpan sebagai JSON ke folder tujuan
output_path = "Dashboard/public/pengaduan.json"

df.to_json(output_path, orient="records", indent=4, force_ascii=False)

print("Berhasil! File JSON tersimpan di:", output_path)
