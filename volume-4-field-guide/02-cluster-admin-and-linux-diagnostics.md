# VOLUME IV: THE CKA COMMAND AND TROUBLESHOOTING FIELD GUIDE
## PART 2: CLUSTER ADMINISTRATION, ETCD, CRICTL & LINUX DIAGNOSTICS

---

## 1. KUBEADM CLUSTER LIFECYCLE & CERTIFICATE MANAGEMENT

---

### Command: Certificate Expiration Inspection
- **Syntax:** `sudo kubeadm certs check-expiration`
- **Purpose:** Inspects cryptographic TLS certificates in `/etc/kubernetes/pki/` and reports remaining lifespan.
- **Example:**
  ```bash
  sudo kubeadm certs check-expiration
  ```
- **Expected Output:**
  ```text
  CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY
  admin.conf                 Nov 09, 2027 12:00 UTC   364d            ca
  apiserver                  Nov 09, 2027 12:00 UTC   364d            ca
  apiserver-etcd-client      Nov 09, 2027 12:00 UTC   364d            etcd-ca
  apiserver-kubelet-client   Nov 09, 2027 12:00 UTC   364d            ca
  controller-manager.conf    Nov 09, 2027 12:00 UTC   364d            ca
  etcd-healthcheck-client    Nov 09, 2027 12:00 UTC   364d            etcd-ca
  etcd-peer                  Nov 09, 2027 12:00 UTC   364d            etcd-ca
  etcd-server                Nov 09, 2027 12:00 UTC   364d            etcd-ca
  front-proxy-client         Nov 09, 2027 12:00 UTC   364d            front-proxy-ca
  scheduler.conf             Nov 09, 2027 12:00 UTC   364d            ca
  ```
- **Common Mistakes:** Running without `sudo`, causing `permission denied` errors when accessing `/etc/kubernetes/pki/*.key`.

---

### Command: Certificate Renewal Procedure
- **Syntax:** `sudo kubeadm certs renew (all|<cert-name>)`
- **Purpose:** Generates fresh 1-year cryptographic TLS certificates signed by the local CA.
- **Runbook:**
  ```bash
  # Step 1: Renew all certificates
  sudo kubeadm certs renew all

  # Step 2: Restart control plane static pods by moving manifests temporarily
  sudo mv /etc/kubernetes/manifests/*.yaml /tmp/
  sleep 5
  sudo mv /tmp/*.yaml /etc/kubernetes/manifests/

  # Step 3: Update local user kubeconfig with renewed admin credentials
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

  # Step 4: Verify API access
  kubectl get nodes
  ```
- **Safety Warning:** Renewing certificates updates `/etc/kubernetes/admin.conf`. If you forget Step 3, your local `kubectl` commands will immediately fail with `401 Unauthorized / certificate has expired`!

---

### Command: Cluster Version Upgrade (Control Plane)
- **Syntax:**
  - `sudo kubeadm upgrade plan`
  - `sudo kubeadm upgrade apply <version>`
- **Runbook:**
  ```bash
  # 1. Unhold kubeadm and install target version
  sudo apt-mark unhold kubeadm
  sudo apt-get update && sudo apt-get install -y kubeadm=1.31.2-1.1
  sudo apt-mark hold kubeadm

  # 2. Plan the upgrade to verify compatibility
  sudo kubeadm upgrade plan

  # 3. Apply the upgrade to the control plane
  sudo kubeadm upgrade apply v1.31.2 -y

  # 4. Drain control plane node
  kubectl drain <cp-node> --ignore-daemonsets

  # 5. Upgrade kubelet and kubectl
  sudo apt-mark unhold kubelet kubectl
  sudo apt-get install -y kubelet=1.31.2-1.1 kubectl=1.31.2-1.1
  sudo apt-mark hold kubelet kubectl

  # 6. Restart kubelet daemon
  sudo systemctl daemon-reload
  sudo systemctl restart kubelet

  # 7. Uncordon control plane node
  kubectl uncordon <cp-node>
  ```

---

### Command: Worker Node Upgrade Runbook
```bash
# 1. Drain worker node from control plane / bastion
kubectl drain <worker-node> --ignore-daemonsets --delete-emptydir-data

# 2. SSH into worker node
ssh <worker-node>

# 3. Upgrade kubeadm binary
sudo apt-mark unhold kubeadm
sudo apt-get update && sudo apt-get install -y kubeadm=1.31.2-1.1
sudo apt-mark hold kubeadm

# 4. Upgrade local worker configuration
sudo kubeadm upgrade node

# 5. Upgrade kubelet and kubectl
sudo apt-mark unhold kubelet kubectl
sudo apt-get install -y kubelet=1.31.2-1.1 kubectl=1.31.2-1.1
sudo apt-mark hold kubelet kubectl

# 6. Restart kubelet
sudo systemctl daemon-reload
sudo systemctl restart kubelet
exit

# 7. Uncordon worker node from control plane
kubectl uncordon <worker-node>
```

---

### Command: Generate Node Join Token
- **Syntax:** `kubeadm token create --print-join-command`
- **Purpose:** Generates a new bootstrap token and prints the complete `kubeadm join` command with CA hash for joining new worker nodes.
- **Example:**
  ```bash
  kubeadm token create --print-join-command
  ```
- **Expected Output:**
  ```bash
  kubeadm join 192.168.1.10:6443 --token abcdef.0123456789abcdef \
      --discovery-token-ca-cert-hash sha256:7c8b4e2f9d1a3b5c7e9f...
  ```

---

## 2. ETCD DISASTER RECOVERY & ETCDCTL RUNBOOK

---

### Command: etcd Snapshot Backup
- **Syntax:**
  ```bash
  ETCDCTL_API=3 etcdctl --endpoints=<endpoint> \
    --cacert=<ca-path> --cert=<cert-path> --key=<key-path> \
    snapshot save <output-file.db>
  ```
- **Standard Control Plane Backup Command:**
  ```bash
  ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    snapshot save /opt/etcd-backup.db
  ```
- **Verify Snapshot Integrity:**
  ```bash
  ETCDCTL_API=3 etcdctl --write-out=table snapshot status /opt/etcd-backup.db
  ```
- **Expected Output:**
  ```text
  +----------+----------+------------+------------+
  |   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
  +----------+----------+------------+------------+
  | fe84a10c |    15820 |       1450 |     3.2 MB |
  +----------+----------+------------+------------+
  ```

---

### Command: etcd Disaster Recovery Restore Procedure
When etcd is corrupted, execute this step-by-step restoration:

```bash
# Step 1: Restore snapshot to a NEW data directory
ETCDCTL_API=3 etcdctl snapshot restore /opt/etcd-backup.db \
  --data-dir=/var/lib/etcd-restored \
  --initial-cluster="controlplane=https://127.0.0.1:2380" \
  --initial-cluster-token="etcd-cluster-1" \
  --initial-advertise-peer-urls="https://127.0.0.1:2380" \
  --name="controlplane"

# Step 2: Update the hostPath mount in the etcd static pod manifest
sudo sed -i 's|path: /var/lib/etcd|path: /var/lib/etcd-restored|g' /etc/kubernetes/manifests/etcd.yaml

# Step 3: Wait for kubelet to restart the etcd static pod (30-60 seconds)
# Step 4: Verify health
kubectl get nodes
```
- **Safety Warning:** NEVER restore directly into `/var/lib/etcd` without specifying `--data-dir=/var/lib/etcd-restored`. Restoring over an existing directory causes write collisions and corrupts the Raft log.

---

## 3. CRICTL CONTAINER RUNTIME REFERENCE

`crictl` communicates directly with the CRI socket (`/run/containerd/containerd.sock`). It is the primary troubleshooting tool when `kubectl` is unavailable.

---

### Common CRICTL Operations:
```bash
# Configure endpoint once if not set
cat <<EOF | sudo tee /etc/crictl.yaml
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
EOF

# 1. List all active and stopped Pod sandboxes
sudo crictl pods

# 2. List all containers (including exited and crashing containers)
sudo crictl ps -a

# 3. Filter containers by name (e.g. static control plane pods)
sudo crictl ps -a --name kube-apiserver

# 4. View raw stdout/stderr logs directly from the runtime
sudo crictl logs <container-id>

# 5. Execute interactive shell inside a container
sudo crictl exec -it <container-id> sh

# 6. Prune all unused container images to free disk space
sudo crictl rmi --prune
```

---

## 4. LINUX SYSTEMD & KERNEL DIAGNOSTICS

---

### Inspecting System Daemons with systemctl & journalctl
```bash
# Check service status
sudo systemctl status kubelet
sudo systemctl status containerd

# Tail kubelet systemd journal logs
sudo journalctl -u kubelet -n 100 --no-pager
sudo journalctl -u kubelet -f

# Tail containerd runtime logs
sudo journalctl -u containerd -n 100 --no-pager

# Reload daemon configuration after editing systemd service files
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

---

## 5. NETWORK & CONNECTIVITY DIAGNOSTICS

```bash
# 1. Check IP addresses and network interfaces
ip -br addr show
ip route show

# 2. Check listening TCP ports and process owners (verify port 6443, 2379, 10250)
ss -tulpen | grep -E "6443|2379|10250|10259|10257"

# 3. Test TCP port reachability with 3-second timeout
nc -zvw3 192.168.1.10 6443

# 4. Inspect raw HTTP/HTTPS API response with TLS verbose output
curl -Iv -k https://127.0.0.1:6443/version

# 5. Capture live packet traffic on CNI bridge interface
sudo tcpdump -nn -i any port 6443 -c 10
sudo tcpdump -nn -i cbr0 icmp

# 6. Test CoreDNS resolution from inside the cluster
kubectl run dns-test --rm -it --image=busybox:1.28 -- nslookup kubernetes.default
kubectl run dns-test --rm -it --image=busybox:1.28 -- nslookup kube-dns.kube-system.svc.cluster.local
```
