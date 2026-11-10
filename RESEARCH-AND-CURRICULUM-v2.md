# OFFICIAL CKA CURRICULUM, ENVIRONMENT & VERSION RESEARCH REPORT
## VERSION 2.0 VERIFIED BASELINE (2026–2027)
**Research Date:** November 9, 2026  
**Authoritative Sources:**
1. Linux Foundation CKA Certification: `https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/`
2. CNCF Curriculum Repository: `https://github.com/cncf/curriculum/tree/master/cka`
3. Linux Foundation Candidate Documentation: `https://docs.linuxfoundation.org/tc-docs/certification/`
4. Kubernetes Official Documentation: `https://kubernetes.io/docs/`
5. Gateway API SIG Documentation: `https://gateway-api.sigs.k8s.io/`

---

## 1. OFFICIAL EXAMINATION ENVIRONMENT SPECIFICATION

| Parameter | Official Specification | Candidate Implications |
| :--- | :--- | :--- |
| **Duration** | 120 Minutes (2.0 Hours) | 15–20 practical performance tasks (~6–8 minutes per task). Speed and imperative mastery are non-negotiable. |
| **Passing Score** | 66% | Scoring is weighted by question complexity (typically 3% to 8% per task). Partial credit is awarded. |
| **Delivery Engine** | PSI Secure Browser with Remote Desktop | Runs in a sandboxed, low-latency remote Linux desktop (Ubuntu 22.04 LTS / XFCE). |
| **Permitted Resources** | 1 Browser Tab inside remote desktop to: `https://kubernetes.io/docs/`, `https://kubernetes.io/blog/`, `https://helm.sh/docs/` | No external bookmarks, search engines, or copy-pasting from local host machine. Candidates must know exact documentation search terms. |
| **CLI Shell Tools** | `bash`, `tmux`, `curl`, `jq`, `vim`, `nano`, `systemctl`, `journalctl`, `crictl`, `etcdctl` | Strict terminal proficiency required. No IDE extensions or auto-completion plugins beyond standard bash completion. |
| **Kubernetes Version** | Current active release: **v1.31 / v1.32** (Forward compatible through **v1.33**) | Exam clusters follow the latest stable releases (updated ~4–8 weeks after GA). Book version v2.0 targets v1.31.x / v1.32.x with explicit v1.33 notes. |

---

## 2. OFFICIAL DOMAIN BREAKDOWN & WEIGHTINGS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CKA DOMAIN WEIGHTING BREAKDOWN                        │
└─────────────────────────────────────────────────────────────────────────────┘
  1. Troubleshooting (30%)
     ├── Cluster & Node Failures (kubelet, systemd, containerd)
     ├── Control Plane Component Outages (apiserver, etcd, scheduler, cm)
     ├── Network & Service Outages (CNI, CoreDNS, iptables/IPVS)
     └── Resource Exhaustion (OOM, DiskPressure, CPU throttling)
  
  2. Cluster Architecture, Installation & Configuration (25%)
     ├── Role-Based Access Control (RBAC) & ServiceAccounts
     ├── kubeadm Cluster Initialization & Worker Node Joins
     ├── Highly Available (HA) Control Plane Topologies
     ├── Orderly Version Upgrades & Safe Node Drains
     ├── Helm & Kustomize Application Packaging
     ├── Extension Interfaces (CNI, CSI, CRI) & Custom Resource Definitions (CRDs)
     └── etcd Architecture, Snapshot Backup & Full Disaster Recovery Restore
  
  3. Services & Networking (20%)
     ├── Pod-to-Pod Communication & CNI Mechanics
     ├── ClusterIP, NodePort, LoadBalancer & EndpointSlices
     ├── Modern Traffic Management: Gateway API (GatewayClass, Gateway, HTTPRoute)
     ├── Traditional Ingress Controllers & Ingress Rules
     ├── Network Policies (Ingress/Egress, Namespace/Pod Selectors)
     └── CoreDNS Customization & Name Resolution
  
  4. Workloads & Scheduling (15%)
     ├── Deployments, ReplicaSets, DaemonSets, StatefulSets, Jobs, CronJobs
     ├── Rolling Updates, Rollouts, Instant Rollbacks
     ├── ConfigMaps, Secrets & Downward API
     ├── Pod Scheduling (nodeSelector, nodeAffinity, podAffinity, taints/tolerations)
     ├── Resource Limits, Requests, LimitRanges, ResourceQuotas, PriorityClasses
     └── Horizontal Pod Autoscaler (HPA)
  
  5. Storage (10%)
     ├── PersistentVolumes (PV), PersistentVolumeClaims (PVC), StorageClasses
     ├── Dynamic vs. Static Provisioning
     ├── Access Modes (ReadWriteOnce, ReadOnlyMany, ReadWriteMany, ReadWriteOncePod)
     └── CSI Architecture & Volume Expansion
```

---

## 3. CURRICULUM EVOLUTION & RECENT OBJECTIVE UPDATES

### Recent Additions Tested in 2026/2027:
1. **Gateway API:** Formal inclusion alongside Ingress. Candidates must understand the decoupling of infrastructure roles (`GatewayClass` for infra provider, `Gateway` for cluster admin, `HTTPRoute` for application developer).
2. **Kustomize Integration:** In-tree `kubectl apply -k` overlays, base configurations, patches, and secret generators.
3. **Helm Operations:** Imperative chart installations (`helm install`, `upgrade`, `rollback`), values overrides (`--set`, `-f`), and local repository management.
4. **CRDs & Operators:** Candidates are expected to deploy and inspect Custom Resources and diagnose operator reconcilers.
5. **ReadWriteOncePod (RWOP):** Storage access mode restricting volume access to a single pod in the entire cluster (GA in modern Kubernetes).
6. **Container Runtime Standard:** `containerd` via CRI is universal; `dockershim` is completely eradicated. Troubleshooting requires `crictl` configured against `/run/containerd/containerd.sock`.

### Deprecated & Retired Items (Strictly Prohibited in v2.0):
- `kubectl ... --record` (Completely removed).
- `extensions/v1beta1`, `networking.k8s.io/v1beta1`, `batch/v1beta1` (Removed).
- `policy/v1beta1 PodSecurityPolicy` (Removed; replaced by built-in Pod Security Standards / Admission).
- `client.authentication.k8s.io/v1alpha1` (Deprecated; use `v1` or `v1beta1`).

---

## 4. MULTI-CLUSTER CONTEXT SIMULATION

The official exam utilizes **5 to 8 independent Kubernetes clusters** accessed via `kubectl config use-context <context-name>`. Each task clearly specifies the target context.

In Version 2.0, all lab exercises and mock exams mandate explicit context switching:
- `k8s`: Primary 3-node cluster (1 control plane, 2 workers) for administration and workloads.
- `infra-cluster`: 2-node cluster for kubeadm upgrades and node maintenance.
- `ha-cluster`: Multi-control-plane cluster for etcd backup, restore, and high availability.
- `edge-net`: Dedicated cluster for advanced Gateway API and NetworkPolicy security isolation.
