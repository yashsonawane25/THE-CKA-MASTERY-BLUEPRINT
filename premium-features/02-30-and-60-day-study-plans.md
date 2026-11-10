# 30-DAY AND 60-DAY STRUCTURED CKA STUDY PLANS
## SYSTEMATIC PREPARATION BLUEPRINTS BY LEARNER PROFILE

---

## 1. TRACK OVERVIEW & METHODOLOGY
Passing the CKA on the first attempt requires consistent daily hands-on muscle memory rather than passive reading. Select the track that matches your baseline assessment score:

* **Track A: 60-Day Comprehensive Track** (Recommended for beginners and sysadmins new to containers).
* **Track B: 30-Day Accelerated Track** (Recommended for working DevOps and cloud engineers with Docker/Kubernetes exposure).

---

## 2. TRACK A: THE 60-DAY COMPREHENSIVE BLUEPRINT
*Time Commitment:* 1.5 to 2 hours per day (Total: ~100 hours).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEEKS 1–2: Linux Foundations, Containers & Architecture (Vols I & III)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Day 01: Vol I Ch 01–02: Linux Namespaces, Cgroups, Containerd & CRI         │
│ Day 02: Vol I Ch 03–04: Control Plane vs. Worker Nodes & Static Pods        │
│ Day 03: Vol I Ch 05–06: API Groups, OpenAPI Schema & Declarative YAML       │
│ Day 04: Vol I Ch 07: Imperative kubectl Generators & Speed Aliases          │
│ Day 05: Vol I Ch 08: Linux Networking, veth Pairs, CNI Bridges              │
│ Day 06: Vol II Labs 01–05: Shell productivity and basic pod generation      │
│ Day 07: Weekly Review: Flashcard Deck 1 (Core Architecture & kubectl)       │
│ Day 08: Vol I Ch 09–11: Kubeadm Architecture & containerd SystemdCgroup     │
│ Day 09: Vol I Ch 12–14: Initializing Clusters & Joining Worker Nodes        │
│ Day 10: Vol II Labs 01–05 (Execution in Kind / Local VM)                    │
│ Day 11: Vol I Ch 15: RBAC Roles, ClusterRoles, RoleBindings                 │
│ Day 12: Vol I Ch 16: ServiceAccounts & Projected Tokens                     │
│ Day 13: Vol II Labs 01–03: Multi-Namespace RBAC Mastery                     │
│ Day 14: Weekly Review: Mock Exam 1 Diagnostic Run (Untimed)                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WEEKS 3–4: Workloads, Scheduling & Storage (Vols I & II)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Day 15: Vol I Ch 24–25: Pod Lifecycle, Init Containers & Sidecars           │
│ Day 16: Vol I Ch 26: Deployments, ReplicaSets & Rolling Update Math         │
│ Day 17: Vol I Ch 27–28: DaemonSets, StatefulSets, Jobs & CronJobs           │
│ Day 18: Vol I Ch 29: ConfigMaps, Secrets, Projected Volumes                 │
│ Day 19: Vol II Labs 16–23: Workload Deployment Drills                       │
│ Day 20: Vol I Ch 30: CPU/Mem Requests, Limits & CFS Quotas                  │
│ Day 21: Weekly Review: Flashcard Deck 2 (Workloads & Scheduling)            │
│ Day 22: Vol I Ch 31: Liveness, Readiness & Startup Probes                   │
│ Day 23: Vol I Ch 32–35: NodeAffinity, Taints, Tolerations, PodAntiAffinity  │
│ Day 24: Vol I Ch 36–38: PriorityClasses, Preemption, HPA & ResourceQuotas   │
│ Day 25: Vol II Labs 24–30: Advanced Scheduling Scenarios                    │
│ Day 26: Vol I Ch 50–54: PV, PVC, StorageClasses & Access Modes              │
│ Day 27: Vol I Ch 55–59: Dynamic Provisioning, CSI & ReadWriteOncePod        │
│ Day 28: Vol II Labs 46–52: Complete Storage Domain Workbook                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WEEKS 5–6: Services, Networking, Ingress & Gateway API                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Day 29: Vol I Ch 39–41: Pod-to-Pod Packet Flows, VXLAN & CNI Architecture   │
│ Day 30: Vol I Ch 42–43: ClusterIP, NodePort, LoadBalancer & kube-proxy      │
│ Day 31: Vol I Ch 44–45: CoreDNS Resolution & EndpointSlices                 │
│ Day 32: Vol II Labs 31–35: Core Services and DNS Diagnostics                │
│ Day 33: Vol I Ch 46: Ingress Controllers & Ingress Rules                    │
│ Day 34: Vol I Ch 47: Gateway API (GatewayClass, Gateway, HTTPRoute)         │
│ Day 35: Weekly Review: Flashcard Deck 3 (Services & Networking)             │
│ Day 36: Vol I Ch 48: Fine-Grained NetworkPolicies (Default Deny, Whitelist) │
│ Day 37: Vol II Labs 36–40: Ingress & Gateway API Hands-on                   │
│ Day 38: Vol II Labs 41–45: NetworkPolicy Engineering Drills                 │
│ Day 39: Vol I Ch 21: etcd Raft Quorum & 7-Step Snapshot Restore             │
│ Day 40: Vol II Labs 06–07: etcd Backup and Disaster Recovery Restore        │
│ Day 41: Vol I Ch 17–18: Cluster Upgrades & Safe Node Drains                 │
│ Day 42: Vol II Labs 04–05: Kubeadm Control Plane and Worker Node Upgrades   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WEEKS 7–8: Troubleshooting Mastery, Mock Exams & Exam Simulation            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Day 43: Vol I Ch 60–63: Hierarchical Triage, Pod & Node Failure Recovery    │
│ Day 44: Vol I Ch 64–66: Kubelet Systemd & containerd Socket Troubleshooting │
│ Day 45: Vol I Ch 67–68: Control Plane Crash & etcd Outage Resolution        │
│ Day 46: Vol I Ch 69–72: DNS Loops, Broken NetworkPolicies, Chaos Drills     │
│ Day 47: Vol II Labs 53–60: Infrastructure Troubleshooting Labs              │
│ Day 48: Vol II Labs 61–67: Advanced Multi-Tier Failure Recovery             │
│ Day 49: Weekly Review: Vol III Visual Atlas Troubleshooting Flowcharts      │
│ Day 50: Vol V Mock Exam 1: Timed Simulation (Goal: >80% in 100 min)         │
│ Day 51: Review Mock Exam 1 Scorecard & Log Weaknesses in Mistake Journal    │
│ Day 52: Vol V Mock Exam 2: Timed Simulation (Goal: >80% in 100 min)         │
│ Day 53: Review Mock Exam 2 Scorecard & Retest Failed Tasks                  │
│ Day 54: Vol V Mock Exam 3: Advanced Troubleshooting Simulation              │
│ Day 55: Review Mock Exam 3 Scorecard & Practice Static Pod Recovery         │
│ Day 56: Vol V Mock Exam 4: Full Proctored Certification Simulation          │
│ Day 57: Final Speed Drills (Volume I Chapter 79)                            │
│ Day 58: Review Volume IV Field Guide & Master Cheatsheets                   │
│ Day 59: Rest Day & Environment Pre-Check                                    │
│ Day 60: OFFICIAL CKA EXAM DAY                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TRACK B: THE 30-DAY ACCELERATED SPRINT
*Time Commitment:* 2.5 to 3 hours per day (Total: ~80 hours). Recommended for active Kubernetes operators.

* **Week 1 (Days 1–7): Core Architecture & Workload Velocity**
  * Focus: Master Volume IV imperative generators, RBAC (`kubectl auth can-i`), rolling updates, and DaemonSet/StatefulSet configurations.
  * Deliverable: Complete Volume II Labs 01–25.
* **Week 2 (Days 8–14): Networking, Gateway API, Storage & Upgrades**
  * Focus: NetworkPolicies (default-deny, cross-namespace), Gateway API HTTPRoute multi-service canary splitting, `ReadWriteOncePod`, dynamic storage, kubeadm upgrades.
  * Deliverable: Complete Volume II Labs 26–52.
* **Week 3 (Days 15–21): 30% Troubleshooting Domain Deep Dive**
  * Focus: etcd snapshot backup/restore, crashed kube-apiserver static pods, broken kubelet cgroup drivers, CoreDNS loop detection.
  * Deliverable: Complete Volume II Labs 53–67.
* **Week 4 (Days 22–30): Proctored Mock Exam Marathon**
  * Day 22: Mock Exam 1 (Timed).
  * Day 24: Mock Exam 2 (Timed).
  * Day 26: Mock Exam 3 (Advanced Troubleshooting).
  * Day 28: Mock Exam 4 (Full Certification Simulation).
  * Day 29: Final Speed Drills & PSI UI review.
  * Day 30: CKA Examination.
