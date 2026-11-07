#!/usr/bin/env bash
# Crea (si no existe) una VM en Azure, copia el proyecto y lo levanta con Docker Compose y HTTPS.
# Requiere: Azure CLI con sesión iniciada (az login), ssh y rsync.
set -euo pipefail
RG=${RG:-yolo-tpif}
LOCATION=${LOCATION:-eastus2}  # Azure for Students solo permite algunas regiones: si falla, probá otra
VM=${VM:-yolo-vm}
SIZE=${SIZE:-Standard_B2s}     # 2 vCPU, 4 GB de RAM
DNS=${DNS:-yolo-tpif-$(az account show --query id -o tsv | cut -c1-6)}
cd "$(dirname "$0")/.."

if ! az vm show -g "$RG" -n "$VM" -o none 2>/dev/null; then
  az group create -n "$RG" -l "$LOCATION" -o none
  az vm create -g "$RG" -n "$VM" --image Ubuntu2404 --size "$SIZE" --admin-username azureuser --generate-ssh-keys \
    --public-ip-sku Standard --public-ip-address-dns-name "$DNS" --custom-data deploy/cloud-init.yaml -o none
  az vm open-port -g "$RG" -n "$VM" --port 80 --priority 900 -o none
  az vm open-port -g "$RG" -n "$VM" --port 443 --priority 901 -o none
fi

HOST=$(az vm show -d -g "$RG" -n "$VM" --query fqdns -o tsv)
until ssh -o StrictHostKeyChecking=accept-new "azureuser@$HOST" docker version >/dev/null 2>&1; do
  echo "Esperando a que la VM termine de instalar Docker..."; sleep 15
done
rsync -az --delete --exclude node_modules --exclude .next --exclude .git --exclude .env ./ "azureuser@$HOST:yolo/"
# La contraseña de Postgres se genera una sola vez en la VM y nunca sale de ahí.
ssh "azureuser@$HOST" "cd yolo && { [ -f .env ] || printf 'POSTGRES_PASSWORD=%s\nDOMINIO=%s\n' \$(openssl rand -hex 16) $HOST > .env; } \
  && docker compose -f docker-compose.yml -f deploy/docker-compose.cloud.yml up -d --build"
echo "Listo: https://$HOST"
