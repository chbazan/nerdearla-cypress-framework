import os
import pandas as pd

# === Variables de entorno ===
ambiente    = os.getenv("ENVIRONMENT", "Production")
cliente     = os.getenv("CLIENT", "Nerdearla")
version     = os.getenv("VERSION", "")
comentarios = os.getenv("COMMENTS", "")

# --- Ruta al CSV (con subcarpeta de comentarios si aplica) ---
if comentarios:
    csv_path = os.path.join("metrics", ambiente, cliente, version, comentarios,
                            "comparativa_historica_por_seccion.csv")
else:
    csv_path = os.path.join("metrics", ambiente, cliente, version,
                            "comparativa_historica_por_seccion.csv")

alert_threshold = -10
alert_sections = []

if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)

    # Si hay columna Comentarios y se definió comentarios, filtramos
    if comentarios and "Comentarios" in df.columns:
        df = df[df["Comentarios"] == comentarios]

    if "Porcentaje de mejora/empeora" in df.columns:
        bad = df[df["Porcentaje de mejora/empeora"] < alert_threshold]
        for _, row in bad.iterrows():
            alert_sections.append(
                f"{row['Sección']}: {row['Porcentaje de mejora/empeora']}%"
            )

# --- Salida para GH Actions ---
msg = "\n".join(alert_sections) if alert_sections else "No alerts"
print(f"ALERT_METRICS<<EOF\n{msg}\nEOF")
