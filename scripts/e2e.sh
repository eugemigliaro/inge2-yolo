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
# ev TOKEN EVENT_ID TIPO AREA NIVEL [CAMPOS_EXTRA]. El JSON se arma acá adentro: el bash 3.2 de macOS
# expande las llaves de un JSON escrito entre comillas dentro de "$(...)" y lo parte en varias palabras.
ev() {
  local cuerpo
  cuerpo=$(printf '{"eventId":"%s","tipo":"%s","area":"%s","nivel":%s%s}' "$2" "$3" "$4" "$5" "${6:+,$6}")
  curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $1" -H 'content-type: application/json' -d "$cuerpo" "$B/api/eventos"
}
pagina() { curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $1" "$2"; }

TOMAS_T=$(bun scripts/clerk.mjs token tomas+clerk_test@example.com)
ANA_T=$(bun scripts/clerk.mjs token ana+clerk_test@example.com)
PABLO_T=$(bun scripts/clerk.mjs token pablo+clerk_test@example.com)
[ -n "$TOMAS_T" ] && [ -n "$ANA_T" ] && [ -n "$PABLO_T" ] || { echo "No pude obtener los tokens. Corré: bun scripts/clerk.mjs"; exit 1; }

TOMAS=22222222-2222-4222-8222-222222222222; JUANA=11111111-1111-4111-8111-111111111111

check "evento sin sesión"      "$(curl -s -o /dev/null -w '%{http_code}' -H 'content-type: application/json' -d '{}' "$B/api/eventos")" 401
check "evento de un padre"     "$(ev "$ANA_T" "$(uuid)" nivel_iniciado medicina 1)" 401
check "área inexistente"       "$(ev "$TOMAS_T" "$(uuid)" nivel_iniciado magia 1)" 400
check "nivel inexistente"      "$(ev "$TOMAS_T" "$(uuid)" nivel_iniciado medicina 10)" 400
check "intento sin respuesta"  "$(ev "$TOMAS_T" "$(uuid)" intento medicina 1)" 400
check "completado inventado"   "$(ev "$TOMAS_T" "$(uuid)" nivel_completado medicina 1)" 400
check "eventId que no es UUID" "$(ev "$TOMAS_T" x nivel_iniciado medicina 1)" 400

# Los intentos se cuentan siempre, aunque el nivel ya esté completado: así la prueba no depende de lo que jugó Tomás.
antes=$(sql "select coalesce(sum(intentos), 0) from progreso_area where alumno_id = '$TOMAS' and area = 'medicina'")
DUP=$(uuid)
ev "$TOMAS_T" "$(uuid)" nivel_iniciado medicina 1 >/dev/null
check "el caso acepta el intento" "$(ev "$TOMAS_T" "$DUP" intento medicina 1 '"respuesta":"Resfrío"')" 202
check "reenvío aceptado"    "$(ev "$TOMAS_T" "$DUP" intento medicina 1 '"respuesta":"Resfrío"')" 202

frus=$(sql "select count(*) from alertas where alumno_id = '$TOMAS' and tipo = 'frustracion'")
# La frustración se prueba en La bajada, en el primer nivel de Sistemas que Tomás todavía no completó.
# Si ya completó los 9, se libera el último. En los dos casos se borra la partida de ese nivel, así que
# arranca sin respuestas aceptadas: una sola por visita nunca completa el nivel, que pide 3 o más.
NIVEL_S=$(sql "select least(coalesce(max(nivel), 0) + 1, 9) from (
  select nivel from partida where alumno_id = '$TOMAS' and area = 'sistemas' and (estado->>'completado')::boolean
  union all select nivel_max from progreso_area where alumno_id = '$TOMAS' and area = 'sistemas') t")
sql "delete from partida where alumno_id = '$TOMAS' and area = 'sistemas' and nivel = $NIVEL_S" >/dev/null
echo "      frustración en Sistemas, nivel $NIVEL_S"
# Dos respuestas del banco de ese nivel: una palabra que no está en el banco no se publica y no cuenta como intento.
PALABRAS=$(bun -e "const { NIVELES, mostrar } = await import('./web/lib/juegos/bajada.ts');
  console.log(NIVELES[$NIVEL_S - 1].banco.slice(0, 2).map(mostrar).join('\n'))")
for i in 1 2; do
  palabra=$(printf '%s\n' "$PALABRAS" | sed -n "${i}p")
  ev "$TOMAS_T" "$(uuid)" intento sistemas "$NIVEL_S" "\"respuesta\":\"$palabra\"" >/dev/null
  ev "$TOMAS_T" "$(uuid)" nivel_abandonado sistemas "$NIVEL_S" >/dev/null
done
sleep 3
check "el reenvío se contó una sola vez" "$(sql "select coalesce(sum(intentos), 0) from progreso_area where alumno_id = '$TOMAS' and area = 'medicina'")" "$((antes + 1))"
check "alerta de frustración" "$(sql "select count(*) from alertas where alumno_id = '$TOMAS' and tipo = 'frustracion'")" "$((frus + 1))"

hecho=$(sql "select greatest(
  (select coalesce(max(nivel), 0) from partida where alumno_id = '$TOMAS' and area = 'derecho' and (estado->>'completado')::boolean),
  (select coalesce(max(nivel_max), 0) from progreso_area where alumno_id = '$TOMAS' and area = 'derecho'))")
[ "$hecho" -ge 2 ] && esperado=202 || esperado=403
check "nivel 3 solo si se completó el 2" "$(ev "$TOMAS_T" "$(uuid)" nivel_iniciado derecho 3)" "$esperado"

check "Ana ve a Tomás"        "$(pagina "$ANA_T" "$B/tutor?alumno=$TOMAS")" 200
check "Pablo no ve a Juana"   "$(pagina "$PABLO_T" "$B/tutor?alumno=$JUANA")" 404
check "un alumno no entra a /tutor" "$(pagina "$TOMAS_T" "$B/tutor")" 307

[ $FALLAS -eq 0 ] && echo "Todo bien." || { echo "$FALLAS fallas."; exit 1; }
