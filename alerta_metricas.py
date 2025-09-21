import os
import pandas as pd

# --- Variables de entorno ---
ambiente = os.getenv("ENVIRONMENT", "Production")
cliente = os.getenv("CLIENT", "Nerdearla")
version = os.getenv("VERSION", "")

# Archivo donde están los datos por sección
csv_path = os.path.join("metrics", ambiente, cliente, version, "comparativa_historica_por_seccion.csv")

alert_threshold = -10  # porcentaje de empeora que dispara alerta
alert_sections = []

if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)
    if "Porcentaje de mejora/empeora" in df.columns:
        # Filtramos secciones que empeoraron más del 10% (valor negativo menor a -10)
        bad = df[df["Porcentaje de mejora/empeora"] < alert_threshold]
        for _, row in bad.iterrows():
            alert_sections.append(f"{row['Sección']}: {row['Porcentaje de mejora/empeora']}%")
else:
    print(f"CSV no encontrado: {csv_path}")

# Salida para GH Actions
if alert_sections:
    msg = "\n".join(alert_sections)
    print(f"ALERT_METRICS<<EOF\n{msg}\nEOF")
    exit(1)  # marca como fallo para disparar Slack alert
else:
    print("ALERT_METRICS<<EOF\nNo alerts triggered.\nEOF")
    exit(0)
