import os
import json
import csv
from datetime import datetime
import pytz
import numpy as np

# --- Seteo de variables y datos desde el entorno ---
ambiente = os.getenv("ENVIRONMENT", "Production")
cliente  = os.getenv("CLIENT", "Nerdearla")
version = os.getenv("VERSION", "")
comentarios = os.getenv("COMMENTS", "")

with open('version.txt', 'r') as version_file:
    version = version_file.readline().strip()
    
metrics_dir = os.path.join('metrics')
os.makedirs(metrics_dir, exist_ok=True)
csv_path = os.path.join(metrics_dir, 'raw_data.csv')

output_dir = os.path.join(metrics_dir, ambiente, cliente, version)
os.makedirs(output_dir, exist_ok=True)

buenos_aires_tz = pytz.timezone('America/Argentina/Buenos_Aires')
timestamp = datetime.now(buenos_aires_tz).isoformat(timespec='seconds')

# --- Función para calcular la próxima muestra ---
next_muestra = 1
if os.path.exists(csv_path):
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        if 'Muestra' in reader.fieldnames:
            rows = list(reader)
            if rows:
                # --- Filtrar por versión, cliente, ambiente y comentarios ---
                filas_relevantes = [
                    r for r in rows
                    if r.get('Versión') == version
                    and r.get('Cliente') == cliente
                    and r.get('Ambiente') == ambiente
                    and (not comentarios or r.get('Comentarios') == comentarios)
                ]
                
                if filas_relevantes:
                    max_m = max(
                        int(r['Muestra']) for r in filas_relevantes if r['Muestra'].isdigit()
                    )
                    next_muestra = max_m + 1
                else:
                    next_muestra = 1  # No hay muestras previas para esta combinación

# --- Lectura del archivo json generado por cypress ---
json_directory = 'cypress/reports'
json_files = sorted(
    [f for f in os.listdir(json_directory) if f.endswith('.json')],
    key=lambda x: os.path.getmtime(os.path.join(json_directory, x))
)
if not json_files:
    raise RuntimeError("No se encontró ningún reporte JSON en cypress/reports")

latest_file = os.path.join(json_directory, json_files[-1])

# --- Función de extracción de datos del reporte combinado .json de cypress ---
def extract_test_data(json_path):
    with open(json_path, 'r') as file:
        data = json.load(file)
    test_data = {}

    def traverse_suites(suites, root_section=None):
        for suite in suites:
            section_title = root_section or suite.get('title', '')
            for test in suite.get('tests', []):
                if test.get('state') == 'passed':
                    title = test.get('title')
                    duration = test.get('duration')
                    if title and title not in test_data:
                        test_data[title] = {
                            'duration': duration,
                            'section': section_title
                        }
            traverse_suites(suite.get('suites', []), section_title)

    for result in data.get('results', []):
        traverse_suites(result.get('suites', []))
    return test_data

curr_data = extract_test_data(latest_file)

with open(csv_path, mode='a', newline='') as csv_file:
    fieldnames = [
        'Timestamp', 'Cliente', 'Ambiente',
        'Sección', 'Descripción', 'Tiempo (ms)',
        'Versión', 'Muestra', 'Comentarios'
    ]
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    if os.stat(csv_path).st_size == 0:
        writer.writeheader()

    used_titles = set()
    for title, info in curr_data.items():
        if title not in used_titles:
            writer.writerow({
                'Timestamp': timestamp,
                'Cliente': cliente,
                'Ambiente': ambiente,
                'Sección': info['section'],
                'Descripción': title,
                'Tiempo (ms)': info['duration'],
                'Versión': version,
                'Muestra': next_muestra,
                'Comentarios': comentarios
            })
            used_titles.add(title)

print(f"[LOG] Datos crudos añadidos a {csv_path}")

# ==========================================================================================================================================
#                                           -- Comienza la generación de métricas de la versión  ---
# ==========================================================================================================================================

# --- Verificar si es la primera muestra ---
if next_muestra == 1:
    mensaje = f"[INFO] Las métricas puntuales de la versión {version} "
    mensaje += f"para {cliente} {ambiente} "
    if comentarios:
        mensaje += f"con comentario: '{comentarios}'"
    mensaje += "no se generarán ya que es su primera muestra"

    print(mensaje)
else:
    msg = f" SE INICIA LA GENERACIÓN DE MÉTRICAS DE LA VERSIÓN {version} PARA {cliente} / {ambiente}"
    if comentarios:
        msg += f" / '{comentarios}'"
    print("#" * 81)
    print("#" + msg.center(58) + " #")
    print("#" * 81)

    # ===========================================================
    # --- Comparativa histórica por sección de la versión ---
    # ===========================================================

    metrics_csv = os.path.join(output_dir, 'comparativa_historica_por_seccion.csv')
    with open(csv_path, newline='') as raw_file:
        reader = csv.DictReader(raw_file)
        rows = list(reader)

    if rows:
        max_muestra = max(
            int(r['Muestra']) for r in rows
            if (
                r.get('Versión') == version
                and r.get('Cliente') == cliente
                and r.get('Ambiente') == ambiente
                and r['Muestra'].isdigit()
                and (not comentarios or r.get('Comentarios') == comentarios)
            )
        )

        durations_total, durations_last = {}, {}
        for r in rows:
            if not (
                r.get('Versión') == version and
                r.get('Cliente') == cliente and
                r.get('Ambiente') == ambiente
                and (not comentarios or r.get('Comentarios') == comentarios) 
            ):
                continue

            try:
                dur = float(r['Tiempo (ms)'])
            except ValueError:
                continue

            section = r['Sección']
            durations_total.setdefault(section, []).append(dur)

            if int(r['Muestra']) == max_muestra:
                durations_last.setdefault(section, []).append(dur)

        # --- Preparar campos del CSV y agregar Comentarios si existe
        metrics_fields = [
            'Timestamp', 'Cliente', 'Ambiente',
            'Sección', 'Versión',
            'P95 (ms) de la última muestra',
            'P95 (ms) histórico',
            'Porcentaje de mejora/empeora del p95',
            'Mediana (ms) de la última muestra',
            'Mediana (ms) histórica',
            'Porcentaje de mejora/empeora de la mediana'
        ]
        if comentarios:
            metrics_fields.append('Comentarios')

        with open(metrics_csv, mode='w', newline='') as metrics_file:
            writer = csv.DictWriter(metrics_file, fieldnames=metrics_fields)
            writer.writeheader()

            for section in sorted(durations_total):
                if len(durations_total[section]) < 2:
                    print(f"[WARN] Sección '{section}' excluida ya que tiene menos de 2 muestras")
                    continue

                total_p95 = round(np.percentile(durations_total[section], 95), 2)
                total_median = round(np.median(durations_total[section]), 2)

                if section in durations_last and len(durations_last[section]) > 0:
                    last_p95 = round(np.percentile(durations_last[section], 95), 2)
                    last_median = round(np.median(durations_last[section]), 2)
                    diff_pct = (
                        round(((total_p95 - last_p95) / total_p95) * 100, 2)
                        if total_p95 > 0 else 0.0
                    )
                    diff_median_pct = (
                        round(((total_median - last_median) / total_median) * 100, 2)
                        if total_median > 0 else 0.0
                    )
                else:
                    last_p95, diff_pct, last_median, diff_median_pct = '', '', '',

                # --- Preparar fila y agregar Comentarios si corresponde
                fila = {
                    'Timestamp': timestamp,
                    'Cliente': cliente,
                    'Ambiente': ambiente,
                    'Sección': section,
                    'Versión': version,
                    'P95 (ms) de la última muestra': last_p95,
                    'P95 (ms) histórico': total_p95,
                    'Porcentaje de mejora/empeora del p95': diff_pct,
                    'Mediana (ms) de la última muestra': last_median,
                    'Mediana (ms) histórica': total_median,
                    'Porcentaje de mejora/empeora de la mediana': diff_median_pct
                }
                if comentarios:
                    fila['Comentarios'] = comentarios

                writer.writerow(fila)

        print(f"[LOG] Comparativa histórica por sección generada en {metrics_csv}")

    # ===========================================================
    # --- Comparativa histórica por descripción de la versión ---
    # ===========================================================

    p95_desc_csv = os.path.join(output_dir, 'comparativa_historica_por_descripcion.csv')
    with open(csv_path, newline='') as raw_file:
        reader = csv.DictReader(raw_file)
        rows = list(reader)

    if rows:
        max_muestra = max(
            int(r['Muestra']) for r in rows
            if r.get('Versión') == version and r['Muestra'].isdigit()
            and (not comentarios or r.get('Comentarios') == comentarios)
        )

        durations_total, durations_last = {}, {}
        for r in rows:
            if r.get('Versión') != version:
                continue
            if comentarios and r.get('Comentarios') != comentarios:
                continue

            try:
                dur = float(r['Tiempo (ms)'])
            except ValueError:
                continue
            key = (r['Sección'], r['Descripción'])
            durations_total.setdefault(key, []).append(dur)
            if int(r['Muestra']) == max_muestra:
                durations_last.setdefault(key, []).append(dur)

        # --- Preparar campos del CSV y agregar Comentarios si existe
        metrics_fields_desc = [
            'Timestamp', 'Cliente', 'Ambiente',
            'Sección', 'Descripción', 'Versión',
            'P95 (ms) de la última muestra',
            'P95 (ms) histórico',
            'Porcentaje de mejora/empeora del p95',
            'Mediana (ms) de la última muestra',
            'Mediana (ms) histórica',
            'Porcentaje de mejora/empeora de la mediana' 
        ]
        if comentarios:
            metrics_fields_desc.append('Comentarios')

        with open(p95_desc_csv, mode='w', newline='') as metrics_file:
            writer = csv.DictWriter(metrics_file, fieldnames=metrics_fields_desc)
            writer.writeheader()

            for key in sorted(durations_total):
                section, description = key

                if len(durations_total[key]) < 2:
                    print(f"[WARN] Descripción '{description}' en sección '{section}' excluida ya que tiene menos de 2 muestras")
                    continue

                total_p95 = round(np.percentile(durations_total[key], 95), 2)
                total_median = round(np.median(durations_total[key]), 2)

                if key in durations_last and len(durations_last[key]) > 0:
                    last_p95 = round(np.percentile(durations_last[key], 95), 2)
                    last_median = round(np.median(durations_last[key]), 2)
                    diff_pct = (
                        round(((total_p95 - last_p95) / total_p95) * 100, 2)
                        if total_p95 > 0 else 0.0
                    )
                    diff_median_pct = (
                        round(((total_median - last_median) / total_median) * 100, 2)
                        if total_median > 0 else 0.0
                    )
                else:
                    last_p95, diff_pct, last_median, diff_median_pct = '', '', '', ''
                    print(f"[WARN] Descripción '{description}' en sección '{section}' no tiene muestra en la última ejecución")

                # --- Preparar fila y agregar Comentarios si corresponde
                fila = {
                    'Timestamp': timestamp,
                    'Cliente': cliente,
                    'Ambiente': ambiente,
                    'Sección': section,
                    'Descripción': description,
                    'Versión': version,
                    'P95 (ms) de la última muestra': last_p95,
                    'P95 (ms) histórico': total_p95,
                    'Porcentaje de mejora/empeora del p95': diff_pct,
                    'Mediana (ms) de la última muestra': last_median,
                    'Mediana (ms) histórica': total_median,
                    'Porcentaje de mejora/empeora de la mediana': diff_median_pct
                }
                if comentarios:
                    fila['Comentarios'] = comentarios

                writer.writerow(fila)

        print(f"[LOG] Comparativa histórica por descripción generada en {p95_desc_csv}")


# ==========================================================================================================================================
#                                           -- Finaliza la generación de métricas de la versión  ---
# ==========================================================================================================================================

# ==========================================================================================================================================
#                                           -- Comienza la comparativa entre versiones  ---
# ==========================================================================================================================================

with open(csv_path, newline='') as raw_file:
    reader = csv.DictReader(raw_file)
    rows = list(reader)

# Filtrar primero por cliente, ambiente y comentarios (si aplica)
rows_filtered = [
    r for r in rows
    if r.get('Cliente') == cliente
    and r.get('Ambiente') == ambiente
    and (not comentarios or r.get('Comentarios') == comentarios)
]

# versiones distintas presentes en el CSV
versions_in_csv = sorted({r['Versión'] for r in rows_filtered})

if len(versions_in_csv) < 2:
    mensaje = (
        f"[INFO] No se generarán métricas comparativas entre versiones "
        f"ya que solo se encuentra disponible la versión {version} "
        f"para {ambiente} {cliente}"
    )

    if comentarios:
        mensaje += f" con comentario: '{comentarios}'"

    print(mensaje)

else:
    # Elegir versión a comparar: última anterior a la actual
    compare_version = versions_in_csv[-2]

    # ==============================================
    # --- Comparativa entre versiones por sección ---
    # ==============================================
    metrics_vs_version_csv = os.path.join(
        output_dir, f'comparativa_por_seccion_vs_{compare_version}.csv'
    )

    msg = (
        f" SE INICIA LA GENERACIÓN DE MÉTRICAS COMPARATIVAS "
        f"ENTRE LA VERSIÓN ACTUAL {version} VS {compare_version} "
        f"PARA {cliente} / {ambiente} "
    )
    width = max(60, len(msg) + 2)
    print("#" * width)
    print("#" + msg.center(width - 2) + "#")
    print("#" * width)

    durations_actual, durations_compare = {}, {}
    for r in rows_filtered:
        try:
            dur = float(r['Tiempo (ms)'])
        except ValueError:
            continue
        section = r['Sección']
        if r['Versión'] == version:
            durations_actual.setdefault(section, []).append(dur)
        elif r['Versión'] == compare_version:
            durations_compare.setdefault(section, []).append(dur)

    with open(metrics_vs_version_csv, mode='w', newline='') as metrics_file:
        metrics_fields = [
            'Timestamp', 'Cliente', 'Ambiente', 'Sección',
            f'P95 (ms) de la última versión {version}',
            f'P95 (ms) de la versión {compare_version}',
            'Porcentaje de mejora/empeora del P95',
            f'Mediana (ms) de la última versión {version}',
            f'Mediana (ms) de la versión {compare_version}',
            'Porcentaje de mejora/empeora de la mediana'
        ]
        if comentarios:
            metrics_fields.append('Comentarios')

        writer = csv.DictWriter(metrics_file, fieldnames=metrics_fields)
        writer.writeheader()

        all_sections = sorted(set(durations_actual) | set(durations_compare))
        for section in all_sections:
            if section not in durations_actual:
                print(f"[WARN] Sección '{section}' no tiene muestras en la versión {version}")
                continue
            if section not in durations_compare:
                print(f"[WARN] Sección '{section}' no tiene muestras en la versión {compare_version}")
                continue

            p95_actual = round(np.percentile(durations_actual[section], 95), 2)
            p95_compare = round(np.percentile(durations_compare[section], 95), 2)
            median_actual = round(np.median(durations_actual[section]), 2)
            median_compare = round(np.median(durations_compare[section]), 2)
            diff_p95 = round(((p95_compare - p95_actual) / p95_compare) * 100, 2) if p95_compare > 0 else 0.0
            diff_median = round((median_compare - median_actual) / median_compare)

            row = {
                'Timestamp': timestamp,
                'Cliente': cliente,
                'Ambiente': ambiente,
                'Sección': section,
                f'P95 (ms) de la última versión {version}': p95_actual,
                f'P95 (ms) de la versión {compare_version}': p95_compare,
                'Porcentaje de mejora/empeora del P95': diff_p95,
                f'Mediana (ms) de la última versión {version}': median_actual,
                f'Mediana (ms) de la versión {compare_version}': median_compare,
                'Porcentaje de mejora/empeora de la mediana': diff_median
            }
            if comentarios:
                row['Comentarios'] = comentarios

            writer.writerow(row)

    print(f"[LOG] Comparativa por sección entre versiones generada en {metrics_vs_version_csv}")

    # =================================================
    # --- Comparativa entre versiones por descripción ---
    # =================================================
    metrics_desc_vs_version_csv = os.path.join(
        output_dir, f'comparativa_por_descripcion_vs_{compare_version}.csv'
    )

    durations_actual, durations_compare = {}, {}
    for r in rows_filtered:
        try:
            dur = float(r['Tiempo (ms)'])
        except ValueError:
            continue
        key = (r['Sección'], r['Descripción'])
        if r['Versión'] == version:
            durations_actual.setdefault(key, []).append(dur)
        elif r['Versión'] == compare_version:
            durations_compare.setdefault(key, []).append(dur)

    with open(metrics_desc_vs_version_csv, mode='w', newline='') as metrics_file:
        metrics_fields = [
            'Timestamp', 'Cliente', 'Ambiente', 'Sección',
            f'P95 (ms) de la última versión {version}',
            f'P95 (ms) de la versión {compare_version}',
            'Porcentaje de mejora/empeora del P95',
            f'Mediana (ms) de la última versión {version}',
            f'Mediana (ms) de la versión {compare_version}',
            'Porcentaje de mejora/empeora de la mediana'
        ]
        if comentarios:
            metrics_fields.append('Comentarios')

        writer = csv.DictWriter(metrics_file, fieldnames=metrics_fields)
        writer.writeheader()

        all_keys = sorted(set(durations_actual) | set(durations_compare))
        for key in all_keys:
            section, description = key
            if key not in durations_actual:
                print(f"[WARN] Descripción '{description}' en sección '{section}' no tiene muestras en la versión {version}")
                continue
            if key not in durations_compare:
                print(f"[WARN] Descripción '{description}' en sección '{section}' no tiene muestras en la versión {compare_version}")
                continue

            p95_actual = round(np.percentile(durations_actual[section], 95), 2)
            p95_compare = round(np.percentile(durations_compare[section], 95), 2)
            median_actual = round(np.median(durations_actual[section]), 2)
            median_compare = round(np.median(durations_compare[section]), 2)
            diff_p95 = round(((p95_compare - p95_actual) / p95_compare) * 100, 2) if p95_compare > 0 else 0.0
            diff_median = round((median_compare - median_actual) / median_compare)

            row = {
                'Timestamp': timestamp,
                'Cliente': cliente,
                'Ambiente': ambiente,
                'Sección': section,
                f'P95 (ms) de la última versión {version}': p95_actual,
                f'P95 (ms) de la versión {compare_version}': p95_compare,
                'Porcentaje de mejora/empeora del P95': diff_p95,
                f'Mediana (ms) de la última versión {version}': median_actual,
                f'Mediana (ms) de la versión {compare_version}': median_compare,
                'Porcentaje de mejora/empeora de la mediana': diff_median
            }
            if comentarios:
                row['Comentarios'] = comentarios

            writer.writerow(row)

    print(f"[LOG] Comparativa por descripción entre versiones generada en {metrics_desc_vs_version_csv}")

# ==========================================================================================================================================
#                                           -- Finaliza la comparativa entre versiones  ---
# ==========================================================================================================================================