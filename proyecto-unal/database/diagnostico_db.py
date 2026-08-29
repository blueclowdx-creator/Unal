import psycopg2
import traceback

print("=== DIAGNOSTICO PSYCOPG2 ===")
print("Python OK")
print("psycopg2:", psycopg2.__version__)
print("libpq:", psycopg2.__libpq_version__)

try:
    print("Intentando conexion...")
    
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5432,
        dbname="unal_db",
        user="unal_user",
        password="unal_pass",
        sslmode="disable",
        connect_timeout=5
    )
    
    print("================================")
    print("CONEXION EXITOSA")
    print("================================")
    
    print("DSN:", conn.get_dsn_parameters())
    conn.close()

except Exception as e:
    print("================================")
    print("ERROR DETECTADO")
    print("================================")
    print("Tipo:", type(e))
    print("Mensaje:", str(e))
    print("Args:", repr(e.args))
    print("PGERROR:", repr(getattr(e, "pgerror", None)))
    print("PGCODE:", repr(getattr(e, "pgcode", None)))
    print("DIAG:", repr(getattr(e, "diag", None)))
    print("TRACEBACK:")
    traceback.print_exc()
