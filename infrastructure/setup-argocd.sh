#!/bin/bash
set -e

NAMESPACE="argocd"

echo "Creating namespace $NAMESPACE..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "Installing ArgoCD..."
kubectl apply -n $NAMESPACE -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD server deployment..."
kubectl rollout status deployment/argocd-server -n $NAMESPACE

echo "Patching ArgoCD server to type LoadBalancer to expose the UI..."
kubectl patch svc argocd-server -n $NAMESPACE -p '{"spec": {"type": "LoadBalancer"}}'

echo "ArgoCD initial admin password:"
kubectl -n $NAMESPACE get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo -e "\n\nArgoCD installation complete. Check LoadBalancer DNS with: kubectl get svc -n $NAMESPACE"
