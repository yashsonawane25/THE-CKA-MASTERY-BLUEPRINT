# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART VI: COMPREHENSIVE TROUBLESHOOTING
## CHAPTERS 67–72: API SERVER, ETCD, NETWORKING & INTEGRATED FAILURE DRILLS

---

### CHAPTER 67 & 68: API SERVER & ETCD OUTAGE RECOVERY

#### 1. Recovering a Crashed kube-apiserver
When `kubectl` commands return `The connection to the server 192.168.1.10:6443 was refused`:
1. SSH into the control plane host.
2. The API server runs as a static pod. Inspect `/etc/kubernetes/manifests/kube-apiserver.yaml`.
3. Check runtime container status:
   ```bash
   sudo crictl ps -a --name kube-apiserver
   sudo crictl logs $(sudo crictl ps -a --name kube-apiserver -q | head -n 1)
   ```
4. Common failure causes:
   * Typo in flag arguments inside `/etc/kubernetes/manifests/kube-apiserver.yaml`.
   * Expired certificates in `/etc/kubernetes/pki/`.
   * `etcd` static container is down or unresponsive on port 2379.

#### 2. Restoring etcd from Corrupted State
Execute the proven disaster recovery workflow:
```bash
ETCDCTL_API=3 etcdctl snapshot restore /opt/backup.db \
  --data-dir=/var/lib/etcd-recovered \
  --initial-cluster="controlplane=https://127.0.0.1:2380" \
  --initial-cluster-token="k8s-cluster" \
  --initial-advertise-peer-urls="https://127.0.0.1:2380" \
  --name="controlplane"

sudo sed -i 's|path: /var/lib/etcd|path: /var/lib/etcd-recovered|g' /etc/kubernetes/manifests/etcd.yaml
```

---

### CHAPTER 69 & 70: NETWORKING, DNS & STORAGE TROUBLESHOOTING

#### 1. CoreDNS Failure Drill
* **Symptom:** Application pods throw `Name or service not known`.
* **Root Cause 1:** CoreDNS pods stuck in `CrashLoopBackOff` with `Loop ... detected`. Occurs when host `/etc/resolv.conf` loops back to `127.0.0.53`. Update host DNS to external IP (e.g. `8.8.8.8`) and restart CoreDNS.
* **Root Cause 2:** NetworkPolicy in application namespace lacks egress rule on UDP port 53.

#### 2. Service Endpoints Missing
* **Symptom:** `curl http://<service-ip>` hangs or drops connection.
* **Diagnostic:** `kubectl get endpoints <service-name>`. If `<none>`, the service label selector does not match the pod labels or the pods are failing readiness probes.

---

### CHAPTER 71 & 72: INTEGRATED MULTI-COMPONENT FAILURE DRILLS

#### Master Integrated Drill: The "Blackout" Control Plane
**Scenario:**
A cluster operator accidentally ran a cleanup script on the control plane node. The cluster is completely down:
* `kubectl` returns connection refused.
* `kubelet` is inactive.
* `etcd` data directory was wiped.

**Step-by-Step Resolution Runbook:**
1. **Restart Kubelet Daemon:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart kubelet
   sudo systemctl status kubelet
   ```
2. **Verify Static Pod Manifest Directory:**
   Inspect `/var/lib/kubelet/config.yaml` and confirm:
   ```yaml
   staticPodPath: /etc/kubernetes/manifests
   ```
3. **Restore etcd Database from Latest Snapshot:**
   ```bash
   ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
     --data-dir=/var/lib/etcd-restored \
     --initial-cluster="master=https://127.0.0.1:2380" \
     --name="master"
   ```
4. **Point etcd Manifest to Restored Data:**
   Update hostPath in `/etc/kubernetes/manifests/etcd.yaml` to `/var/lib/etcd-restored`.
5. **Verify kube-apiserver Comes Online:**
   Wait 30 seconds for kubelet to launch static containers. Verify with:
   ```bash
   sudo crictl ps | grep kube-apiserver
   kubectl get nodes
   ```
6. **Uncordon Nodes & Verify Workload Healing:**
   ```bash
   kubectl get pods -A
   ```
