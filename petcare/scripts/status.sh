#!/bin/bash

echo "Nós do cluster:"
kubectl get nodes -o wide

echo ""
echo "Pods do namespace petcare:"
kubectl get pods -n petcare -o wide

echo ""
echo "Services do namespace petcare:"
kubectl get svc -n petcare

echo ""
echo "Deployments do namespace petcare:"
kubectl get deployments -n petcare

echo ""
echo "Eventos recentes do namespace petcare:"
kubectl get events -n petcare --sort-by=.metadata.creationTimestamp | tail -30
