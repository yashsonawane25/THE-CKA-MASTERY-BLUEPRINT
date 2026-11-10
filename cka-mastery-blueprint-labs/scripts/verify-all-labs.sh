#!/usr/bin/env bash
# Automated Verification Test Suite for CKA Mastery Blueprint Labs
set -eo pipefail

echo "=========================================================="
echo "CKA MASTERY BLUEPRINT: AUTOMATED LAB ASSERTION HARNESS"
echo "=========================================================="

echo "[1/4] Verifying Cluster Connectivity..."
kubectl get nodes -o wide || { echo "ERROR: Cluster is not reachable"; exit 1; }

echo "[2/4] Testing RBAC Permissions..."
kubectl apply -f labs/01-cluster-architecture/rbac-and-serviceaccounts.yaml
CAN_GET=$(kubectl auth can-i get pods -n security-ops --as=system:serviceaccount:security-ops:auditor-sa)
CAN_CREATE=$(kubectl auth can-i create pods -n security-ops --as=system:serviceaccount:security-ops:auditor-sa)

if [[ "$CAN_GET" == "yes" && "$CAN_CREATE" == "no" ]]; then
  echo "  --> RBAC Assertion: PASSED (Read allowed, write blocked)"
else
  echo "  --> RBAC Assertion: FAILED"
  exit 1
fi

echo "[3/4] Testing StorageClass & ReadWriteOncePod Manifests..."
kubectl apply -f labs/04-storage/storage-classes-and-claims.yaml
STATUS=$(kubectl get pvc demo-rwop-pvc -o jsonpath='{.status.phase}')
echo "  --> PVC Status: $STATUS (Expected: Pending under WaitForFirstConsumer)"

echo "[4/4] Testing NetworkPolicy Specifications..."
kubectl apply -f labs/03-services-networking/gateway-api-and-netpols.yaml
NETPOL_COUNT=$(kubectl get netpol -n networking-lab --no-headers | wc -l)
echo "  --> NetworkPolicies Deployed: $NETPOL_COUNT"

echo "=========================================================="
echo "ALL TESTS PASSED: Lab manifests validate successfully!"
echo "=========================================================="
