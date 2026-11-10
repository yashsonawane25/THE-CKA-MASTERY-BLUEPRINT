# CKA READINESS ASSESSMENT & DIAGNOSTIC SYSTEM
## INITIAL KNOWLEDGE EVALUATION & PERSONALIZED STUDY ROADMAP

---

## 1. ASSESSMENT OBJECTIVE & METHODOLOGY
Before embarking on your CKA preparation journey, taking this 25-question diagnostic assessment establishes your baseline across the 5 official CKA domains.

* **Format:** Multiple-choice scenario questions with single best answer.
* **Scoring:** 4 points per correct answer (Total: 100 points).
* **Passing Benchmark:** 70 points indicates intermediate readiness; below 50 points recommends starting with the 60-Day Beginner Track.

---

## 2. DIAGNOSTIC ASSESSMENT QUESTIONS

### DOMAIN 1: CLUSTER ARCHITECTURE, INSTALLATION & CONFIGURATION (25%)
**Q1.** When executing `kubeadm init`, which flag is mandatory to allow other control plane nodes to securely join an HA cluster?
- [ ] A. `--experimental-upload-certs`
- [ ] B. `--upload-certs`
- [ ] C. `--ha-enable`
- [ ] D. `--control-plane-sync`

**Q2.** An etcd cluster consists of 5 members. How many simultaneous member failures can this cluster tolerate while maintaining full write availability?
- [ ] A. 1
- [ ] B. 2
- [ ] C. 3
- [ ] D. 4

**Q3.** You need to safely upgrade a worker node from v1.31.0 to v1.31.2. Which command must be executed on the control plane *before* upgrading packages on the worker node?
- [ ] A. `kubectl cordon <node>`
- [ ] B. `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data`
- [ ] C. `kubectl delete node <node>`
- [ ] D. `kubeadm upgrade node`

**Q4.** A ServiceAccount named `deployer` in namespace `qa` needs to create deployments in namespace `staging`. Which RBAC resource must be created?
- [ ] A. `Role` in `qa` and `RoleBinding` in `qa`.
- [ ] B. `ClusterRole` and `ClusterRoleBinding`.
- [ ] C. `Role` in `staging` and `RoleBinding` in `staging` referencing `qa:deployer` in subjects.
- [ ] D. `Role` in `staging` and `RoleBinding` in `qa`.

**Q5.** Which command is used to renew control plane certificates created by kubeadm?
- [ ] A. `kubeadm alpha certs renew`
- [ ] B. `kubeadm certs renew all`
- [ ] C. `kubectl cert-manager renew`
- [ ] D. `openssl req -renew`

---

### DOMAIN 2: WORKLOADS & SCHEDULING (15%)
**Q6.** A Deployment rollout of `app-v2` is failing due to CrashLoopBackOff. Which command reverts the deployment to revision 1 without editing YAML?
- [ ] A. `kubectl rollout undo deployment app --to-revision=1`
- [ ] B. `kubectl rollback deployment app -v 1`
- [ ] C. `kubectl set image deployment app app=app:v1`
- [ ] D. `kubectl revert deployment app 1`

**Q7.** A container in a Pod is terminated with exit code `137`. What is the primary cause?
- [ ] A. Application segmentation fault.
- [ ] B. Memory consumption exceeded `resources.limits.memory` (OOMKilled).
- [ ] C. Liveness probe failed 3 consecutive times.
- [ ] D. Missing ConfigMap environment variable.

**Q8.** You want to ensure that Pods of Deployment `api` are never co-located on the same physical host as another `api` Pod. Which feature must be declared?
- [ ] A. `nodeSelector`
- [ ] B. `podAntiAffinity` with `topologyKey: kubernetes.io/hostname`
- [ ] C. `topologySpreadConstraints` with `maxSkew: 0`
- [ ] D. `nodeAffinity` with `NotIn` operator

**Q9.** A batch Job has `completions: 5` and `parallelism: 2`. How many Pods run simultaneously?
- [ ] A. 1
- [ ] B. 2
- [ ] C. 5
- [ ] D. 10

---

### DOMAIN 3: SERVICES & NETWORKING (20%)
**Q10.** What is the fully qualified domain name (FQDN) for a Service named `auth-svc` located in namespace `security` using default cluster domain?
- [ ] A. `auth-svc.security.cluster.local`
- [ ] B. `auth-svc.security.svc.cluster.local`
- [ ] C. `auth-svc.svc.security.cluster`
- [ ] D. `security.auth-svc.k8s.local`

**Q11.** When using the Gateway API, which resource decouples infrastructure listeners (ports and TLS) from developer routing paths?
- [ ] A. `Ingress`
- [ ] B. `GatewayClass`
- [ ] C. `Gateway`
- [ ] D. `HTTPRoute`

**Q12.** An HTTPRoute in namespace `frontend` needs to bind to a Gateway in namespace `infra`. Which resource must exist in namespace `infra` to permit this cross-namespace attachment?
- [ ] A. `NetworkPolicy`
- [ ] B. `ReferenceGrant`
- [ ] C. `ClusterRoleBinding`
- [ ] D. `SecretExport`

**Q13.** A namespace has a NetworkPolicy with `podSelector: {}` and `policyTypes: [Ingress]`, but no `ingress:` rules defined. What is the effect?
- [ ] A. All ingress traffic is allowed.
- [ ] B. All ingress traffic to all pods in the namespace is denied (Default Deny).
- [ ] C. Traffic from the same namespace is allowed, external traffic is denied.
- [ ] D. DNS traffic is blocked.

**Q14.** In a NetworkPolicy `ingress.from` clause, what is the semantic difference between listing `namespaceSelector` and `podSelector` under a single list item versus two separate hyphens?
- [ ] A. Single item is OR; separate hyphens is AND.
- [ ] B. Single item is AND; separate hyphens is OR.
- [ ] C. Both syntaxes produce identical AND behavior.
- [ ] D. Separate hyphens are invalid syntax.

---

### DOMAIN 4: STORAGE (10%)
**Q15.** A StorageClass has `volumeBindingMode: WaitForFirstConsumer`. When is the PersistentVolume dynamically provisioned?
- [ ] A. Immediately when the PersistentVolumeClaim is created.
- [ ] B. When a Pod consuming the PVC is scheduled to a specific node.
- [ ] C. When the first container inside the Pod writes data.
- [ ] D. When the node reboots.

**Q16.** Which volume access mode guarantees that only a single Pod in the entire cluster can mount the volume read-write?
- [ ] A. `ReadWriteOnce` (RWO)
- [ ] B. `ReadOnlyMany` (ROX)
- [ ] C. `ReadWriteMany` (RWX)
- [ ] D. `ReadWriteOncePod` (RWOP)

**Q17.** A PersistentVolume has `persistentVolumeReclaimPolicy: Retain`. What happens when the bound PersistentVolumeClaim is deleted?
- [ ] A. The PV is immediately deleted and underlying cloud storage destroyed.
- [ ] B. The PV enters `Released` status; storage and data remain intact on disk.
- [ ] C. The PV enters `Available` status and binds to any new PVC.
- [ ] D. The PV is formatted with a fresh filesystem.

---

### DOMAIN 5: TROUBLESHOOTING (30%)
**Q18.** A worker node shows status `NotReady`. You SSH into the node and run `systemctl status kubelet`. The service is failed. What is the most effective command to view the crash stack trace?
- [ ] A. `kubectl logs kubelet`
- [ ] B. `journalctl -u kubelet -e --no-pager`
- [ ] C. `cat /var/log/syslog | grep error`
- [ ] D. `crictl logs kubelet`

**Q19.** `kubectl` commands return `The connection to the server <ip>:6443 was refused`. You SSH into the control plane host. How do you view logs of the crashed API server?
- [ ] A. `kubectl logs kube-apiserver -n kube-system`
- [ ] B. `systemctl status kube-apiserver`
- [ ] C. `crictl ps -a --name kube-apiserver` followed by `crictl logs <id>`
- [ ] D. `tail -f /var/log/messages`

**Q20.** You are executing an etcd snapshot restore on the control plane node. Where should the restored data directory be placed?
- [ ] A. Directly over `/var/lib/etcd` without flags.
- [ ] B. A brand new directory (e.g. `/var/lib/etcd-restored`) specified by `--data-dir`.
- [ ] C. Inside `/tmp/etcd/`
- [ ] D. Over `/etc/kubernetes/pki/`

**Q21.** After restoring etcd to `/var/lib/etcd-restored`, what must be updated so kubelet launches the restored database?
- [ ] A. `kubectl edit pod etcd -n kube-system`
- [ ] B. Modify the `hostPath.path` in `/etc/kubernetes/manifests/etcd.yaml`.
- [ ] C. `kubeadm init phase etcd`
- [ ] D. Restart containerd.

**Q22.** Workload Pods cannot resolve DNS names. CoreDNS pods are in `CrashLoopBackOff` logging `Loop (127.0.0.1:53 -> :53) detected`. What is the root cause?
- [ ] A. CoreDNS image is corrupted.
- [ ] B. Host `/etc/resolv.conf` nameserver points to local loopback (127.0.0.53) causing an infinite forwarding loop.
- [ ] C. Kubelet is missing the `--cluster-dns` flag.
- [ ] D. CNI plugin is not installed.

**Q23.** A Pod is stuck in `Pending`. `kubectl describe pod` shows `0/3 nodes are available: 3 node(s) had untolerated taint {dedicated: gpu}`. What action resolves this?
- [ ] A. Add a matching toleration for `dedicated: gpu` in the Pod's `spec.tolerations`.
- [ ] B. Increase the Pod's CPU request.
- [ ] C. Change `restartPolicy` to `Never`.
- [ ] D. Re-create the Pod in the `kube-system` namespace.

**Q24.** You run `kubectl get pods` and notice a Pod in `CreateContainerConfigError`. What is the immediate diagnostic step?
- [ ] A. `kubectl logs <pod-name>`
- [ ] B. `kubectl describe pod <pod-name>` to identify missing ConfigMap or Secret keys.
- [ ] C. Restart kubelet.
- [ ] D. Drain the worker node.

**Q25.** A Service of type `ClusterIP` has 0 endpoints (`ENDPOINTS: <none>`). Pods are running. What is the most common cause?
- [ ] A. kube-proxy is stopped.
- [ ] B. Service `spec.selector` labels do not match the Pod `metadata.labels`, or Pods are failing readiness probes.
- [ ] C. Node firewall is blocking port 443.
- [ ] D. The Service lacks a cluster-admin RoleBinding.

---

## 3. ANSWER KEY & SCORING MATRIX

| Question | Correct Answer | Domain | Points |
| :---: | :---: | :--- | :---: |
| Q1 | **B** (`--upload-certs`) | Cluster Architecture | 4 |
| Q2 | **B** (2 members) | Cluster Architecture | 4 |
| Q3 | **B** (`kubectl drain ...`) | Cluster Architecture | 4 |
| Q4 | **C** (Role in `staging`, RoleBinding in `staging`) | Cluster Architecture | 4 |
| Q5 | **B** (`kubeadm certs renew all`) | Cluster Architecture | 4 |
| Q6 | **A** (`kubectl rollout undo ... --to-revision=1`) | Workloads & Scheduling | 4 |
| Q7 | **B** (OOMKilled / memory limit exceeded) | Workloads & Scheduling | 4 |
| Q8 | **B** (`podAntiAffinity` with `hostname` topology) | Workloads & Scheduling | 4 |
| Q9 | **B** (2 pods run concurrently) | Workloads & Scheduling | 4 |
| Q10 | **B** (`auth-svc.security.svc.cluster.local`) | Services & Networking | 4 |
| Q11 | **C** (`Gateway`) | Services & Networking | 4 |
| Q12 | **B** (`ReferenceGrant`) | Services & Networking | 4 |
| Q13 | **B** (Default Deny Ingress) | Services & Networking | 4 |
| Q14 | **B** (Single item is AND; separate hyphens is OR) | Services & Networking | 4 |
| Q15 | **B** (When Pod is scheduled to a node) | Storage | 4 |
| Q16 | **D** (`ReadWriteOncePod`) | Storage | 4 |
| Q17 | **B** (Enters `Released`; data remains intact) | Storage | 4 |
| Q18 | **B** (`journalctl -u kubelet -e --no-pager`) | Troubleshooting | 4 |
| Q19 | **C** (`crictl ps -a` and `crictl logs`) | Troubleshooting | 4 |
| Q20 | **B** (New directory specified by `--data-dir`) | Troubleshooting | 4 |
| Q21 | **B** (Update `hostPath.path` in `etcd.yaml`) | Troubleshooting | 4 |
| Q22 | **B** (Host loopback DNS loop) | Troubleshooting | 4 |
| Q23 | **A** (Add matching toleration to Pod) | Troubleshooting | 4 |
| Q24 | **B** (`kubectl describe pod` for missing CM/Secret) | Troubleshooting | 4 |
| Q25 | **B** (Selector mismatch or unready probes) | Troubleshooting | 4 |

---

## 4. SCORE INTERPRETATION & PERSONALIZED ROADMAP

### Score: 88–100 Points (Advanced / Exam Ready)
* **Status:** You possess strong theoretical and administrative fundamentals.
* **Recommended Track:** **30-Day Accelerated Sprint** (Focus on Volume II speed drills, Volume IV JSONPath recipes, and Volume V Mock Exams 3 & 4).

### Score: 68–84 Points (Intermediate / Competent)
* **Status:** You understand Kubernetes architecture but have blind spots in advanced networking (Gateway API, ReferenceGrant) or Linux-level static pod/etcd troubleshooting.
* **Recommended Track:** **45-Day Standard Track** (Deep dive into Volume I Parts II, IV, and VI; complete all 67 labs in Volume II).

### Score: < 68 Points (Beginner / Foundational)
* **Status:** Needs structured foundational study across Linux kernel namespaces, declarative YAML, and core controllers.
* **Recommended Track:** **60-Day Comprehensive Track** (Start with Volume I Chapters 1–8; complete Volume II beginner labs; follow the progressive schedule).
