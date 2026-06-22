#!/bin/bash
set -e

echo "============================================"
echo " Deploy PetCare Cloud no Kubernetes/K3s"
echo "============================================"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Erro: kubectl não encontrado. Rode este script na EC2 master do K3s ou em uma máquina com kubeconfig configurado."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
K8S_DIR="$PROJECT_DIR/k8s"

echo "Aplicando manifests da pasta: $K8S_DIR"
kubectl apply -f "$K8S_DIR"

echo ""
echo "Aguardando MongoDB ficar pronto..."
kubectl rollout status deployment/mongodb -n petcare --timeout=180s

echo "Aguardando Backend ficar pronto..."
kubectl rollout status deployment/backend -n petcare --timeout=180s || true

echo "Aguardando Frontend ficar pronto..."
kubectl rollout status deployment/frontend -n petcare --timeout=180s || true

echo ""
echo "Status dos pods:"
kubectl get pods -n petcare -o wide

echo ""
echo "Services:"
kubectl get svc -n petcare

echo ""
echo "Deploy finalizado."
echo "Frontend NodePort: http://IP_PUBLICO_DA_EC2:30081"
echo "Backend NodePort:  http://IP_PUBLICO_DA_EC2:30080"
