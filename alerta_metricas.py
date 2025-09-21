import os
import pandas as pd

ambiente = os.getenv("ENVIRONMENT", "Production")
cliente  = os.getenv("CLIENT", "Nerdearla")
version = os.getenv("VERSION", "")

csv_path = os.path.join("metrics", ambiente, cliente, version, "comparativa_historica_por_seccion.csv")
alert_threshold = -10
alert_sections = []

if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)
    if "Porcentaje de mejora/empeora" in df.columns:
        bad = df[df["Porcentaje de mejora/empeora"] < alert_threshold]
        for _, row in bad.iterrows():
            alert_sections.append(f"{row['Sección']}: {row['Porcentaje de mejora/empeora']}%")

# Salida GH Actions
if alert_sections:
    msg = "\n".join(alert_sections)
else:
    msg = "No alerts"  # valor por defecto si no hay alertas

print(f"ALERT_METRICS<<EOF\n{msg}\nEOF")
