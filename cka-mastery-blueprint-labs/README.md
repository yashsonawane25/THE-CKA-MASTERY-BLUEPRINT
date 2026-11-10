# Companion Lab Repository
## The CKA Mastery Blueprint (2026–2027 Professional Edition)
**Repository:** `cka-mastery-blueprint-labs-v2`  
**License:** Apache 2.0  
**Target Kubernetes Version:** v1.31.x / v1.32.x (Compatible through v1.33+)

---

## 1. OVERVIEW
This companion repository provides complete, tested, and reproducible infrastructure code, Kubernetes manifests, chaos injection scripts, and verification test harnesses for all **67 hands-on labs** and **4 proctored mock examinations** featured in *The CKA Mastery Blueprint*.

### Quick Navigation:
* `setup/`: Cluster deployment files for Kind (local Docker) and Kubeadm (multi-node Linux VMs).
* `labs/`: Isolated manifests and scenario instructions for Domains 1 through 5.
* `mock-exams/`: Starting state manifests and automated scoring scripts for Mock Exams 1–4.
* `scripts/`: One-click setup, automated verification, and cleanup harnesses.
* `.github/workflows/`: CI pipeline validating YAML syntax and OpenAPI schemas.

---

## 2. QUICK START WITH KIND (LOCAL MULTI-NODE CLUSTER)

```bash
# 1. Clone repository
git clone https://github.com/cloudnative-press/cka-mastery-blueprint-labs.git
cd cka-mastery-blueprint-labs

# 2. Provision 3-Node Kubernetes v1.31 Cluster
kind create cluster --config setup/kind/kind-multi-node.yaml --name cka-cluster

# 3. Verify Cluster Nodes
kubectl get nodes -o wide

# 4. Install Gateway API CRDs v1.1.0
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.1.0/standard-install.yaml

# 5. Execute Automated Lab Assertions
./scripts/verify-all-labs.sh
```

---

## 3. PHYSICAL VM & KUBEADM REQUIREMENTS
> [!NOTE]
> While 80% of workload and networking labs run cleanly inside Kind, specific cluster administration tasks (such as kubeadm upgrades, etcd static pod hostPath mounts, and systemd cgroup driver changes) require a real Linux Virtual Machine running Ubuntu 22.04 LTS. See `setup/kubeadm/README.md`.
