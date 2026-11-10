# THE KUBERNETES ADMINISTRATOR INTERVIEW GUIDE
## BRIDGING CKA CERTIFICATION TO SENIOR DEVOPS & SRE JOB INTERVIEWS

---

## 1. CKA OBJECTIVES VS. REAL-WORLD PRODUCTION INTERVIEW TOPICS

| Topic Dimension | CKA Examination Focus | Real-World SRE / DevOps Job Interview Focus |
| :--- | :--- | :--- |
| **Cluster Setup** | Manual single-node `kubeadm init`, join commands | Terraform, GitOps (ArgoCD/Flux), AWS EKS / GCP GKE managed control planes, Cluster API |
| **Configuration** | Raw YAML manifests, imperative `kubectl` generators | Helm charts, Kustomize multi-env pipelines, SOPS / Vault secret management |
| **Networking** | Basic CNI install, Calico NetworkPolicy, Gateway API HTTPRoute | Service mesh (Istio/Linkerd) mTLS, BGP routing, global ingress load balancers, MTU optimization |
| **Storage** | PV/PVC binding, `ReadWriteOncePod`, local hostPath | CSI snapshot lifecycles, cross-region replication, Ceph/Rook, backup DR with Velero |
| **Observability** | `kubectl top`, `journalctl -u kubelet`, `crictl logs` | Prometheus operator, Grafana dashboards, OpenTelemetry distributed tracing, VictoriaMetrics |
| **Security** | Basic RBAC Roles/Bindings, ServiceAccount tokens | Kyverno/OPA Gatekeeper admission policies, Falco runtime anomaly detection, CIS benchmarks |

---

## 2. TOP 10 PRODUCTION INTERVIEW QUESTIONS & ARCHITECTURAL ANSWERS

### Q1: "Walk me through what happens when an engineer runs `kubectl apply -f deployment.yaml` until the pod is serving traffic."
**Expected Senior Answer:**
1. **Client & API Layer:** `kubectl` performs client-side validation, sends an HTTPS POST/PUT to `kube-apiserver`.
2. **Authentication & Authorization:** The API server authenticates the client certificate/token, then checks RBAC rules via the Authorizer.
3. **Admission Controllers:** Mutating admission webhooks run (injecting defaults, sidecars), followed by OpenAPI schema validation and validating admission webhooks.
4. **etcd Write:** The Deployment object is serialized and committed to `etcd` via Raft consensus.
5. **Deployment Controller:** The Deployment Controller detects the new object via watch streams, computes the replica diff, and creates a `ReplicaSet`.
6. **ReplicaSet Controller:** Detects the ReplicaSet and creates unassigned Pod specifications (with `spec.nodeName: ""`).
7. **kube-scheduler:** Scheduler filter plugins evaluate node capacity, taints, and affinity. Scoring plugins rank passing nodes; scheduler writes a `/binding` subresource assigning the Pod to a node.
8. **Kubelet SyncLoop:** The kubelet on the target node receives the pod assignment via watch stream.
9. **CRI Runtime Call:** Kubelet calls `containerd` via CRI gRPC. Containerd requests `runc` to configure Linux namespaces (PID, net, mnt) and cgroups.
10. **CNI Network Setup:** The CNI plugin creates a `veth` pair, connects one end to the container netns, joins the other to the node bridge/overlay, and allocates a Pod IP from IPAM.
11. **Storage Mounts:** VolumeManager calls CSI plugins to attach and mount required volumes.
12. **Container Launch & Probes:** The application container starts. Kubelet runs startup and readiness probes.
13. **Endpoint Injection:** The EndpointSlice controller detects the ready pod, adds its IP to the Service EndpointSlice, and `kube-proxy` programs local `iptables`/IPVS rules. Traffic flows!

---

### Q2: "A production node suddenly transitions to `NotReady`. How do you triage it under a high-severity outage without causing further downtime?"
**Expected Senior Answer:**
1. **Assess Impact & PDBs:** First check `kubectl get pods -o wide --field-selector spec.nodeName=<node>` to see which workloads are affected. Verify PodDisruptionBudgets so emergency evictions don't breach SLAs.
2. **Examine Conditions:** `kubectl describe node <node>`. Check `DiskPressure`, `MemoryPressure`, `PIDPressure`.
3. **SSH Triage:**
   * Run `systemctl is-active kubelet` and `systemctl is-active containerd`.
   * Check kernel dmesg: `dmesg -T | grep -E "oom|killed|error"`.
   * Check journal logs: `journalctl -u kubelet -n 100 --no-pager`.
4. **Network Verification:** Test if the node can reach the API server: `curl -k https://<cp-ip>:6443/healthz`.
5. **Safe Resolution:**
   * If swap was accidentally turned on after reboot: `swapoff -a && systemctl restart kubelet`.
   * If disk full: run `crictl rmi --prune` and clear dead container logs under `/var/log/pods/`.
   * If hardware failure: run `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data` to reschedule pods gracefully onto healthy nodes, then terminate the VM.

---

### Q3: "What are the mechanical differences between `iptables` mode and `IPVS` mode in `kube-proxy`, and when would you switch?"
**Expected Senior Answer:**
* **iptables:** Operates as a flat, sequential list of packet filter rules. Every service and endpoint adds multiple chains (`KUBE-SERVICES`, `KUBE-SVC-XXX`, `KUBE-SEP-XXX`). Rule evaluation complexity is $O(N)$. In clusters with >5,000 services, sequential rule processing causes noticeable latency, and iptables sync loops consume significant kernel CPU.
* **IPVS (IP Virtual Server):** Implements transport-layer load balancing inside the Linux kernel using hash tables with $O(1)$ lookup complexity. It supports multiple scheduling algorithms (Round Robin, Least Connection, Destination/Source Hashing).
* **When to switch:** Switch to IPVS in clusters scaling beyond 1,000 services or when connection rebalancing (e.g., distributing high-throughput microservices) is required.

---

### Q4: "How does the Raft consensus algorithm work in etcd, and why does an etcd cluster always require an odd number of members?"
**Expected Senior Answer:**
* etcd uses Raft to maintain a replicated, consistent state machine across distributed nodes.
* Operations require a strict quorum: $\lfloor N/2 \rfloor + 1$ active members.
* **Why odd numbers:**
  * A 3-node cluster requires 2 votes for quorum; it tolerates 1 failure ($3 - 2 = 1$).
  * A 4-node cluster requires 3 votes for quorum; it *still* only tolerates 1 failure ($4 - 3 = 1$). Adding a 4th node increases network replication overhead without increasing fault tolerance!
  * A 5-node cluster requires 3 votes for quorum; it tolerates 2 failures ($5 - 3 = 2$).
  * Therefore, odd numbers ($3, 5$) maximize fault tolerance per node cost and avoid split-brain split votes during leader election.

---

### Q5: "How does Kubernetes enforce CPU limits vs. Memory limits at the Linux kernel level?"
**Expected Senior Answer:**
* **CPU Limits:** Enforced via the Linux kernel **Completely Fair Scheduler (CFS) bandwidth control** (`cpu.cfs_quota_us` and `cpu.cfs_period_us`). If a container exceeds its quota within a 100ms period, the kernel throttles its execution cycles. The process is paused until the next CFS period; it is **never killed**.
* **Memory Limits:** Enforced via **memory cgroup ceilings** (`memory.max` in cgroups v2). When a container process allocates memory exceeding the limit and the host cannot reclaim cached pages, the Linux kernel invokes the **Out-Of-Memory (OOM) Killer**, terminating the process immediately with SIGKILL (Exit Code 137).
