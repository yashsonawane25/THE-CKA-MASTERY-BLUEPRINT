#!/usr/bin/env bash
# Teardown and Cleanup Harness for CKA Mastery Blueprint Labs
set -eo pipefail

echo "Cleaning up all lab namespaces and resources..."
kubectl delete -f labs/01-cluster-architecture/rbac-and-serviceaccounts.yaml --ignore-not-found=true
kubectl delete -f labs/03-services-networking/gateway-api-and-netpols.yaml --ignore-not-found=true
kubectl delete -f labs/04-storage/storage-classes-and-claims.yaml --ignore-not-found=true

kubectl delete namespace security-ops networking-lab --ignore-not-found=true
echo "Cleanup completed successfully."
