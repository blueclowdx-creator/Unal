#!/bin/sh
TOKEN=$(curl -s -X POST http://localhost:80/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"unal2024"}' | grep -oE '"accessToken":"[^"]+"' | sed 's/"accessToken":"//;s/"$//')

echo "=== Clustering (perfiles) ==="
curl -s "http://localhost:80/api/modelos/clustering/perfiles?k=4&muestra=3000" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Monte Carlo ==="
curl -s "http://localhost:80/api/modelos/simulacion/montecarlo?periodosFuturos=8&iteraciones=3000" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Regresion Bogota 4 ==="
curl -s "http://localhost:80/api/modelos/regresion/proyeccion?sede=Bogota&periodosFuturos=4" -H "Authorization: Bearer $TOKEN"
echo ""
echo "=== Optimizacion Bogota 500 ==="
curl -s "http://localhost:80/api/modelos/optimizacion/cupos?sede=Bogota&cuposTotales=500" -H "Authorization: Bearer $TOKEN"