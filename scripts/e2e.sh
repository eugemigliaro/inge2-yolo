#!/usr/bin/env bash
# Prueba de punta a punta contra el stack levantado (docker compose up). Usa la cuenta de Tomás.
# Ojo: agrega datos al recorrido de Tomás. Para volver al estado inicial: docker compose down -v && docker compose up -d
set -u
B=${B:-http://localhost:3000}; J=$(mktemp -d); FALLAS=0
cd "$(dirname "$0")/.."
check() { if [ "$2" = "$3" ]; then echo "ok    $1"; else echo "FALLA $1: dio '$2', se esperaba '$3'"; FALLAS=$((FALLAS + 1)); fi; }
uuid() { cat /proc/sys/kernel/random/uuid; }
sql() { docker compose exec -T postgres psql -U yolo -tAc "$1"; }
login() { # email clave -> URL a la que redirige; guarda la cookie en $J/<email>
  local accion; accion=$(curl -s "$B/" | grep -o '\$ACTION_ID_[0-9a-f]*' | head -1)
  curl -s -o /dev/null -w '%{redirect_url}' -c "$J/$1" -H "Origin: $B" -F "$accion=" -F "email=$1" -F "password=$2" "$B/"
}
ev() { curl -s -o /dev/null -w '%{http_code}' -b "$J/$1" -H 'content-type: application/json' -d "$2" "$B/api/eventos"; }
TOMAS=22222222-2222-4222-8222-222222222222; JUANA=11111111-1111-4111-8111-111111111111

check "login con clave incorrecta" "$(login tomas@yolo.test mal)"      "$B/?error=1"
check "login alumno va a /jugar"   "$(login tomas@yolo.test yolo1234)" "$B/jugar"
check "login tutor va a /tutor"    "$(login ana@yolo.test yolo1234)"   "$B/tutor"
login pablo@yolo.test yolo1234 >/dev/null

check "evento sin sesión"      "$(curl -s -o /dev/null -w '%{http_code}' -H 'content-type: application/json' -d '{}' "$B/api/eventos")" 401
check "evento de un tutor"     "$(ev ana@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"medicina\",\"nivel\":1}")" 401
check "área inexistente"       "$(ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"magia\",\"nivel\":1}")" 400
check "nivel inexistente"      "$(ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"medicina\",\"nivel\":9}")" 400
check "opción inexistente"     "$(ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"decision\",\"area\":\"medicina\",\"nivel\":1,\"situacion\":0,\"opcion\":7}")" 400
check "eventId que no es UUID" "$(ev tomas@yolo.test '{"eventId":"x","tipo":"nivel_iniciado","area":"medicina","nivel":1}')" 400

antes=$(sql "select coalesce(sum(completados), 0) from progreso_area where alumno_id = '$TOMAS' and area = 'derecho'")
# Tomás completa el nivel 1 de Derecho; el evento de completado se manda dos veces (reintento del navegador).
DUP=$(uuid)
ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"derecho\",\"nivel\":1}" >/dev/null
ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"decision\",\"area\":\"derecho\",\"nivel\":1,\"situacion\":0,\"opcion\":1}" >/dev/null
check "completado" "$(ev tomas@yolo.test "{\"eventId\":\"$DUP\",\"tipo\":\"nivel_completado\",\"area\":\"derecho\",\"nivel\":1}")" 202
check "reenvío aceptado" "$(ev tomas@yolo.test "{\"eventId\":\"$DUP\",\"tipo\":\"nivel_completado\",\"area\":\"derecho\",\"nivel\":1}")" 202
# Tres abandonos rápidos en Sistemas -> alerta de frustración.
frus=$(sql "select count(*) from alertas where alumno_id = '$TOMAS' and tipo = 'frustracion'")
for _ in 1 2 3; do
  ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_iniciado\",\"area\":\"sistemas\",\"nivel\":1}" >/dev/null
  ev tomas@yolo.test "{\"eventId\":\"$(uuid)\",\"tipo\":\"nivel_abandonado\",\"area\":\"sistemas\",\"nivel\":1}" >/dev/null
done
sleep 3
check "el reenvío se contó una sola vez" "$(sql "select sum(completados) from progreso_area where alumno_id = '$TOMAS' and area = 'derecho'")" "$((antes + 1))"
check "alerta de frustración" "$(sql "select count(*) from alertas where alumno_id = '$TOMAS' and tipo = 'frustracion'")" "$((frus + 1))"

check "Ana ve a Tomás"     "$(curl -s -o /dev/null -w '%{http_code}' -b "$J/ana@yolo.test" "$B/tutor?alumno=$TOMAS")" 200
check "Pablo no ve a Juana" "$(curl -s -o /dev/null -w '%{http_code}' -b "$J/pablo@yolo.test" "$B/tutor?alumno=$JUANA")" 404
check "un alumno no entra a /tutor" "$(curl -s -o /dev/null -w '%{http_code}' -b "$J/tomas@yolo.test" "$B/tutor")" 307

rm -rf "$J"
[ $FALLAS -eq 0 ] && echo "Todo bien." || { echo "$FALLAS fallas."; exit 1; }
