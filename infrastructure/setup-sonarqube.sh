#!/bin/bash
set -e

NAMESPACE="sonarqube"
RELEASE_NAME="sonarqube"

echo "Adding SonarQube Helm repo..."
helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube || true
helm repo update

echo "Creating namespace $NAMESPACE..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "Creating monitoring passcode secret..."
kubectl create secret generic sonarqube-passcode \
  -n $NAMESPACE \
  --from-literal=passcode=$(openssl rand -base64 32) \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Installing/Upgrading SonarQube..."

helm upgrade --install $RELEASE_NAME sonarqube/sonarqube \
  --namespace $NAMESPACE \
  --set service.type=LoadBalancer \
  --set community.enabled=true \
  --set monitoringPasscodeSecretName=sonarqube-passcode \
  --set monitoringPasscodeSecretKey=passcode

echo "--------------------------------------------------"
echo "✅ SonarQube is being provisioned..."
echo "Check pod status:"
echo "kubectl get pods -n $NAMESPACE"
echo ""
echo "Get access URL:"
echo "kubectl get svc -n $NAMESPACE"
echo "--------------------------------------------------"