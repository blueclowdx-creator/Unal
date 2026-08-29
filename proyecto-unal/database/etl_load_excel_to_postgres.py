"""
ETL: Bd_Universidad_Nacional.xlsx  ->  PostgreSQL (esquema unal, star schema)

Uso:
    pip install pandas openpyxl sqlalchemy psycopg2-binary
    python etl_load_excel_to_postgres.py \
        --excel /ruta/Bd_Universidad_Nacional.xlsx \
        --db-url postgresql+psycopg2://unal_user:unal_pass@localhost:5432/unal_db

Requiere que 01_schema.sql ya haya sido ejecutado sobre la base de datos destino.
"""
import argparse
import sys
import pandas as pd
from sqlalchemy import create_engine, text

COLUMNS = [
    'YEAR', 'SEMESTRE', 'TIPO_NIVEL', 'NIVEL', 'DEP_NAC', 'COD_DEP_NAC', 'CIU_NAC',
    'COD_CIU_NAC', 'LON_CIU_NAC', 'LAT_CIU_NAC', 'DEP_PROC', 'COD_DEP_PROC', 'CIU_PROC',
    'COD_CIU_PROC', 'LON_CIU_PROC', 'LAT_CIU_PROC', 'CODS_NAC', 'CODN_NAC', 'NACIONALIDAD',
    'EDAD', 'SEXO', 'ESTRATO', 'TIPO_COL', 'PBM', 'MAT_PVEZ', 'SNIES_SEDE_ADM',
    'SEDE_NOMBRE_ADM', 'SNIES_SEDE_MAT', 'SEDE_NOMBRE_MAT', 'ADM_PEAMA_ANDINA', 'MOD_ADM',
    'TIPO_ADM', 'PAES', 'PEAMA', 'MOV_PEAMA', 'CONVENIO', 'TIP_CONVENIO', 'FACULTAD',
    'SNIES_PROGRA', 'PROGRAMA', 'AREAC_SNIES', 'CA_CINE', 'CD_CINE', 'AREA_CINE'
]


def _norm_code(v) -> str:
    """Normaliza codigos geograficos/programa a string. NaN -> '__NULL__'."""
    if pd.isna(v):
        return '__NULL__'
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def _norm_text(v, default='__NULL__') -> str:
    if pd.isna(v):
        return default
    return str(v).strip()


# Sedes de presencia regional: en el Excel original, los registros de programas propios de
# estas sedes tienen el campo FACULTAD = nombre de la sede (error del Excel). En realidad
# son programas de la sede sin adscripcion a una facultad del nivel nacional.
SEDES_PRESENCIA = {'Amazonía', 'Amazonia', 'Caribe', 'De La Paz', 'Orinoquía', 'Tumaco'}


def _norm_coord(v) -> float:
    """Coordenadas del Excel vienen en microgrados (multiplicadas por 1e6)."""
    if pd.isna(v):
        return 0.0
    return float(v) / 1e6


def load_excel(path: str) -> pd.DataFrame:
    print(f"[ETL] Leyendo {path} ...")
    df = pd.read_excel(path, sheet_name=0, usecols=COLUMNS, dtype={
        'COD_DEP_NAC': 'float64', 'COD_CIU_NAC': 'float64',
        'COD_DEP_PROC': 'float64', 'COD_CIU_PROC': 'float64',
        'SNIES_SEDE_ADM': 'str', 'SNIES_SEDE_MAT': 'str', 'SNIES_PROGRA': 'str',
        'CODS_NAC': 'str', 'CODN_NAC': 'str',
    })
    print(f"[ETL] {len(df)} filas leidas.")
    df['MAT_PVEZ'] = df['MAT_PVEZ'].astype(str).str.strip().str.upper().eq('SI')

    # Normalizar codigos clave a string (para que los merges funcionen)
    for c in ['COD_DEP_NAC', 'COD_CIU_NAC', 'COD_DEP_PROC', 'COD_CIU_PROC',
              'SNIES_SEDE_ADM', 'SNIES_SEDE_MAT', 'SNIES_PROGRA', 'CODS_NAC', 'CODN_NAC']:
        df[c] = df[c].apply(_norm_code)

    # Corregir registros donde FACULTAD = SEDE_NOMBRE_MAT (programas de sedes de presencia
    # regional mal clasificados en el Excel). En estos casos la "facultad" es NULL.
    df['FACULTAD'] = df['FACULTAD'].astype(str).str.strip()
    df['SEDE_NOMBRE_MAT'] = df['SEDE_NOMBRE_MAT'].astype(str).str.strip()
    mask_fac_es_sede = df['FACULTAD'].isin(SEDES_PRESENCIA) & df['FACULTAD'].eq(df['SEDE_NOMBRE_MAT'])
    n_fix = int(mask_fac_es_sede.sum())
    if n_fix:
        print(f"[ETL] Reasignando {n_fix} registros con FACULTAD = sede de presencia regional -> __NULL__")
    df.loc[mask_fac_es_sede, 'FACULTAD'] = '__NULL__'
    return df


def upsert_dim(engine, df_unique: pd.DataFrame, table: str, cols: list, conflict_cols: list, id_col: str):
    """Inserta valores unicos en una dimension (ON CONFLICT DO NOTHING) y devuelve un
    DataFrame con las columnas + el id generado, para hacer el merge con el hecho."""
    records = df_unique.to_dict('records')
    if records:
        with engine.begin() as conn:
            col_list = ', '.join(cols)
            placeholders = ', '.join(f":{c}" for c in cols)
            conflict = ', '.join(conflict_cols)
            sql = text(f"""
                INSERT INTO unal.{table} ({col_list})
                VALUES ({placeholders})
                ON CONFLICT ({conflict}) DO NOTHING
            """)
            conn.execute(sql, records)

    with engine.begin() as conn:
        result = conn.execute(text(f"SELECT {id_col}, {col_list} FROM unal.{table}"))
        return pd.DataFrame(result.fetchall(), columns=[id_col] + cols)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--excel', required=True)
    parser.add_argument('--db-url', required=True)
    parser.add_argument('--reload', action='store_true',
                        help='Trunca fact_matricula y dim_facultad/dim_programa antes de recargar')
    args = parser.parse_args()

    engine = create_engine(args.db_url)

    if args.reload:
        print("[ETL] --reload: truncando fact_matricula y dim_facultad/dim_programa ...")
        with engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE unal.fact_matricula RESTART IDENTITY CASCADE"))
            conn.execute(text("DELETE FROM unal.dim_programa"))
            conn.execute(text("DELETE FROM unal.dim_facultad"))
            # Resetear secuencias
            for seq in ['dim_facultad_facultad_id_seq', 'dim_programa_programa_id_seq',
                        'fact_matricula_matricula_id_seq']:
                conn.execute(text(f"ALTER SEQUENCE unal.{seq} RESTART WITH 1"))

    df = load_excel(args.excel)

    # ---------- dim_periodo ----------
    print("[ETL] Cargando dim_periodo ...")
    dim_periodo_src = df[['YEAR', 'SEMESTRE']].drop_duplicates().rename(
        columns={'YEAR': 'anio', 'SEMESTRE': 'semestre'})
    dim_periodo = upsert_dim(engine, dim_periodo_src, 'dim_periodo',
                              ['anio', 'semestre'], ['anio', 'semestre'], 'periodo_id')
    print(f"[ETL]   dim_periodo: {len(dim_periodo)} registros")

    # ---------- dim_geografia (nacimiento y procedencia comparten la tabla) ----------
    print("[ETL] Cargando dim_geografia ...")
    geo_nac = df[['COD_DEP_NAC', 'DEP_NAC', 'COD_CIU_NAC', 'CIU_NAC', 'LON_CIU_NAC', 'LAT_CIU_NAC']].copy()
    geo_nac.columns = ['cod_departamento', 'departamento', 'cod_ciudad', 'ciudad', 'longitud', 'latitud']
    geo_proc = df[['COD_DEP_PROC', 'DEP_PROC', 'COD_CIU_PROC', 'CIU_PROC', 'LON_CIU_PROC', 'LAT_CIU_PROC']].copy()
    geo_proc.columns = ['cod_departamento', 'departamento', 'cod_ciudad', 'ciudad', 'longitud', 'latitud']

    geo_all = pd.concat([geo_nac, geo_proc], ignore_index=True)
    geo_all['longitud'] = geo_all['longitud'].apply(_norm_coord)
    geo_all['latitud'] = geo_all['latitud'].apply(_norm_coord)
    geo_all['departamento'] = geo_all['departamento'].apply(_norm_text)
    geo_all['ciudad'] = geo_all['ciudad'].apply(_norm_text)
    # Para el par (depto, ciudad) que representa "sin informacion", ya queda como __NULL__
    geo_all = geo_all.drop_duplicates(subset=['cod_departamento', 'cod_ciudad'])
    dim_geo = upsert_dim(engine, geo_all, 'dim_geografia',
                          ['cod_departamento', 'departamento', 'cod_ciudad', 'ciudad', 'longitud', 'latitud'],
                          ['cod_departamento', 'cod_ciudad'], 'geografia_id')
    print(f"[ETL]   dim_geografia: {len(dim_geo)} registros")

    # ---------- dim_sede (admision y matricula comparten la tabla) ----------
    print("[ETL] Cargando dim_sede ...")
    sede_adm = df[['SNIES_SEDE_ADM', 'SEDE_NOMBRE_ADM']].copy()
    sede_adm.columns = ['codigo_snies', 'nombre_sede']
    sede_mat = df[['SNIES_SEDE_MAT', 'SEDE_NOMBRE_MAT']].copy()
    sede_mat.columns = ['codigo_snies', 'nombre_sede']
    sede_all = pd.concat([sede_adm, sede_mat], ignore_index=True)
    sede_all['nombre_sede'] = sede_all['nombre_sede'].apply(_norm_text)
    sede_all = sede_all.drop_duplicates(subset=['codigo_snies'])
    dim_sede = upsert_dim(engine, sede_all, 'dim_sede', ['codigo_snies', 'nombre_sede'],
                           ['codigo_snies'], 'sede_id')
    print(f"[ETL]   dim_sede: {len(dim_sede)} registros")

    # ---------- dim_facultad ----------
    print("[ETL] Cargando dim_facultad ...")
    dim_facultad_src = df[['FACULTAD']].drop_duplicates().copy()
    dim_facultad_src['nombre_facultad'] = dim_facultad_src['FACULTAD'].apply(_norm_text)
    dim_facultad = upsert_dim(engine, dim_facultad_src[['nombre_facultad']],
                               'dim_facultad', ['nombre_facultad'],
                               ['nombre_facultad'], 'facultad_id')
    print(f"[ETL]   dim_facultad: {len(dim_facultad)} registros")

    # ---------- dim_programa ----------
    print("[ETL] Cargando dim_programa ...")
    prog_src = df[['SNIES_PROGRA', 'PROGRAMA', 'AREAC_SNIES', 'CA_CINE', 'CD_CINE', 'AREA_CINE', 'FACULTAD']].drop_duplicates().copy()
    prog_src['codigo_snies'] = prog_src['SNIES_PROGRA'].apply(_norm_code)
    prog_src['nombre_programa'] = prog_src['PROGRAMA'].apply(_norm_text)
    prog_src['area_snies'] = prog_src['AREAC_SNIES'].apply(_norm_text)
    prog_src['codigo_cine_area'] = prog_src['CA_CINE'].apply(_norm_text)
    prog_src['codigo_cine_disc'] = prog_src['CD_CINE'].apply(_norm_text)
    prog_src['area_cine'] = prog_src['AREA_CINE'].apply(_norm_text)
    prog_src['nombre_facultad'] = prog_src['FACULTAD'].apply(_norm_text)
    prog_src = prog_src.merge(dim_facultad, left_on='nombre_facultad', right_on='nombre_facultad', suffixes=('', '_dup'))
    dim_programa = upsert_dim(engine,
                               prog_src[['codigo_snies', 'nombre_programa', 'area_snies',
                                          'codigo_cine_area', 'codigo_cine_disc', 'area_cine', 'facultad_id']],
                               'dim_programa',
                               ['codigo_snies', 'nombre_programa', 'area_snies', 'codigo_cine_area',
                                'codigo_cine_disc', 'area_cine', 'facultad_id'],
                               ['codigo_snies', 'nombre_programa'], 'programa_id')
    print(f"[ETL]   dim_programa: {len(dim_programa)} registros")

    # ---------- dim_admision ----------
    print("[ETL] Cargando dim_admision ...")
    adm_src = df[['MOD_ADM', 'TIPO_ADM', 'PAES', 'PEAMA', 'MOV_PEAMA', 'CONVENIO',
                  'TIP_CONVENIO', 'ADM_PEAMA_ANDINA']].drop_duplicates().copy()
    adm_src['modalidad_admision'] = adm_src['MOD_ADM'].apply(_norm_text)
    adm_src['tipo_admision'] = adm_src['TIPO_ADM'].apply(_norm_text)
    adm_src['paes'] = adm_src['PAES'].apply(_norm_text)
    adm_src['peama'] = adm_src['PEAMA'].apply(_norm_text)
    adm_src['mov_peama'] = adm_src['MOV_PEAMA'].apply(_norm_text)
    adm_src['convenio'] = adm_src['CONVENIO'].apply(_norm_text)
    adm_src['tipo_convenio'] = adm_src['TIP_CONVENIO'].apply(_norm_text)
    adm_src['adm_peama_andina'] = adm_src['ADM_PEAMA_ANDINA'].apply(_norm_text)
    dim_admision = upsert_dim(engine, adm_src,
                               'dim_admision',
                               ['modalidad_admision', 'tipo_admision', 'paes', 'peama', 'mov_peama',
                                'convenio', 'tipo_convenio', 'adm_peama_andina'],
                               ['modalidad_admision', 'tipo_admision', 'paes', 'peama', 'mov_peama',
                                'convenio', 'tipo_convenio', 'adm_peama_andina'],
                               'admision_id')
    print(f"[ETL]   dim_admision: {len(dim_admision)} registros")

    # ---------- construir tabla de hechos ----------
    print("[ETL] Construyendo tabla de hechos (merge de dimensiones)...")
    fact = df.copy()
    # Reemplazar los codigos a string de forma consistente (de NaN a __NULL__)
    fact['tipo_nivel'] = fact['TIPO_NIVEL'].apply(_norm_text)
    fact['nivel'] = fact['NIVEL'].apply(_norm_text)
    fact['nacionalidad'] = fact['NACIONALIDAD'].apply(_norm_text)
    fact['sexo'] = fact['SEXO'].apply(_norm_text)
    fact['estrato'] = fact['ESTRATO'].apply(_norm_text)
    fact['tipo_colegio'] = fact['TIPO_COL'].apply(_norm_text, default='__NULL__')
    fact['edad'] = pd.to_numeric(fact['EDAD'], errors='coerce').fillna(18).astype('int32')
    fact['edad'] = fact['edad'].clip(lower=10, upper=100)
    fact['pbm'] = pd.to_numeric(fact['PBM'], errors='coerce')
    fact['codigo_pais_nac'] = fact['CODS_NAC'].apply(_norm_code)
    fact['facultad_nombre'] = fact['FACULTAD'].apply(_norm_text)

    fact = fact.merge(dim_periodo, left_on=['YEAR', 'SEMESTRE'], right_on=['anio', 'semestre'])
    fact = fact.merge(dim_geo.add_suffix('_nac'), left_on=['COD_DEP_NAC', 'COD_CIU_NAC'],
                       right_on=['cod_departamento_nac', 'cod_ciudad_nac'])
    fact = fact.merge(dim_geo.add_suffix('_proc'), left_on=['COD_DEP_PROC', 'COD_CIU_PROC'],
                       right_on=['cod_departamento_proc', 'cod_ciudad_proc'])
    fact = fact.merge(dim_sede.add_suffix('_adm'), left_on='SNIES_SEDE_ADM', right_on='codigo_snies_adm')
    fact = fact.merge(dim_sede.add_suffix('_mat'), left_on='SNIES_SEDE_MAT', right_on='codigo_snies_mat')
    fact = fact.merge(dim_facultad, left_on='facultad_nombre', right_on='nombre_facultad', suffixes=('', '_fac'))
    fact['nombre_programa_join'] = fact['PROGRAMA'].apply(_norm_text)
    dim_programa_for_fact = dim_programa[['codigo_snies', 'nombre_programa', 'programa_id', 'facultad_id']].rename(
        columns={'programa_id': 'programa_id_prog', 'facultad_id': 'facultad_id_prog',
                 'codigo_snies': 'codigo_snies_prog', 'nombre_programa': 'nombre_programa_prog'})
    fact = fact.merge(dim_programa_for_fact, left_on=['SNIES_PROGRA', 'nombre_programa_join'],
                       right_on=['codigo_snies_prog', 'nombre_programa_prog'])
    fact = fact.merge(dim_admision, left_on=['MOD_ADM', 'TIPO_ADM', 'PAES', 'PEAMA', 'MOV_PEAMA',
                                              'CONVENIO', 'TIP_CONVENIO', 'ADM_PEAMA_ANDINA'],
                       right_on=['modalidad_admision', 'tipo_admision', 'paes', 'peama', 'mov_peama',
                                 'convenio', 'tipo_convenio', 'adm_peama_andina'])

    print(f"[ETL] Filas despues de merges: {len(fact)}")

    fact_final = pd.DataFrame({
        'periodo_id': fact['periodo_id'],
        'sede_admision_id': fact['sede_id_adm'],
        'sede_matricula_id': fact['sede_id_mat'],
        'facultad_id': fact['facultad_id'],
        'programa_id': fact['programa_id_prog'],
        'geografia_nac_id': fact['geografia_id_nac'],
        'geografia_proc_id': fact['geografia_id_proc'],
        'admision_id': fact['admision_id'],
        'tipo_nivel': fact['tipo_nivel'],
        'nivel': fact['nivel'],
        'nacionalidad': fact['nacionalidad'],
        'codigo_pais_nac': fact['codigo_pais_nac'],
        'edad': fact['edad'],
        'sexo': fact['sexo'],
        'estrato': fact['estrato'],
        'tipo_colegio': fact['tipo_colegio'],
        'pbm': fact['pbm'],
        'matriculado_pvez': fact['MAT_PVEZ'],
    })

    print(f"[ETL] Insertando {len(fact_final)} filas en fact_matricula ...")
    fact_final.to_sql('fact_matricula', engine, schema='unal', if_exists='append',
                       index=False, method='multi', chunksize=5000)
    print("[ETL] Carga completada exitosamente.")


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        import traceback
        traceback.print_exc()
        print(f"[ETL][ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
