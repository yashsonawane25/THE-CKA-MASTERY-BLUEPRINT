# HANDS-ON LAB PROGRESS & MASTERY TRACKER
## AUDITABLE LOG FOR ALL 67 PRACTICAL WORKBOOK LABS

---

## 1. HOW TO USE THIS TRACKER
Track every lab attempt systematically. A lab is considered **Mastered** only when executed in **under 8 minutes without looking at the solution section** and passing all automated verification checks.

* **Status Codes:** `NS` (Not Started), `IP` (In Progress), `REV` (Needs Revision), `PASS` (Completed with hints), `MASTER` (Completed timed with 0 hints).

---

## 2. DOMAIN 1: CLUSTER ARCHITECTURE, INSTALLATION & CONFIGURATION (LABS 01–15)

| Lab ID | Lab Title | Target Time | Attempt 1 Date | Time Taken | Hints Used | Status | Notes / Errors Encountered |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAB 01** | Multi-Namespace RBAC Role & Binding | 6 min | | | | NS | |
| **LAB 02** | Cluster-Wide Privilege with ClusterRoles | 6 min | | | | NS | |
| **LAB 03** | Worker Node Maintenance (Cordon & Drain) | 5 min | | | | NS | |
| **LAB 04** | Control Plane Version Upgrade with kubeadm | 8 min | | | | NS | |
| **LAB 05** | Worker Node Upgrade with kubeadm | 6 min | | | | NS | |
| **LAB 06** | etcd Snapshot Backup with mTLS | 5 min | | | | NS | |
| **LAB 07** | etcd Disaster Recovery Snapshot Restore | 7 min | | | | NS | |
| **LAB 08** | Deploying Applications via Helm | 5 min | | | | NS | |
| **LAB 09** | Multi-Environment Overlays with Kustomize | 6 min | | | | NS | |
| **LAB 10** | Custom Resource Definition (CRD) Triage | 5 min | | | | NS | |
| **LAB 11** | ServiceAccount Projected Token Rotation | 5 min | | | | NS | |
| **LAB 12** | Certificate Expiration & kubeadm renew | 6 min | | | | NS | |
| **LAB 13** | HA Control Plane Quorum Calculation | 4 min | | | | NS | |
| **LAB 14** | Containerd Socket & Cgroup Alignment | 6 min | | | | NS | |
| **LAB 15** | Static Pod Provisioning on Worker Node | 5 min | | | | NS | |

---

## 3. DOMAIN 2: WORKLOADS & SCHEDULING (LABS 16–30)

| Lab ID | Lab Title | Target Time | Attempt 1 Date | Time Taken | Hints Used | Status | Notes / Errors Encountered |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAB 16** | Zero-Downtime Rolling Update & Rollback | 5 min | | | | NS | |
| **LAB 17** | StatefulSet Sequential Scaling & Headless | 7 min | | | | NS | |
| **LAB 18** | DaemonSet Node Scheduling & Tolerations | 5 min | | | | NS | |
| **LAB 19** | Batch Jobs with Parallelism & Completions | 5 min | | | | NS | |
| **LAB 20** | CronJob Concurrency Policy Enforcement | 5 min | | | | NS | |
| **LAB 21** | Native Sidecar Container Pattern | 6 min | | | | NS | |
| **LAB 22** | ConfigMap Volume Mounts & Atomic Updates | 5 min | | | | NS | |
| **LAB 23** | Secret Management & Env Injection | 5 min | | | | NS | |
| **LAB 24** | Pod Quality of Service (QoS) Tuning | 4 min | | | | NS | |
| **LAB 25** | Health Checks (Startup, Readiness, Liveness)| 6 min | | | | NS | |
| **LAB 26** | Node Affinity (Required vs Preferred) | 5 min | | | | NS | |
| **LAB 27** | Taints, Tolerations & Node Eviction | 5 min | | | | NS | |
| **LAB 28** | Pod Anti-Affinity Across Topology | 6 min | | | | NS | |
| **LAB 29** | Horizontal Pod Autoscaler (HPA) Tuning | 6 min | | | | NS | |
| **LAB 30** | ResourceQuotas & LimitRanges | 6 min | | | | NS | |

---

## 4. DOMAIN 3: SERVICES & NETWORKING (LABS 31–45)

| Lab ID | Lab Title | Target Time | Attempt 1 Date | Time Taken | Hints Used | Status | Notes / Errors Encountered |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAB 31** | ClusterIP Creation & Endpoints Check | 4 min | | | | NS | |
| **LAB 32** | NodePort Service on Static Port Range | 5 min | | | | NS | |
| **LAB 33** | Headless Service Peer DNS Resolution | 5 min | | | | NS | |
| **LAB 34** | EndpointSlice Inspection & Custom IP | 5 min | | | | NS | |
| **LAB 35** | CoreDNS Custom Forwarding ConfigMap | 6 min | | | | NS | |
| **LAB 36** | Ingress Path-Based Routing Rules | 6 min | | | | NS | |
| **LAB 37** | Ingress TLS Secret Termination | 5 min | | | | NS | |
| **LAB 38** | Gateway API GatewayClass & Gateway Setup | 6 min | | | | NS | |
| **LAB 39** | HTTPRoute Weighted Traffic Canary Split | 6 min | | | | NS | |
| **LAB 40** | HTTPRoute Cross-Namespace ReferenceGrant| 7 min | | | | NS | |
| **LAB 41** | Default-Deny All Ingress NetworkPolicy | 4 min | | | | NS | |
| **LAB 42** | Pod & Namespace Selector Whitelisting | 6 min | | | | NS | |
| **LAB 43** | Egress NetworkPolicy with DNS Allow | 6 min | | | | NS | |
| **LAB 44** | External CIDR Ingress Filtering (ipBlock)| 5 min | | | | NS | |
| **LAB 45** | Live Packet Tracing with Ephemeral Pods | 5 min | | | | NS | |

---

## 5. DOMAIN 4: STORAGE (LABS 46–52)

| Lab ID | Lab Title | Target Time | Attempt 1 Date | Time Taken | Hints Used | Status | Notes / Errors Encountered |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAB 46** | Static PV and PVC 1-to-1 Binding | 5 min | | | | NS | |
| **LAB 47** | Dynamic StorageClass Provisioning | 5 min | | | | NS | |
| **LAB 48** | Delayed Volume Binding (WaitForFirstConsumer)| 5 min | | | | NS | |
| **LAB 49** | Reclaim Policy (Retain vs Delete) | 5 min | | | | NS | |
| **LAB 50** | Single-Pod Data Lock with ReadWriteOncePod| 5 min | | | | NS | |
| **LAB 51** | Dynamic PVC Online Volume Expansion | 5 min | | | | NS | |
| **LAB 52** | Multi-Pod Shared Storage (ReadWriteMany)| 6 min | | | | NS | |

---

## 6. DOMAIN 5: TROUBLESHOOTING (LABS 53–67)

| Lab ID | Lab Title | Target Time | Attempt 1 Date | Time Taken | Hints Used | Status | Notes / Errors Encountered |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAB 53** | CSI Driver & VolumeAttachment Triage | 6 min | | | | NS | |
| **LAB 54** | Pod Stuck in Pending (Resource/Taints) | 5 min | | | | NS | |
| **LAB 55** | Diagnosing & Fixing CrashLoopBackOff | 5 min | | | | NS | |
| **LAB 56** | ImagePullBackOff & Registry Credentials | 5 min | | | | NS | |
| **LAB 57** | OOMKilled (Exit Code 137) Recovery | 4 min | | | | NS | |
| **LAB 58** | Triage & Recovery of NotReady Worker Node| 6 min | | | | NS | |
| **LAB 59** | Broken Kubelet Cgroup Driver Alignment | 5 min | | | | NS | |
| **LAB 60** | Broken Control Plane Static Pod Repair | 6 min | | | | NS | |
| **LAB 61** | Expired Cluster PKI Certificate Recovery| 6 min | | | | NS | |
| **LAB 62** | CoreDNS Loop Crash Recovery | 5 min | | | | NS | |
| **LAB 63** | Network Service Missing Endpoints Fix | 5 min | | | | NS | |
| **LAB 64** | Broken Cross-Namespace NetworkPolicy | 6 min | | | | NS | |
| **LAB 65** | etcd Quorum Loss & Database Alarm Clear | 7 min | | | | NS | |
| **LAB 66** | Integrated Multi-Failure Grand Challenge| 15 min | | | | NS | |
| **LAB 67** | Advanced Chaos Recovery: Cross-NS Gateway| 12 min | | | | NS | |
