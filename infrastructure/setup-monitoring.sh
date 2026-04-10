#!/bin/bash
set -e

NAMESPACE="monitoring"

echo "Adding Prometheus community Helm repo..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

echo "Creating namespace $NAMESPACE..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "Installing kube-prometheus-stack..."
helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace $NAMESPACE \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

echo "Prometheus and Grafana installed successfully."
echo "To access Grafana locally, run:"
echo "kubectl port-forward svc/prometheus-stack-grafana -n $NAMESPACE 8080:80"
echo "Grafana Default Credentials: admin / prom-operator"
