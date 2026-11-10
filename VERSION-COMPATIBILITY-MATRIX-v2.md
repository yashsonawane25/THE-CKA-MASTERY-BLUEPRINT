# KUBERNETES VERSION & API COMPATIBILITY MATRIX
## 2026–2027 CKA EXAMINATION TARGET
**Document Version:** 2.0  
**Baseline Exam Target:** Kubernetes v1.31.x / v1.32.x  
**Forward Compatibility Target:** Kubernetes v1.33.x  
**Historical Baseline Evaluated:** v1.28–v1.30

---

## 1. CORE API RESOURCE COMPATIBILITY

| Resource Kind | API Group / Version | Status in v1.31/v1.32 | Compatibility Notes & Deprecations |
| :--- | :--- | :--- | :--- |
| **Pod, Service, ConfigMap, Secret** | `v1` | Stable (GA) | Unchanged core primitives. |
| **Deployment, ReplicaSet, DaemonSet, StatefulSet** | `apps/v1` | Stable (GA) | `apps/v1beta1`, `extensions/v1beta1` permanently removed. |
| **Job, CronJob** | `batch/v1` | Stable (GA) | `batch/v1beta1` removed. `batch/v1` is standard. |
| **Ingress, IngressClass** | `networking.k8s.io/v1` | Stable (GA) | `extensions/v1beta1` removed. PathType (`Prefix`, `Exact`) required. |
| **GatewayClass, Gateway, HTTPRoute** | `gateway.networking.k8s.io/v1` | Stable (GA) | Gateway API v1.1/v1.2 standard. Supported via CRD installs. |
| **NetworkPolicy** | `networking.k8s.io/v1` | Stable (GA) | Supports Ingress and Egress rules. |
| **PersistentVolume, PersistentVolumeClaim** | `v1` | Stable (GA) | Access modes include `ReadWriteOncePod` (GA). |
| **StorageClass** | `storage.k8s.io/v1` | Stable (GA) | Dynamic provisioning standard. |
| **Role, ClusterRole, RoleBinding, ClusterRoleBinding** | `rbac.authorization.k8s.io/v1` | Stable (GA) | `rbac.authorization.k8s.io/v1beta1` permanently removed. |
| **HorizontalPodAutoscaler** | `autoscaling/v2` | Stable (GA) | `autoscaling/v2beta1` and `v2beta2` removed. |
| **PodDisruptionBudget** | `policy/v1` | Stable (GA) | `policy/v1beta1` removed. |
| **CustomResourceDefinition** | `apiextensions.k8s.io/v1` | Stable (GA) | `apiextensions.k8s.io/v1beta1` removed. Schema validation required. |

---

## 2. CLI TOOLS & RUNTIME COMPATIBILITY MATRIX

| Tool / Component | Recommended Version | CKA Minimum Version | Critical Operational Flags |
| :--- | :--- | :--- | :--- |
| **kubectl** | `v1.31.2` or `v1.32.0` | `v1.31.0` | `--record` flag removed; use annotations for change-cause. Kustomize built into `kubectl -k`. |
| **kubeadm** | `v1.31.2` or `v1.32.0` | `v1.31.0` | Config API version `kubeadm.k8s.io/v1beta3` / `v1beta4`. Flag `--upload-certs` standard for HA. |
| **containerd** | `v1.7.20` or `v2.0.x` | `v1.6.0` | `SystemdCgroup = true` mandatory in `/etc/containerd/config.toml`. CRI socket at `/run/containerd/containerd.sock`. |
| **crictl** | `v1.31.0` | `v1.30.0` | Runtime endpoint set via `/etc/crictl.yaml`. |
| **etcdctl** | `v3.5.15+` | `v3.5.0` | `ETCDCTL_API=3` required. Endpoints: `https://127.0.0.1:2379`. |
| **Helm** | `v3.15.x` or `v3.16.x` | `v3.14.0` | Helm 3 is standard (no Tiller). |
| **Kind** | `v0.24.0+` | `v0.22.0` | Used for companion lab reproduction with Kubernetes v1.31/v1.32 node images. |

---

## 3. COMMAND-LINE DEPRECATION REPLACEMENT GUIDE

```bash
# ❌ DEPRECATED / REMOVED COMMAND (DO NOT USE):
kubectl set image deployment/frontend nginx=nginx:1.27 --record

# ✅ SUPPORTED, PRODUCTION-COMPATIBLE COMMAND (v1.31+):
kubectl set image deployment/frontend nginx=nginx:1.27
kubectl annotate deployment/frontend kubernetes.io/change-cause="Updated image to nginx:1.27" --overwrite

# ❌ DEPRECATED KUBEADM FLAG:
kubeadm init --experimental-upload-certs

# ✅ MODERN KUBEADM SYNTAX:
kubeadm init --upload-certs --control-plane-endpoint "loadbalancer:6443"

# ❌ OBSOLETE CRONJOB API:
apiVersion: batch/v1beta1
kind: CronJob

# ✅ MODERN CRONJOB MANIFEST:
apiVersion: batch/v1
kind: CronJob
```
