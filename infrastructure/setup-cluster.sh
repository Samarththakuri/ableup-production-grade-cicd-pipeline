#!/bin/bash
set -e

CLUSTER_NAME="abelup-cluster"
REGION="us-east-1"
NODE_TYPE="t3.large" # Changed to t3.large: 8GB RAM is enough for SonarQube & Monitoring safely

echo "Creating AWS EKS Cluster: $CLUSTER_NAME in $REGION..."

eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --nodegroup-name standard-workers \
  --node-type $NODE_TYPE \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

echo "Cluster creation completed."
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME
echo "Kubeconfig updated. You can now access your cluster using kubectl."
