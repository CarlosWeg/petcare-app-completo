#!/bin/bash
set -e

echo "Removendo PetCare Cloud do Kubernetes..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
K8S_DIR="$PROJECT_DIR/k8s"

kubectl delete -f "$K8S_DIR" --ignore-not-found=true

echo "Aplicação removida."
