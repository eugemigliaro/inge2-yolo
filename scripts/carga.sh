#!/usr/bin/env bash
# Manda N eventos de Tomás, de a 20 en paralelo, y mide cuánto tarda el proyector en procesarlos todos.
set -eu
N=${1:-1000}; B=${B:-http://localhost:3000}
cd "$(dirname "$0")/.."
sql() { docker compose exec -T postgres psql -U yolo -tAc "$1"; }
ahora() { bun -e 'process.stdout.write(String(Date.now()))'; }
TOKEN=$(bun scripts/clerk.mjs token tomas+clerk_test@example.com)
antes=$(sql "select count(*) from eventos_procesados")
t0=$(ahora)
seq "$N" | xargs -P 20 -I{} sh -c 'curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $1" -H "content-type: application/json" \
  -d "{\"eventId\":\"$(uuidgen | tr "[:upper:]" "[:lower:]")\",\"tipo\":\"nivel_iniciado\",\"area\":\"sistemas\",\"nivel\":1}" "$2"' _ "$TOKEN" "$B/api/eventos" \
  | sort | uniq -c
t1=$(ahora)
until [ "$(sql "select count(*) from eventos_procesados")" -ge $((antes + N)) ]; do sleep 0.2; done
t2=$(ahora)
bun -e 'const [t0,t1,t2,n]=process.argv.slice(1).map(Number); const s=(a,b)=>((b-a)/1000).toFixed(1); console.log(`Ingesta: ${n} eventos en ${s(t0,t1)} s. Todos procesados a los ${s(t0,t2)} s (atraso del proyector: ${s(t1,t2)} s).`)' "$t0" "$t1" "$t2" "$N"
