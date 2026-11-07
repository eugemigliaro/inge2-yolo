#!/usr/bin/env bash
# Manda N eventos de Tomás, de a 20 en paralelo, y mide cuánto tarda el proyector en procesarlos todos.
set -eu
N=${1:-1000}; B=${B:-http://localhost:3000}; J=$(mktemp)
cd "$(dirname "$0")/.."
sql() { docker compose exec -T postgres psql -U yolo -tAc "$1"; }
accion=$(curl -s "$B/" | grep -o '\$ACTION_ID_[0-9a-f]*' | head -1)
curl -s -o /dev/null -c "$J" -H "Origin: $B" -F "$accion=" -F email=tomas@yolo.test -F password=yolo1234 "$B/"
antes=$(sql "select count(*) from eventos_procesados")
t0=$(date +%s.%N)
seq "$N" | xargs -P 20 -I{} sh -c "curl -s -o /dev/null -w '%{http_code}\n' -b $J -H 'content-type: application/json' \
  -d \"{\\\"eventId\\\":\\\"\$(cat /proc/sys/kernel/random/uuid)\\\",\\\"tipo\\\":\\\"decision\\\",\\\"area\\\":\\\"sistemas\\\",\\\"nivel\\\":1,\\\"situacion\\\":0,\\\"opcion\\\":1}\" $B/api/eventos" \
  | sort | uniq -c
t1=$(date +%s.%N)
until [ "$(sql "select count(*) from eventos_procesados")" -ge $((antes + N)) ]; do sleep 0.2; done
t2=$(date +%s.%N)
rm -f "$J"
echo "Ingesta: $N eventos en $(echo "$t1 - $t0" | bc) s. Todos procesados a los $(echo "$t2 - $t0" | bc) s (atraso del proyector: $(echo "$t2 - $t1" | bc) s)."
