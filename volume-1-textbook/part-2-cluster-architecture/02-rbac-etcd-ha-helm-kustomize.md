# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART II: CLUSTER ARCHITECTURE, INSTALLATION & LIFECYCLE
## CHAPTERS 15, 16, 20–23: RBAC, SERVICEACCOUNTS, ETCD DISASTER RECOVERY, HELM & KUSTOMIZE

---

### CHAPTER 15: ROLE-BASED ACCESS CONTROL (RBAC)

#### 1. Learning Objectives
* Understand the RBAC evaluation model: Subjects, API Groups, Resources, and Verbs.
* Contrast namespace-scoped `Roles` with cluster-wide `ClusterRoles`.
* Bind permissions using `RoleBindings` and `ClusterRoleBindings`.

#### 2. The RBAC Data Model
```
┌───────────────────────────┐         Bound By          ┌───────────────────────────┐
│          SUBJECT          │ ◄───────────────────────► │           ROLE            │
│  User: alice              │      RoleBinding /        │  apiGroups: ["apps"]      │
│  Group: developers        │   ClusterRoleBinding      │  resources: ["deployments"]│
│  ServiceAccount: runner   │                           │  verbs: ["get", "list"]   │
└───────────────────────────┘                           └───────────────────────────┘
```

#### 3. Production RBAC Manifest Example
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: engineering
  name: deployment-operator
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  namespace: engineering
  name: bind-deployment-operator
subjects:
- kind: User
  name: bob
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: ci-bot
  namespace: engineering
roleRef:
  kind: Role
  name: deployment-operator
  apiGroup: rbac.authorization.k8s.io
```

---

### CHAPTER 16: SERVICEACCOUNTS AND POD AUTHENTICATION

#### 1. ServiceAccount Token Projection
Modern Kubernetes (v1.24+) does not automatically create static bearer token secrets for ServiceAccounts. Instead, tokens are projected dynamically into pods as projected volumes using the TokenRequest API:
* Tokens have an expiration time (default 1 hour).
* Tokens are automatically rotated by kubelet without restarting the container.
* Bound directly to the Pod's lifecycle.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-reader-sa
  namespace: default
---
apiVersion: v1
kind: Pod
metadata:
  name: app-reader-pod
spec:
  serviceAccountName: app-reader-sa
  containers:
  - name: runner
    image: curlimages/curl:8.10.1
    command: ["sleep", "3600"]
```

---

### CHAPTER 20: HIGHLY AVAILABLE KUBERNETES CLUSTERS

#### 1. Stacked vs. External etcd Topologies
1. **Stacked etcd Topology:** etcd runs as static pods on the same nodes as the control plane components. Simpler to manage via `kubeadm init --upload-certs`. Requires at least 3 control plane nodes.
2. **External etcd Topology:** etcd runs on dedicated external servers. Decouples control plane compute from etcd storage I/O.

#### 2. Control Plane Load Balancer
A high-availability control plane requires a TCP load balancer (e.g., HAProxy + Keepalived) in front of the API servers:
* Virtual IP: `192.168.1.100:6443`
* Backends: `cp-node-1:6443`, `cp-node-2:6443`, `cp-node-3:6443`
* Pass `--control-plane-endpoint="192.168.1.100:6443"` to `kubeadm init`.

---

### CHAPTER 21: ETCD ARCHITECTURE, BACKUP AND DISASTER RECOVERY

#### 1. The Definitive 7-Step etcd Disaster Recovery Runbook
This is the single most heavily tested administrative procedure on the CKA examination.

```bash
# STEP 1: Identify etcd Static Pod Configuration & PKI Paths
sudo grep -E "cert-file|key-file|trusted-ca-file|data-dir" /etc/kubernetes/manifests/etcd.yaml

# STEP 2: Save Snapshot using etcdctl v3
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /opt/snapshot-pre-disaster.db

# STEP 3: Verify Snapshot Integrity
ETCDCTL_API=3 etcdctl --write-out=table snapshot status /opt/snapshot-pre-disaster.db

# STEP 4: Stop kube-apiserver by moving manifest temporarily
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# STEP 5: Restore Snapshot to a BRAND NEW Target Data Directory
ETCDCTL_API=3 etcdctl snapshot restore /opt/snapshot-pre-disaster.db \
  --data-dir=/var/lib/etcd-from-backup \
  --initial-cluster="master=https://127.0.0.1:2380" \
  --initial-cluster-token="etcd-cluster-token" \
  --initial-advertise-peer-urls="https://127.0.0.1:2380" \
  --name="master"

# STEP 6: Update etcd Static Pod Manifest hostPath Volume
sudo sed -i 's|path: /var/lib/etcd|path: /var/lib/etcd-from-backup|g' /etc/kubernetes/manifests/etcd.yaml

# STEP 7: Restore kube-apiserver & Verify Cluster Health
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
sleep 20
kubectl get nodes
```

---

### CHAPTER 22: HELM AND KUSTOMIZE PACKAGE MANAGEMENT

#### 1. Helm Package Manager Fundamentals
Helm is the official package manager for Kubernetes.
```bash
# Add and update repositories
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install chart with custom values
helm install my-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-system --create-namespace \
  --set controller.replicaCount=2 \
  -f custom-values.yaml

# Upgrade release
helm upgrade my-ingress ingress-nginx/ingress-nginx --set controller.replicaCount=3

# Inspect release history and rollback
helm history my-ingress -n ingress-system
helm rollback my-ingress 1 -n ingress-system
```

#### 2. Kustomize Overlay Architecture
Kustomize enables template-free customization of Kubernetes manifests via `kustomization.yaml` files.
```
app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    └── prod/
        ├── kustomization.yaml
        └── replica_patch.yaml
```

**`base/kustomization.yaml`:**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
```

**`overlays/prod/kustomization.yaml`:**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namePrefix: prod-
patchesStrategicMerge:
- replica_patch.yaml
```

**Applying Kustomize:**
```bash
kubectl apply -k overlays/prod/
```

---

### CHAPTER 23: CRDS, OPERATORS AND EXTENSION INTERFACES

#### 1. Custom Resource Definitions (CRDs)
CRDs extend the Kubernetes API with user-defined schemas using OpenAPI v3 validation:
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: backups.storage.acme.io
spec:
  group: storage.acme.io
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              schedule:
                type: string
  scope: Namespaced
  names:
    plural: backups
    singular: backup
    kind: Backup
```

#### 2. The Operator Pattern
An Operator pairs a Custom Resource with a custom Controller. The controller watches events on the CRD and automates state management (e.g., PostgreSQL backup, automated failover, schema migrations).
