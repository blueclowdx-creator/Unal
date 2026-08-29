#!/bin/sh
# Login
RESP=$(curl -s -X POST http://localhost:80/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"unal2024\"}")
TOKEN=$(echo "$RESP" | grep -oE '"accessToken":"[^"]+"' | sed 's/"accessToken":"//;s/"$//')
echo "Token: ${TOKEN:0:30}..."

echo ""
echo "=== Regresion Bogota ==="
curl -s -w "HTTP %{http_code}\n" "http://localhost:80/api/modelos/regresion/proyeccion?sede=Bogota&periodosFuturos=4" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Regresion De La Paz (1 dato, no funciona regresion) ==="
curl -s -w "HTTP %{http_code}\n" "http://localhost:80/api/modelos/regresion/proyeccion?sede=De%20La%20Paz&periodosFuturos=4" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Regresion Tumaco (varios datos) ==="
curl -s -w "HTTP %{http_code}\n" "http://localhost:80/api/modelos/regresion/proyeccion?sede=Tumaco&periodosFuturos=4" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Regresion Orinoquia (varios datos) ==="
curl -s -w "HTTP %{http_code}\n" "http://localhost:80/api/modelos/regresion/proyeccion?sede=Orinoquia&periodosFuturos=4" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Optimizacion De La Paz ==="
curl -s -w "HTTP %{http_code}\n" "http://localhost:80/api/modelos/optimizacion/cupos?sede=De%20La%20Paz&cuposTotales=100" -H "Authorization: Bearer $TOKEN"
