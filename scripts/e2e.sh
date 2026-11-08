#!/usr/bin/env bash
# Prueba de punta a punta contra el stack levantado (docker compose up). Usa la cuenta de Tomás.
# Pide un token de sesión a Clerk. Agrega datos a Tomás: después, docker compose down -v && docker compose up -d
set -u
B=${B:-http://localhost:3000}; FALLAS=0
cd "$(dirname "$0")/.."
if [ -z "${CLERK_SECRET_KEY:-}" ] && [ -f .env ]; then
  CLERK_SECRET_KEY=$(grep -E '^CLERK_SECRET_KEY=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  export CLERK_SECRET_KEY
fi
check() { if [ "$2" = "$3" ]; then echo "ok    $1"; else echo "FALLA $1: dio '$2', se esperaba '$3'"; FALLAS=$((FALLAS + 1)); fi; }
uuid() { uuidgen | tr '[:upper:]' '[:lower:]'; }
sql() { docker compose exec -T postgres psql -U yolo -tAc "$1"; }
ev() { curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $1" -H 'content-type: application/json' -d "$2" "$B/api/eventos"; }
pagina() { curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $1" "$2"; }

TOMAS_T=$(bun scripts/clerk.mjs token tomas+clerk_test@example.com)
ANA_T=$(bun scripts/clerk.mjs token ana+clerk_test@example.com)
PABLO_T=$(bun scripts/clerk.mjs token pablo+clerk_test@example.com)
[ -n "$TOMAS_T" ] && [ -n "$ANA_T" ] && [ -n "$PABLO_T" ] || { echo "No pude obtener los tokens. Corré: bun scripts/clerk.mjs"; exit 1; }

TOMAS=22222222-2222-4222-8222-222222222222; JUANA=11111111-1111-4111-8111-111111111111

check "evento sin sesión"      "$(curl -s -o /dev/null -w '%{http_code}' -H 'content-type: application/json' -d '{}' "$B/api/eventos")" 401
check "evento de un padre"     "$(ev "$ANA_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"medicina\",\"nivel\":1}")" 401
check "área inexistente"       "$(ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"magia\",\"nivel\":1}")" 400
check "nivel inexistente"      "$(ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"medicina\",\"nivel\":9}")" 400
check "intento sin respuesta"  "$(ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"intento\",\"area\":\"medicina\",\"nivel\":1}")" 400
check "completado inventado"   "$(ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_completado\",\"area\":\"medicina\",\"nivel\":1}")" 400
check "eventId que no es UUID" "$(ev "$TOMAS_T" '{"eventId":"x","tipo":"nivel_iniciado","area":"medicina","nivel":1}')" 400

antes=$(sql "select coalesce(sum(completados), 0) from progreso_area where alumno_id = '$TOMAS' and area = 'medicina'")
DUP=$(uuid)
ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"medicina\",\"nivel\":1}" >/dev/null
check "el caso se completa" "$(ev "$TOMAS_T" "{\"eventId\":\"$DUP\",\"tipo\":\"intento\",\"area\":\"medicina\",\"nivel\":1,\"respuesta\":\"Resfrío\"}")" 202
check "reenvío aceptado"    "$(ev "$TOMAS_T" "{\"eventId\":\"$DUP\",\"tipo\":\"intento\",\"area\":\"medicina\",\"nivel\":1,\"respuesta\":\"Resfrío\"}")" 202

frus=$(sql "select count(*) from alertas where alumno_id = '$TOMAS' and tipo = 'frustracion'")
for palabra in zzzz yyyy; do
  ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"intento\",\"area\":\"sistemas\",\"nivel\":1,\"respuesta\":\"$palabra\"}" >/dev/null
  ev "$TOMAS_T" "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_abandonado\",\"area\":\"sistemas\",\"nivel\":1}" >/dev/null
done
sleep 3
check "el reenvío se contó una sola vez" "$(sql "select coalesce(sum(completados), 0) from progreso_area where alumno_id = '$TOMAS' and area = 'medicina'")" "$((antes + 1))"
check "alerta de frustración" "$(sql "select count(*) from alertas where alumno_id = '$TOMAS' and tipo = 'frustracion'")" "$((frus + 1))"

check "Ana ve a Tomás"        "$(pagina "$ANA_T" "$B/tutor?alumno=$TOMAS")" 200
check "Pablo no ve a Juana"   "$(pagina "$PABLO_T" "$B/tutor?alumno=$JUANA")" 404
check "un alumno no entra a /tutor" "$(pagina "$TOMAS_T" "$B/tutor")" 307

[ $FALLAS -eq 0 ] && echo "Todo bien." || { echo "$FALLAS fallas."; exit 1; }
