# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART VI: COMPREHENSIVE TROUBLESHOOTING
## CHAPTERS 60–66: METHODOLOGY, WORKLOADS, NODES, KUBELET & RUNTIME

---

### CHAPTER 60: SYSTEMATIC KUBERNETES TROUBLESHOOTING METHODOLOGY

Troubleshooting accounts for **30% of the CKA exam**. Never guess or execute random commands. Always execute the **Hierarchical Diagnostic Pyramid**:

```
                  ┌──────────────────────┐
                  │ 1. Cluster & Node    │  kubectl get nodes -o wide
                  │    Infrastructure    │  systemctl status kubelet
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │ 2. Control Plane     │  crictl ps -a (apiserver, etcd)
                  │    Core Services     │  journalctl -u kubelet
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │ 3. Workloads & Pods  │  kubectl get pods -A -o wide
                  │    Health & Phases   │  kubectl describe pod <name>
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │ 4. Logs & Telemetry  │  kubectl logs <pod> --previous
                  │    Internal Errors   │  crictl logs <container-id>
                  └──────────────────────┘
```

---

### CHAPTER 61 & 62: POD AND DEPLOYMENT TROUBLESHOOTING

#### Diagnostic Decision Matrix:
1. **`CrashLoopBackOff`:**
   * Step 1: `kubectl logs <pod-name> --previous`
   * Step 2: `kubectl describe pod <pod-name>` (Check Exit Code: 137 = OOMKilled; 0 = Batch process exited; 1 = App error).
2. **`ImagePullBackOff`:**
   * Check image spelling, tag existence, and `imagePullSecrets`.
3. **`CreateContainerConfigError`:**
   * Referenced `ConfigMap` or `Secret` does not exist in the pod's namespace.
4. **Deployment Replicas Not Updating:**
   * Run `kubectl rollout status deployment/<name>`.
   * Check for resource quota violations or failing readiness probes holding back rolling updates.

---

### CHAPTER 63–66: NODE, KUBELET & CONTAINER RUNTIME TROUBLESHOOTING

#### 1. Diagnosing Node `NotReady`
```bash
# 1. Inspect conditions
kubectl describe node <node-name> | grep -A 6 Conditions

# 2. SSH into node
ssh <node-name>

# 3. Check kubelet service
sudo systemctl status kubelet
sudo journalctl -u kubelet -n 50 --no-pager

# 4. Check containerd runtime
sudo systemctl status containerd
sudo crictl pods
```

#### 2. Kubelet Cgroup Driver Mismatch
If `journalctl -u kubelet` reports `failed to run Kubelet: misconfiguration: kubelet cgroup driver: "cgroupfs" is different from docker/containerd cgroup driver: "systemd"`:
```bash
# Fix /var/lib/kubelet/config.yaml
sudo sed -i 's/cgroupDriver: cgroupfs/cgroupDriver: systemd/g' /var/lib/kubelet/config.yaml
sudo systemctl restart kubelet
```
