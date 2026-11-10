# VOLUME II: THE CKA PRACTICAL WORKBOOK
# DOMAIN 5: TROUBLESHOOTING (LABS 54–66)

---

## LAB 54: Pod Stuck in `Pending` (Resource Depletion and Taints)
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Diagnose why a Pod remains in `Pending` status by inspecting scheduler events and correcting unschedulable constraints.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** Pod `batch-calc` created in `default` stuck in `Pending`.
- **Task Description:**
  1. Inspect the cluster to locate a pod named `batch-calc` stuck in `Pending`.
  2. Inspect the pod's events to identify why the scheduler failed to place it.
  3. You will discover that the container requested `cpu: "64"`, which exceeds cluster capacity.
  4. Fix the manifest to request `cpu: "100m"`, re-apply, and verify the Pod enters `Running` status.
- **Constraints:** Do not delete or cordon worker nodes.
- **Hints:** Look at the bottom of `kubectl describe pod batch-calc`.
- **Expected Result:** Pod transitions from `Pending` to `Running`.
- **Verification:**
  ```bash
  kubectl get pod batch-calc
  # STATUS: Running
  ```
- **Full Solution:**
  ```bash
  # 1. Diagnose
  kubectl describe pod batch-calc
  # Event: 0/3 nodes are available: 3 Insufficient cpu.

  # 2. Extract and edit
  kubectl get pod batch-calc -o yaml > /tmp/batch-calc.yaml
  sed -i 's/cpu: "64"/cpu: 100m/g' /tmp/batch-calc.yaml

  # 3. Replace
  kubectl replace --force -f /tmp/batch-calc.yaml
  ```
- **Common Mistakes:** Trying to edit `requests.cpu` on a running pod with `kubectl edit` without `--force` (requests are immutable on running pods in standard clusters).
- **Troubleshooting:** Run `kubectl get events --field-selector involvedObject.name=batch-calc`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod batch-calc
  ```

---

## LAB 55: Diagnosing and Fixing `CrashLoopBackOff`
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Triage a container that boots and immediately crashes using `kubectl logs --previous` and repair application startup arguments.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Pod `log-forwarder` in namespace `logging` in `CrashLoopBackOff`.
- **Task Description:**
  1. Inspect Pod `log-forwarder` in namespace `logging`.
  2. Read the crash logs using `kubectl logs log-forwarder -n logging --previous`.
  3. Identify that the command failed with error: `cat: can't open '/etc/config/app.conf': No such file or directory`.
  4. Create a ConfigMap named `forwarder-config` containing key `app.conf` with text `log_level=debug`.
  5. Mount this ConfigMap at `/etc/config` in the Pod manifest and re-deploy.
  6. Verify the Pod reaches `Running` status with zero restarts.
- **Constraints:** Do not alter the container entrypoint command.
- **Hints:** Use `--previous` to see logs from the crashed container before the restart backoff.
- **Expected Result:** Pod stabilizes at `Running`.
- **Verification:**
  ```bash
  kubectl get pod log-forwarder -n logging
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

  # Check previous log
  kubectl logs log-forwarder -n logging --previous

  # Create missing config
  kubectl create configmap forwarder-config --from-literal=app.conf="log_level=debug" -n logging

  # Update Pod manifest
  cat <<EOF | kubectl apply -f -
  apiVersion: v1
  kind: Pod
  metadata:
    name: log-forwarder
    namespace: logging
  spec:
    containers:
    - name: forwarder
      image: busybox:1.36
      command: ["/bin/sh", "-c", "cat /etc/config/app.conf && sleep 3600"]
      volumeMounts:
      - name: cfg
        mountPath: /etc/config
    volumes:
    - name: cfg
      configMap:
        name: forwarder-config
  EOF
  ```
- **Common Mistakes:** Running `kubectl logs` without `--previous`, which often displays an empty log if the container is currently in the backoff sleep cycle.
- **Troubleshooting:** Inspect exit code in `kubectl describe pod log-forwarder -n logging`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace logging
  ```

---

## LAB 56: Fixing `ImagePullBackOff` and Private Registry Secrets
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Identify image name typographical errors and configure `imagePullSecrets` for private container registries.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Pod `secure-app` showing `ImagePullBackOff`.
- **Task Description:**
  1. Inspect Pod `secure-app` in `default`.
  2. Run `kubectl describe pod secure-app` to identify the image error.
  3. Notice the typo in the image name: `nginxx:1.27` instead of `nginx:1.27`.
  4. Update the pod image to `nginx:1.27`.
  5. Verify the pod transitions from `ImagePullBackOff` $\to$ `ContainerCreating` $\to$ `Running`.
- **Constraints:** Do not recreate the pod if you can patch it cleanly, or replace it rapidly.
- **Hints:** In a Pod, `spec.containers[0].image` can be edited, or recreate with `--force`.
- **Expected Result:** Pod pulls successfully and runs.
- **Verification:**
  ```bash
  kubectl get pod secure-app
  ```
- **Full Solution:**
  ```bash
  kubectl describe pod secure-app | grep -A 3 Events
  kubectl set image pod secure-app secure-app=nginx:1.27
  ```
- **Common Mistakes:** Confusing `ImagePullBackOff` (image not found) with `CrashLoopBackOff` (image downloaded, but binary failed).
- **Troubleshooting:** Inspect exact event string in `kubectl describe pod secure-app`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod secure-app
  ```

---

## LAB 57: Out-Of-Memory (`OOMKilled` Exit Code 137) Limit Tuning
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Diagnose an application terminated with Exit Code 137 (OOMKilled) and calibrate memory limits to accommodate application heap spikes.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Deployment `cache-worker` whose pods restart every 30 seconds with Exit Code 137.
- **Task Description:**
  1. Inspect the pods of Deployment `cache-worker`.
  2. Notice the restart count incrementing and `Last State: Terminated, Reason: OOMKilled`.
  3. Inspect container memory limits: currently set to `32Mi`.
  4. Update the Deployment manifest to increase memory limits to `256Mi` and memory requests to `128Mi`.
  5. Monitor the new rollout and verify the pods remain running with 0 restarts.
- **Constraints:** Understand why the Linux kernel OOM killer terminates processes exceeding `limits.memory`.
- **Hints:** Exit Code 137 $= 128 + 9$ (SIGKILL).
- **Expected Result:** Deployment pods stabilize at `Running` with zero subsequent restarts.
- **Verification:**
  ```bash
  kubectl get pods -l app=cache-worker
  ```
- **Full Solution:**
  ```bash
  kubectl describe pod -l app=cache-worker | grep -E "Reason|Exit Code"
  kubectl set resources deployment cache-worker --limits=memory=256Mi --requests=memory=128Mi
  kubectl rollout status deployment cache-worker
  ```
- **Common Mistakes:** Increasing CPU limits instead of memory limits (CPU limits cause throttling; only memory causes OOMKilled).
- **Troubleshooting:** Check node kernel dmesg for kernel OOM killer logs: `dmesg -T | grep -i oom`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete deployment cache-worker
  ```

---

## LAB 58: Triage and Recovery of a `NotReady` Worker Node
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** SSH into a failed worker node, inspect systemd service failures, repair a dead `kubelet` daemon, and verify node restoration.
- **Prerequisites:** Multi-node cluster with SSH access to `worker-1`.
- **Cluster Environment:** `kubeadm` multi-node cluster.
- **Initial State:** `worker-1` shows `STATUS: NotReady`.
- **Task Description:**
  1. On the control plane, run `kubectl get nodes` and observe `worker-1` is `NotReady`.
  2. SSH into `worker-1`.
  3. Inspect the status of the `kubelet` service: `sudo systemctl status kubelet`.
  4. Notice the service is inactive (dead).
  5. Attempt to start the service: `sudo systemctl start kubelet`.
  6. Inspect `sudo journalctl -u kubelet -e` to find why it fails: `unable to load client CA file: stat /etc/kubernetes/pki/ca.crt: no such file or directory`.
  7. Discover someone accidentally renamed `/etc/kubernetes/pki/ca.crt` to `/etc/kubernetes/pki/ca.crt.bak`.
  8. Restore the CA certificate file, start and enable `kubelet`.
  9. Exit to control plane and verify `worker-1` transitions back to `Ready`.
- **Constraints:** Do not reboot the host.
- **Hints:** Kubelet requires the cluster CA certificate to validate the API server.
- **Expected Result:** `worker-1` returns to `Ready` status.
- **Verification:**
  ```bash
  kubectl get nodes worker-1
  # STATUS: Ready
  ```
- **Full Solution:**
  ```bash
  # On worker-1:
  sudo systemctl status kubelet
  sudo journalctl -u kubelet -n 30 --no-pager
  # Identify missing ca.crt
  sudo mv /etc/kubernetes/pki/ca.crt.bak /etc/kubernetes/pki/ca.crt
  sudo systemctl restart kubelet
  sudo systemctl is-active kubelet
  # Output: active
  exit

  # On Control Plane:
  kubectl get nodes worker-1
  ```
- **Common Mistakes:** Failing to inspect `journalctl -u kubelet` and guessing random configurations.
- **Troubleshooting:** Verify node conditions: `kubectl describe node worker-1 | grep Ready`.
- **Cleanup Instructions:** None.

---

## LAB 59: Broken Kubelet Cgroup Driver Recovery
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Resolve a fatal cgroup driver mismatch between `containerd` and `kubelet` causing node boot loops.
- **Prerequisites:** SSH access to a worker node.
- **Cluster Environment:** Node running containerd.
- **Initial State:** Kubelet failing with `misconfigured cgroup driver`.
- **Task Description:**
  1. On worker node `worker-2`, kubelet fails to start.
  2. Inspect `sudo journalctl -u kubelet -e`.
  3. Locate error: `failed to run Kubelet: misconfiguration: cgroup driver: "cgroupfs" is different from docker/containerd cgroup driver "systemd"`.
  4. Edit `/var/lib/kubelet/config.yaml`.
  5. Update `cgroupDriver: cgroupfs` to `cgroupDriver: systemd`.
  6. Restart `kubelet` and verify it starts cleanly without errors.
- **Constraints:** Enforce `systemd` cgroup driver everywhere.
- **Hints:** Kubelet's configuration is managed via `/var/lib/kubelet/config.yaml`.
- **Expected Result:** Kubelet service enters `active (running)`.
- **Verification:**
  ```bash
  sudo systemctl status kubelet
  # Active: active (running)
  ```
- **Full Solution:**
  ```bash
  # On worker-2:
  sudo sed -i 's/cgroupDriver: cgroupfs/cgroupDriver: systemd/g' /var/lib/kubelet/config.yaml
  sudo systemctl restart kubelet
  sudo systemctl status kubelet --no-pager
  ```
- **Common Mistakes:** Modifying flags in `/etc/default/kubelet` that have been deprecated in modern Kubernetes. Edit `/var/lib/kubelet/config.yaml` directly.
- **Troubleshooting:** If kubelet still fails, verify `/etc/containerd/config.toml` has `SystemdCgroup = true`.
- **Cleanup Instructions:** None.

---

## LAB 60: Broken Control Plane Static Pod Manifest Repair
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Fix an invalid CLI flag inside `/etc/kubernetes/manifests/kube-scheduler.yaml` that prevents the Kubernetes scheduler from starting.
- **Prerequisites:** SSH access to control plane node with sudo privileges.
- **Cluster Environment:** `kubeadm` control plane node.
- **Initial State:** All newly created pods stay in `Pending` forever; `kube-scheduler` static pod is not running.
- **Task Description:**
  1. Notice that all pods across the cluster remain `Pending` even though nodes have ample CPU and RAM.
  2. Check control plane pods: `kubectl get pods -n kube-system`. Notice `kube-scheduler` is missing or crashed.
  3. SSH into the control plane node.
  4. Inspect `/etc/kubernetes/manifests/kube-scheduler.yaml`.
  5. Run `sudo crictl ps -a | grep scheduler` and check logs: `sudo crictl logs <id>`.
  6. Discover someone introduced a bogus flag: `--port=10251` or `--unknown-flag=true`.
  7. Remove the invalid flag from `/etc/kubernetes/manifests/kube-scheduler.yaml`.
  8. Observe kubelet automatically detect the file change and relaunch the scheduler container within 10 seconds.
  9. Verify pending pods are immediately scheduled and transition to `Running`.
- **Constraints:** Do not use `kubectl apply` on static pod manifests.
- **Hints:** Kubelet watches `/etc/kubernetes/manifests/` with inotify. Saving the file automatically triggers container recreation.
- **Expected Result:** `kube-scheduler` starts, and pending pods schedule immediately.
- **Verification:**
  ```bash
  kubectl get pods -n kube-system | grep scheduler
  kubectl get pods
  ```
- **Full Solution:**
  ```bash
  # On Control Plane:
  sudo crictl ps -a --name=kube-scheduler
  # Inspect logs of exited container
  sudo crictl logs $(sudo crictl ps -a --name=kube-scheduler -q | head -n 1)

  # Edit manifest and remove invalid line
  sudo nano /etc/kubernetes/manifests/kube-scheduler.yaml

  # Wait 10 seconds and verify
  kubectl get pods -n kube-system -l component=kube-scheduler
  ```
- **Common Mistakes:** Trying to delete the static pod with `kubectl delete pod`; kubelet will simply recreate the broken container again until the YAML on disk is fixed!
- **Troubleshooting:** Check `journalctl -u kubelet` if the static pod is not detected.
- **Cleanup Instructions:** None.

---

## LAB 61: Expired Cluster Certificate Recovery via `kubeadm certs renew`
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Recover an unresponsive cluster whose control plane TLS certificates have expired.
- **Prerequisites:** SSH access to control plane node.
- **Cluster Environment:** `kubeadm` cluster.
- **Initial State:** `kubectl` returns `Unable to connect to the server: x509: certificate has expired`.
- **Task Description:**
  1. Run `kubectl get nodes` and observe the x509 certificate expired error.
  2. SSH into the control plane node.
  3. Check certificate status: `sudo kubeadm certs check-expiration`.
  4. Observe that `admin.conf`, `apiserver`, etc. are expired.
  5. Renew all certificates: `sudo kubeadm certs renew all`.
  6. Copy the renewed admin credentials to `$HOME/.kube/config`:
     `sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config && sudo chown $(id -u):$(id -g) $HOME/.kube/config`.
  7. Restart control plane static pods by moving manifests out to `/tmp/` and back in.
  8. Verify `kubectl get nodes` functions cleanly.
- **Constraints:** Renew all certificates using official `kubeadm` tooling.
- **Hints:** Remember to update `$HOME/.kube/config` with the new client cert embedded in `/etc/kubernetes/admin.conf`!
- **Expected Result:** Cluster responds cleanly to all `kubectl` commands.
- **Verification:**
  ```bash
  kubectl get nodes
  sudo kubeadm certs check-expiration
  ```
- **Full Solution:**
  ```bash
  # 1. Renew
  sudo kubeadm certs renew all

  # 2. Update user kubeconfig
  mkdir -p $HOME/.kube
  sudo cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

  # 3. Restart static pods
  sudo mv /etc/kubernetes/manifests/*.yaml /tmp/
  sleep 5
  sudo mv /tmp/*.yaml /etc/kubernetes/manifests/

  # 4. Verify
  sleep 15
  kubectl get nodes
  ```
- **Common Mistakes:** Renewing certificates in `/etc/kubernetes/pki` but forgetting to update `$HOME/.kube/config`, leaving the user with an expired client cert!
- **Troubleshooting:** Run `openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -dates` to verify valid dates.
- **Cleanup Instructions:** None.

---

## LAB 62: CoreDNS Loop Crash Recovery
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Diagnose and resolve a CoreDNS infinite loop crash caused by systemd-resolved stub resolvers in host `/etc/resolv.conf`.
- **Prerequisites:** Control plane access.
- **Cluster Environment:** Ubuntu nodes with systemd-resolved.
- **Initial State:** CoreDNS pods in `CrashLoopBackOff`.
- **Task Description:**
  1. Notice CoreDNS pods in `kube-system` crash-looping.
  2. Inspect logs: `kubectl logs -n kube-system -l k8s-app=kube-dns`.
  3. Observe error: `plugin/loop: Loop (127.0.0.1:53 -> :53) detected for zone "."`.
  4. Inspect the host `/etc/resolv.conf` and discover `nameserver 127.0.0.53`.
  5. Update the kubelet configuration `/var/lib/kubelet/config.yaml` to point `resolvConf` to `/run/systemd/resolve/resolv.conf` (which points to real upstream DNS).
  6. Restart kubelet: `sudo systemctl restart kubelet`.
  7. Delete crash-looping CoreDNS pods and verify the new pods enter `Running` status without loop errors.
- **Constraints:** Do not disable CoreDNS loop detection plugin.
- **Hints:** `/run/systemd/resolve/resolv.conf` contains upstream nameservers instead of the local stub resolver.
- **Expected Result:** CoreDNS pods stabilize at `Running`.
- **Verification:**
  ```bash
  kubectl get pods -n kube-system -l k8s-app=kube-dns
  # STATUS: Running, RESTARTS: 0
  ```
- **Full Solution:**
  ```bash
  # Check logs
  kubectl logs -n kube-system -l k8s-app=kube-dns

  # Configure kubelet to use real upstream resolv.conf
  sudo sed -i 's|resolvConf: .*|resolvConf: /run/systemd/resolve/resolv.conf|g' /var/lib/kubelet/config.yaml
  sudo systemctl restart kubelet

  # Delete old pods to pick up new config
  kubectl delete pods -n kube-system -l k8s-app=kube-dns
  ```
- **Common Mistakes:** Manually removing the `loop` plugin from the Corefile without fixing the underlying upstream loop, leading to high CPU exhaustion.
- **Troubleshooting:** Check host nameserver: `cat /run/systemd/resolve/resolv.conf`.
- **Cleanup Instructions:** None.

---

## LAB 63: Network Service Endpoint Disconnect
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Diagnose why a Kubernetes Service returns connection refused or empty responses by identifying selector label mismatches.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Service `auth-api-svc` and Deployment `auth-api` running in `default`.
- **Task Description:**
  1. Service `auth-api-svc` is failing to route traffic to application pods.
  2. Run `kubectl get endpoints auth-api-svc` and observe `ENDPOINTS: <none>`.
  3. Inspect the selector of the Service and compare it with the labels of the Deployment pods.
  4. Notice the Service selector specifies `app: auth-service`, but the Pod template is labeled `app: auth-api`.
  5. Fix the Service selector to match `app: auth-api`.
  6. Verify `kubectl get endpoints auth-api-svc` now lists all pod IP addresses.
- **Constraints:** Do not delete the Deployment.
- **Hints:** A Service will only route traffic to Pods whose labels match its `spec.selector` exactly.
- **Expected Result:** Service endpoints are populated and internal traffic flows.
- **Verification:**
  ```bash
  kubectl get endpoints auth-api-svc
  # Should show IP:Port
  ```
- **Full Solution:**
  ```bash
  kubectl get svc auth-api-svc -o yaml
  kubectl get pods --show-labels

  # Update selector
  kubectl patch svc auth-api-svc -p '{"spec":{"selector":{"app":"auth-api"}}}'

  # Verify
  kubectl get endpoints auth-api-svc
  ```
- **Common Mistakes:** Editing the Deployment pod labels instead of the Service selector, which breaks other label-dependent controllers.
- **Troubleshooting:** Inspect selector with `kubectl describe svc auth-api-svc`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete svc auth-api-svc
  ```

---

## LAB 64: Broken NetworkPolicy Triage (Blocked Cross-Namespace Traffic)
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Discover and fix a restrictive NetworkPolicy that is silently dropping cross-namespace API calls.
- **Prerequisites:** NetworkPolicy capable cluster.
- **Cluster Environment:** Any cluster with Calico/Cilium.
- **Initial State:** Namespaces `frontend` and `backend`. Frontend cannot connect to `backend-svc`.
- **Task Description:**
  1. Pod in namespace `frontend` attempts to curl `http://backend-svc.backend:8080` but times out.
  2. Inspect the `backend` namespace for active NetworkPolicies: `kubectl get netpol -n backend`.
  3. Inspect policy `lockdown-backend`: notice it allows Ingress only from namespaces labeled `tier: web`.
  4. Check labels on namespace `frontend`: `kubectl get ns frontend --show-labels`. Notice the label is missing.
  5. Label namespace `frontend` with `tier: web`.
  6. Verify connectivity is immediately restored.
- **Constraints:** Do not delete or disable the NetworkPolicy.
- **Hints:** NetworkPolicies selecting namespaces match against labels on the `Namespace` object, not the Pod object!
- **Expected Result:** Connections from `frontend` to `backend` succeed.
- **Verification:**
  ```bash
  kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n frontend -- http://backend-svc.backend:8080
  # Expected: HTTP 200 OK
  ```
- **Full Solution:**
  ```bash
  kubectl describe netpol lockdown-backend -n backend
  kubectl label namespace frontend tier=web --overwrite
  ```
- **Common Mistakes:** Labeling the Pod in `frontend` instead of labeling the `Namespace` resource.
- **Troubleshooting:** Run `kubectl get netpol -A` to ensure no competing default-deny egress policies exist in `frontend`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace frontend backend
  ```

---

## LAB 65: etcd Quorum Loss and `mvcc: database space exceeded` Alarm
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Resolve a frozen etcd cluster locked in read-only mode by compacting historical revisions, defragmenting storage, and disarming alarms.
- **Prerequisites:** SSH access to control plane node.
- **Cluster Environment:** `kubeadm` cluster.
- **Initial State:** Cluster refuses write operations with `etcdserver: mvcc: database space exceeded`.
- **Task Description:**
  1. Attempt to create a pod: `kubectl run test --image=nginx`.
  2. Observe failure: `etcdserver: mvcc: database space exceeded`.
  3. SSH into control plane node.
  4. Query active alarms using `etcdctl alarm list`. Notice alarm `NOSPACE`.
  5. Query current etcd revision.
  6. Compact etcd history up to current revision.
  7. Defragment the database storage on disk using `etcdctl defrag`.
  8. Disarm the alarm using `etcdctl alarm disarm`.
  9. Verify write access is restored by successfully creating the test pod.
- **Constraints:** Do not wipe the database or delete `/var/lib/etcd`.
- **Hints:** Defrag alone will not clear the alarm; you must run `alarm disarm`.
- **Expected Result:** Alarm is cleared and cluster writes succeed.
- **Verification:**
  ```bash
  sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    alarm list
  # Expected: empty
  kubectl run test-verify --image=nginx:alpine
  # Expected: pod created successfully
  ```
- **Full Solution:**
  ```bash
  # 1. Check alarm
  sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    alarm list

  # 2. Find revision
  REV=$(sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    endpoint status --write-out="json" | jq .[0].Status.header.revision)

  # 3. Compact
  sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    compact $REV

  # 4. Defrag
  sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    defrag

  # 5. Disarm
  sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    alarm disarm
  ```
- **Common Mistakes:** Running `compact` but omitting `defrag`, which leaves host database file size unchanged.
- **Troubleshooting:** Check disk usage of `/var/lib/etcd/member/snap/db`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod test-verify || true
  ```

---

## LAB 66: Integrated Multi-Failure Cluster Outage (The CKA Grand Challenge)
- **Difficulty:** Advanced
- **Estimated Duration:** 20 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Solve a compound, cascading failure involving a dead kubelet, corrupted static pod manifest, broken CoreDNS, and locked Service.
- **Prerequisites:** Full control plane and worker node SSH access.
- **Cluster Environment:** Multi-node `kubeadm` cluster.
- **Initial State:** Cluster completely down: `kubectl` connection refused.
- **Task Description:**
  1. Triage Stage 1: Control plane is unreachable on port 6443. SSH to control plane. Kubelet is inactive because Linux swap was enabled. Disable swap and start kubelet.
  2. Triage Stage 2: Kubelet is running, but API Server static pod still fails to start. Inspect `/etc/kubernetes/manifests/kube-apiserver.yaml`. Fix a typo in `--etcd-servers=https://127.0.0.1:23799` (extra 9 on port). API server boots!
  3. Triage Stage 3: `worker-1` shows `NotReady`. SSH to `worker-1`. Container runtime is stopped. Start `containerd` and `kubelet`. Node transitions to `Ready`.
  4. Triage Stage 4: Workload Pods cannot resolve external or internal services. Inspect `kube-system` CoreDNS pods; they are running, but Service `kube-dns` has an incorrect targetPort (`targetPort: 5353` instead of `53`). Fix targetPort.
  5. Run end-to-end verification across the entire cluster.
- **Constraints:** Solve each layer sequentially without rebooting nodes.
- **Hints:** Follow the 6-layer diagnostic hierarchy (Hardware $\to$ Runtime $\to$ Kubelet $\to$ Static Pods $\to$ Networking $\to$ App).
- **Expected Result:** All nodes `Ready`, all control plane components healthy, DNS resolves, and workloads serve traffic.
- **Verification:**
  ```bash
  kubectl get nodes
  kubectl get pods -A
  kubectl run grand-check --image=busybox:1.36 --rm -it --restart=Never -- nslookup kubernetes.default
  ```
- **Full Solution:**
  ```bash
  # Step 1: On Control Plane - Fix Swap
  sudo swapoff -a
  sudo systemctl restart kubelet

  # Step 2: Fix API Server port typo
  sudo sed -i 's/23799/2379/g' /etc/kubernetes/manifests/kube-apiserver.yaml
  sleep 15

  # Step 3: On worker-1 - Fix Containerd
  ssh worker-1
  sudo systemctl restart containerd
  sudo systemctl restart kubelet
  exit

  # Step 4: Fix CoreDNS Service port
  kubectl patch svc kube-dns -n kube-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/0/targetPort", "value":53}]'

  # Step 5: Verify
  kubectl get nodes
  ```
- **Common Mistakes:** Giving up at Step 1 or assuming the cluster is irreparably corrupted.
- **Troubleshooting:** Keep checking component health via `kubectl get --raw='/readyz?verbose'`.
- **Cleanup Instructions:** None (cluster is restored to health).


---

## LAB 67: Advanced Chaos Recovery: Cross-Namespace Gateway API Failure, Missing ReferenceGrant & Kubelet Socket Mismatch
- **Difficulty:** Advanced
- **Estimated Duration:** 20 minutes
- **Domain:** Troubleshooting (30%)
- **Learning Objective:** Troubleshoot an advanced multi-tier infrastructure failure: a worker node reporting `NotReady` due to a misplaced CRI socket, combined with a detached cross-namespace Gateway API `HTTPRoute` failing traffic due to a missing `ReferenceGrant`.
- **Prerequisites:** Gateway API CRDs v1.1+ installed, multi-node cluster.
- **Cluster Environment:** Multi-node cluster with `infra-cluster` context.
- **Initial State:** 
  1. Worker node `worker-2` is in `NotReady` condition.
  2. Namespace `gateway-infra` has Gateway `prod-gw` listening on HTTP port 80.
  3. Namespace `checkout-app` has Deployment `checkout-web` and Service `checkout-svc`.
  4. Namespace `checkout-app` has HTTPRoute `checkout-route` targeting `prod-gw`, but traffic to `checkout.example.com` returns 404 or connection refused.
- **Task Description:**
  1. Diagnose why `worker-2` is `NotReady`. SSH to `worker-2`, inspect `kubelet` journal logs, identify the misconfigured CRI socket path in `/var/lib/kubelet/kubeadm-flags.env` or `/var/lib/kubelet/config.yaml`, fix it, and restore the node to `Ready`.
  2. Inspect the condition of `HTTPRoute` `checkout-route` in namespace `checkout-app`.
  3. Notice that `checkout-route` has condition `Accepted: False` with reason `RefNotPermitted` because the parent Gateway is in `gateway-infra` while the route is in `checkout-app`.
  4. Author and apply a `ReferenceGrant` in namespace `gateway-infra` allowing HTTPRoutes from namespace `checkout-app` to bind to Gateway `prod-gw`.
  5. Verify `HTTPRoute` transitions to `Accepted: True` and traffic routes successfully to `checkout-svc`.
- **Constraints:** Do not delete or recreate the Gateway or worker node. Resolve root causes in-place.
- **Hints:** Use `kubectl describe httproute checkout-route -n checkout-app` to inspect conditions. Check `kubectl get referencegrant -A`.
- **Expected Result:** `worker-2` is `Ready`, and `checkout-route` is accepted and programmed.
- **Verification:**
  ```bash
  kubectl get nodes worker-2
  # Expected: Ready
  kubectl get httproute checkout-route -n checkout-app -o jsonpath='{.status.parents[0].conditions[?(@.type=="Accepted")].status}'
  # Expected: True
  ```
- **Full Solution:**
  ```bash
  # Step 1: Fix worker-2 Kubelet CRI socket
  ssh worker-2
  sudo sed -i 's|/run/containerd/wrong.sock|/run/containerd/containerd.sock|g' /var/lib/kubelet/kubeadm-flags.env
  sudo systemctl daemon-reload
  sudo systemctl restart kubelet
  exit

  # Step 2: Inspect HTTPRoute status
  kubectl describe httproute checkout-route -n checkout-app

  # Step 3: Create ReferenceGrant in gateway-infra namespace
  cat <<EOF | kubectl apply -f -
  apiVersion: gateway.networking.k8s.io/v1beta1
  kind: ReferenceGrant
  metadata:
    name: allow-checkout-route
    namespace: gateway-infra
  spec:
    from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: checkout-app
    to:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: prod-gw
  EOF

  # Step 4: Verify route accepted
  kubectl get httproute checkout-route -n checkout-app
  ```
- **Common Mistakes:** Creating the `ReferenceGrant` in the route's namespace (`checkout-app`) instead of the Gateway owner's namespace (`gateway-infra`). The resource granting permission must always reside in the namespace owning the target resource!
- **Troubleshooting:** Check controller logs: `kubectl logs -n gateway-infra -l app=gateway-controller`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete referencegrant allow-checkout-route -n gateway-infra
  ```
