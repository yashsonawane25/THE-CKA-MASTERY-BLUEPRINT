# VOLUME V: THE CKA MOCK EXAMINATION SYSTEM
# MOCK EXAM 3: ADVANCED TROUBLESHOOTING SIMULATION

---

## EXAMINATION SPECIFICATIONS
- **Target Difficulty:** Advanced Troubleshooting (High Stress)
- **Time Allowed:** 120 minutes (2.0 hours)
- **Passing Score:** 66% (Total: 100%)
- **Number of Tasks:** 18 Performance-Based Diagnostic Scenarios
- **Focus:** Cluster component failure, node outages, broken manifests, storage locks, etcd recovery, and networking drop chains.

---

## TASK 1: Recover Inactive Kubelet Due to Linux Swap (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Worker node `worker-1` shows `NotReady`.
- **Task Description:**
  1. SSH to `worker-1`.
  2. Inspect why `systemctl status kubelet` reports failed status.
  3. Journalctl indicates swap is active.
  4. Disable swap immediately, disable it in `/etc/fstab`, and start `kubelet`.
- **Expected Final Condition:** `worker-1` returns to `Ready` status.
- **Solution:**
  ```bash
  ssh worker-1
  sudo swapoff -a
  sudo sed -i '/swap/s/^/#/' /etc/fstab
  sudo systemctl restart kubelet
  sudo systemctl is-active kubelet
  exit
  kubectl get nodes worker-1
  ```

---

## TASK 2: Kubelet Cgroup Driver Mismatch Recovery (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Worker node `worker-2` fails to boot kubelet.
- **Task Description:**
  1. SSH to `worker-2`.
  2. Inspect kubelet journal logs for cgroup error.
  3. Align `/var/lib/kubelet/config.yaml` to use `cgroupDriver: systemd`.
  4. Restart kubelet.
- **Expected Final Condition:** Kubelet active and node `worker-2` shows `Ready`.
- **Solution:**
  ```bash
  ssh worker-2
  sudo sed -i 's/cgroupDriver: cgroupfs/cgroupDriver: systemd/g' /var/lib/kubelet/config.yaml
  sudo systemctl restart kubelet
  exit
  kubectl get nodes worker-2
  ```

---

## TASK 3: Repair Broken API Server Static Pod Flag (Weight: 7%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** `kubectl` returns connection refused on port 6443.
- **Task Description:**
  1. SSH to control plane node.
  2. Use `crictl ps -a` to find the exited `kube-apiserver` container.
  3. View container logs using `crictl logs`.
  4. Notice error: `unknown flag: --etcd-cafile-broken`.
  5. Edit `/etc/kubernetes/manifests/kube-apiserver.yaml` and fix flag to `--etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt`.
  6. Wait for kubelet to relaunch container.
- **Expected Final Condition:** API server boots and `kubectl get nodes` succeeds.
- **Solution:**
  ```bash
  sudo crictl ps -a --name=kube-apiserver
  sudo sed -i 's/--etcd-cafile-broken/--etcd-cafile/g' /etc/kubernetes/manifests/kube-apiserver.yaml
  sleep 15
  kubectl get nodes
  ```

---

## TASK 4: Repair Crashed Kube-Scheduler Static Pod (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** All new pods stuck in `Pending` with 0 scheduler events.
- **Task Description:**
  1. Notice `kube-scheduler` static pod is not running in `kube-system`.
  2. Inspect `/etc/kubernetes/manifests/kube-scheduler.yaml` on control plane.
  3. Fix typo in container command: `kube-schedulerr` $\to$ `kube-scheduler`.
- **Expected Final Condition:** Scheduler launches and pending pods are scheduled.
- **Solution:**
  ```bash
  sudo sed -i 's/kube-schedulerr/kube-scheduler/g' /etc/kubernetes/manifests/kube-scheduler.yaml
  ```

---

## TASK 5: etcd Defragmentation and Space Alarm Disarm (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** API server returns `etcdserver: mvcc: database space exceeded`.
- **Task Description:**
  1. Compact etcd history to current revision.
  2. Defragment etcd storage.
  3. Disarm `NOSPACE` alarm.
- **Expected Final Condition:** Cluster writes succeed.
- **Solution:**
  ```bash
  export ETCDCTL_API=3
  export CERTS="--cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key --endpoints=https://127.0.0.1:2379"
  REV=$(sudo etcdctl $CERTS endpoint status -w json | jq .[0].Status.header.revision)
  sudo etcdctl $CERTS compact $REV
  sudo etcdctl $CERTS defrag
  sudo etcdctl $CERTS alarm disarm
  ```

---

## TASK 6: etcd Point-in-Time Snapshot Restore (Weight: 8%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Backup exists at `/opt/backup/etcd.db`.
- **Task Description:**
  1. Stop static pods by moving manifests out of `/etc/kubernetes/manifests/`.
  2. Restore snapshot to `/var/lib/etcd-recovery`.
  3. Update `etcd.yaml` to point to `/var/lib/etcd-recovery`.
  4. Move manifests back and verify cluster state.
- **Expected Final Condition:** Cluster recovers from snapshot.
- **Solution:**
  ```bash
  sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
  sudo mv /etc/kubernetes/manifests/etcd.yaml /tmp/
  sudo ETCDCTL_API=3 etcdctl --data-dir=/var/lib/etcd-recovery snapshot restore /opt/backup/etcd.db
  sudo sed -i 's|/var/lib/etcd|/var/lib/etcd-recovery|g' /tmp/etcd.yaml
  sudo mv /tmp/etcd.yaml /etc/kubernetes/manifests/
  sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
  sleep 15
  kubectl get nodes
  ```

---

## TASK 7: CoreDNS Loop Crash Recovery (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** CoreDNS in `CrashLoopBackOff` with loop error.
- **Task Description:**
  1. Inspect CoreDNS logs.
  2. Update kubelet config `/var/lib/kubelet/config.yaml` to set `resolvConf: /run/systemd/resolve/resolv.conf`.
  3. Restart kubelet and delete crash-looping CoreDNS pods.
- **Expected Final Condition:** CoreDNS pods enter `Running` status.
- **Solution:**
  ```bash
  sudo sed -i 's|resolvConf: .*|resolvConf: /run/systemd/resolve/resolv.conf|g' /var/lib/kubelet/config.yaml
  sudo systemctl restart kubelet
  kubectl delete pods -n kube-system -l k8s-app=kube-dns
  ```

---

## TASK 8: Enable Node IP Forwarding in Linux Kernel (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pods on `worker-1` cannot reach external network.
- **Task Description:**
  1. SSH to `worker-1`.
  2. Check `sysctl net.ipv4.ip_forward`. Output is 0.
  3. Enable IP forwarding dynamically and persist in `/etc/sysctl.d/k8s.conf`.
- **Expected Final Condition:** `net.ipv4.ip_forward = 1` and cross-node traffic flows.
- **Solution:**
  ```bash
  ssh worker-1
  sudo sysctl -w net.ipv4.ip_forward=1
  echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.d/k8s.conf
  ```

---

## TASK 9: Fix NetworkPolicy Blocking Outbound DNS (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pods in `secure-zone` cannot resolve domain names.
- **Task Description:**
  1. Inspect egress NetworkPolicy `egress-lock` in `secure-zone`.
  2. Notice it lacks port 53 UDP/TCP egress rules.
  3. Add an egress rule allowing port 53 to all destinations.
- **Expected Final Condition:** DNS resolution works inside `secure-zone`.
- **Solution:**
  ```yaml
  # Patch egress-lock to include:
  - ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  ```

---

## TASK 10: Triage OOMKilled Container (Exit Code 137) (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Deployment `report-gen` crashing with OOMKilled.
- **Task Description:**
  1. Inspect container termination status.
  2. Increase memory limit from `64Mi` to `256Mi`.
- **Expected Final Condition:** Deployment pods stabilize at `Running`.
- **Solution:**
  ```bash
  kubectl set resources deployment report-gen --limits=memory=256Mi --requests=memory=128Mi
  ```

---

## TASK 11: Fix Pod CrashLoopBackOff Due to Missing ConfigMap (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pod `worker-app` showing `CreateContainerConfigError`.
- **Task Description:**
  1. Inspect pod events. Missing ConfigMap `app-settings`.
  2. Create ConfigMap `app-settings` with key `mode=prod`.
- **Expected Final Condition:** Pod transitions to `Running`.
- **Solution:**
  ```bash
  kubectl create configmap app-settings --from-literal=mode=prod
  ```

---

## TASK 12: Admission Webhook Deadlock Recovery (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** All resource creation requests hang for 30s with webhook timeout.
- **Task Description:**
  1. Inspect validating webhooks: `kubectl get validatingwebhookconfigurations`.
  2. Locate failed webhook `validator.corp.local`.
  3. Delete the blocking webhook configuration to unfreeze the cluster.
- **Expected Final Condition:** API server responds immediately.
- **Solution:**
  ```bash
  kubectl delete validatingwebhookconfiguration validator.corp.local
  ```

---

## TASK 13: Reclaim Released PV by Removing ClaimRef (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** PV `pv-legacy` shows `Released`.
- **Task Description:**
  1. Clear `spec.claimRef` from PV `pv-legacy`.
  2. Verify status transitions to `Available`.
- **Expected Final Condition:** PV is `Available` for new PVC binding.
- **Solution:**
  ```bash
  kubectl patch pv pv-legacy -p '{"spec":{"claimRef": null}}'
  ```

---

## TASK 14: Fix Failing LivenessProbe Restart Loop (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pod `web-probe` restarts every 30 seconds.
- **Task Description:**
  1. Inspect probe failure events.
  2. Fix probe path from `/healthz-wrong` to `/` on port 80.
- **Expected Final Condition:** Pod remains `Running` with 0 restarts.
- **Solution:**
  ```bash
  kubectl get pod web-probe -o yaml > /tmp/probe.yaml
  sed -i 's|/healthz-wrong|/|g' /tmp/probe.yaml
  kubectl replace --force -f /tmp/probe.yaml
  ```

---

## TASK 15: Fix DaemonSet Missing Control Plane Toleration (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** DaemonSet `node-diag` does not schedule on control plane.
- **Task Description:**
  1. Add toleration for `node-role.kubernetes.io/control-plane:NoSchedule` to DaemonSet spec.
- **Expected Final Condition:** Pod schedules onto the control plane node.
- **Solution:**
  ```yaml
  # Add to spec.template.spec.tolerations:
  - key: node-role.kubernetes.io/control-plane
    operator: Exists
    effect: NoSchedule
  ```

---

## TASK 16: Clear Worker Node DiskPressure Eviction (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Node `worker-1` shows `DiskPressure: True`.
- **Task Description:**
  1. SSH to `worker-1`.
  2. Use `crictl rmi --prune` to remove unused images and clean dangling logs in `/var/log/pods`.
- **Expected Final Condition:** `DiskPressure` transitions to `False`.
- **Solution:**
  ```bash
  ssh worker-1
  sudo crictl rmi --prune
  sudo rm -rf /var/log/pods/deleted-*
  ```

---

## TASK 17: Service TargetPort Mismatch Triage (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Service `web-svc` has endpoints, but curling returns connection refused.
- **Task Description:**
  1. Discover `web-svc` targetPort is set to 8080, but NGINX listens on 80.
  2. Update `targetPort: 80`.
- **Expected Final Condition:** Curling Service returns HTTP 200.
- **Solution:**
  ```bash
  kubectl patch svc web-svc -p '{"spec":{"ports":[{"port":80,"targetPort":80}]}}'
  ```

---

## TASK 18: Extract Node Storage Driver via Custom Columns (Weight: 2%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Multi-node cluster.
- **Task Description:**
  1. List node names and container runtime versions using custom-columns.
  2. Write output to `/tmp/runtimes.txt`.
- **Expected Final Condition:** Text file populated with custom headers.
- **Solution:**
  ```bash
  kubectl get nodes -o custom-columns=NAME:.metadata.name,RUNTIME:.status.nodeInfo.containerRuntimeVersion > /tmp/runtimes.txt
  ```
