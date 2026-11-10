# TROUBLESHOOTING DECISION TREES CATALOG
## THE 6 COMPREHENSIVE INCIDENT RESPONSE PROCEDURES

---

## 1. INCIDENT TREE 1: NODE NOTREADY RECOVERY
```
Symptom: Node status reports NotReady in 'kubectl get nodes'
  │
  ├── 1. Initial Check: kubectl describe node <node> | grep -A 5 Conditions
  │     ├── DiskPressure = True ──> Clean disk: sudo crictl rmi --prune
  │     ├── MemoryPressure = True ──> Identify OOM leak, kill rogue containers
  │     └── Ready = False / Unknown ──> Node agent (kubelet) communication severed
  │
  ├── 2. SSH to Node & Inspect Service:
  │     sudo systemctl status kubelet
  │     ├── Active: inactive (dead) ──> sudo systemctl restart kubelet
  │     └── Active: failed (Result: exit-code) ──> sudo journalctl -u kubelet -e --no-pager
  │
  ├── 3. Analyze Kubelet Failure Reason:
  │     ├── "swap is enabled" ──> sudo swapoff -a && sed -i '/swap/d' /etc/fstab
  │     ├── "cgroup driver mismatch" ──> Set SystemdCgroup = true in /etc/containerd/config.toml
  │     ├── "connection refused to 6443" ──> Control plane unreachable; check firewall/routing
  │     └── "certificate has expired" ──> Renew /var/lib/kubelet/pki/ certs via bootstrap
  │
  └── 4. Verification:
        sudo systemctl restart containerd && sudo systemctl restart kubelet
        kubectl get nodes <node> (Transitions to Ready within 30 seconds)
```

---

## 2. INCIDENT TREE 2: CONTROL PLANE APISERVER DOWN (PORT 6443 REFUSED)
```
Symptom: kubectl returns "The connection to server <ip>:6443 was refused"
  │
  ├── 1. SSH to Control Plane Host:
  │     sudo systemctl is-active kubelet
  │     └── If inactive ──> sudo systemctl restart kubelet
  │
  ├── 2. Inspect Static Pod Containers via Runtime:
  │     sudo crictl ps -a --name kube-apiserver
  │     ├── Container is Exited / Crashing ──> sudo crictl logs <container-id>
  │     └── Container is Missing ──> Verify /etc/kubernetes/manifests/kube-apiserver.yaml
  │
  ├── 3. Identify Root Error from Logs:
  │     ├── "etcdserver: request timed out" ──> etcd is dead on port 2379; check etcd container
  │     ├── "unknown flag: --xxx" ──> Typo in static pod manifest args; fix YAML syntax
  │     └── "tls: bad certificate" ──> Expired PKI cert; run: sudo kubeadm certs renew all
  │
  └── 4. Verification:
        curl -k https://127.0.0.1:6443/healthz (Returns "ok")
        kubectl get nodes (Restores full CLI operation)
```

---

## 3. INCIDENT TREE 3: POD CRASHLOOPBACKOFF & EXIT CODE ANALYSIS
```
Symptom: Pod continuously crashes; restartCount increases rapidly
  │
  ├── 1. Fetch Previous Crash Log:
  │     kubectl logs <pod-name> -n <ns> --previous
  │     └── If empty ──> kubectl logs <pod-name> -n <ns>
  │
  ├── 2. Inspect Last State & Termination Reason:
  │     kubectl describe pod <pod-name> -n <ns>
  │     ├── Exit Code 0 ──> Container finished work; add long-running daemon / sleep
  │     ├── Exit Code 1 ──> Application exception, syntax error, or unhandled promise
  │     ├── Exit Code 137 ──> OOMKilled; increase resources.limits.memory in pod spec
  │     ├── Exit Code 139 ──> Segmentation fault in compiled binary
  │     ├── Exit Code 143 ──> Gracefully terminated by external SIGTERM
  │     └── Exit Code 255 ──> Entrypoint / CMD executable not found in image
  │
  └── 3. Verification:
        kubectl get pod <pod-name> -n <ns> (Status remains Running for >60 seconds)
```

---

## 4. INCIDENT TREE 4: SERVICE CONNECTIVITY & MISSING ENDPOINTS
```
Symptom: curl http://<service-ip>:<port> drops packets or times out
  │
  ├── 1. Inspect Endpoints:
  │     kubectl get endpoints <service-name> -n <ns>
  │     │
  │     ├── If ENDPOINTS: <none>
  │     │   ├── Check Labels: Compare service spec.selector with pod metadata.labels
  │     │   └── Check Readiness: Are pods passing readiness probes? (Unready = Stripped)
  │     │
  │     └── If ENDPOINTS: Populated with Pod IPs
  │         ├── Direct Connect: Test curl http://<pod-ip>:<targetPort> from another pod
  │         │   ├── If Direct Pod Fails ──> Container app not listening on targetPort
  │         │   └── If Direct Pod Works ──> kube-proxy iptables rule programming failed
  │         │
  │         └── Check NetworkPolicies:
  │             kubectl get netpol -n <ns> (Look for policies dropping ingress traffic)
  │
  └── 2. Verification:
        kubectl run curl-test --rm -it --image=curlimages/curl -- curl -Iv http://<service-name>.<ns>
```

---

## 5. INCIDENT TREE 5: COREDNS NAME RESOLUTION OUTAGE
```
Symptom: Pods cannot resolve service names (e.g. "nslookup kubernetes.default" fails)
  │
  ├── 1. Inspect CoreDNS Pods in kube-system:
  │     kubectl get pods -n kube-system -l k8s-app=kube-dns
  │     ├── Status: CrashLoopBackOff ──> Check logs: kubectl logs -n kube-system -l k8s-app=kube-dns
  │     │   └── "Loop detected" ──> Host /etc/resolv.conf points to 127.0.0.53; fix host DNS
  │     │
  │     └── Status: Running ──> Inspect CoreDNS Service
  │         kubectl get svc kube-dns -n kube-system (Verify ClusterIP: 10.96.0.10)
  │         kubectl get endpoints kube-dns -n kube-system (Verify endpoints exist)
  │
  ├── 2. Test CoreDNS Direct Query from Debug Pod:
  │     kubectl run dns-test --rm -it --image=busybox:1.28 -- nslookup 10.96.0.1 10.96.0.10
  │     ├── Succeeds on IP, fails on names ──> /etc/resolv.conf search path missing in pod
  │     └── Timeouts completely ──> NetworkPolicy in caller namespace blocks Port 53 UDP
  │
  └── 3. Verification:
        kubectl run dns-test --rm -it --image=busybox:1.28 -- nslookup kubernetes.default
```

---

## 6. INCIDENT TREE 6: PERSISTENTVOLUMECLAIM BINDING FAILURE
```
Symptom: PersistentVolumeClaim remains in Pending status indefinitely
  │
  ├── 1. Inspect PVC Events:
  │     kubectl describe pvc <pvc-name> -n <ns>
  │     │
  │     ├── "waiting for first consumer to be created"
  │     │   └── NORMAL BEHAVIOR: StorageClass uses volumeBindingMode: WaitForFirstConsumer.
  │     │       PVC will bind automatically once a Pod referencing it is scheduled!
  │     │
  │     ├── "no persistent volumes available for this claim"
  │     │   ├── Capacity Mismatch: Existing PV capacity < requested PVC storage
  │     │   ├── AccessMode Mismatch: PV accessModes do not include PVC requested mode
  │     │   └── StorageClass Mismatch: PV storageClassName != PVC storageClassName
  │     │
  │     └── "provisioning failed"
  │         └── Dynamic Provisioning Error: CSI driver down or cloud API IAM denied
  │
  └── 2. Verification:
        kubectl get pvc <pvc-name> -n <ns> (Status transitions from Pending to Bound)
```
