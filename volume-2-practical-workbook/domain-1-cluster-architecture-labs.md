# VOLUME II: THE CKA PRACTICAL WORKBOOK
# DOMAIN 1: CLUSTER ARCHITECTURE, INSTALLATION & CONFIGURATION (LABS 01–15)

---

## LAB 01: Multi-Namespace RBAC Role and RoleBinding Deployment
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Author a namespace-scoped `Role` and bind it to a `ServiceAccount` to permit granular pod management while denying service modifications.
- **Prerequisites:** Running cluster with `kubectl` configured.
- **Cluster Environment:** Any standard Kubernetes cluster (`kind`, `minikube`, or `kubeadm`).
- **Initial State:** Namespace `finance` does not exist.
- **Task Description:**
  1. Create a namespace named `finance`.
  2. Create a `ServiceAccount` named `finance-auditor` in namespace `finance`.
  3. Create a `Role` named `pod-reader` in namespace `finance` that allows `get`, `list`, and `watch` verbs on `pods` and `pods/log`.
  4. Create a `RoleBinding` named `bind-pod-reader` binding the `finance-auditor` ServiceAccount to the `pod-reader` Role.
- **Constraints:** Do not grant any permissions outside of namespace `finance`. Do not grant access to `secrets` or `services`.
- **Hints:** Use `kubectl create role` and `kubectl create rolebinding` with `--dry-run=client -o yaml` for fast execution.
- **Expected Result:** The `finance-auditor` ServiceAccount can list pods in `finance`, but cannot list pods in `default` or create deployments.
- **Verification:**
  ```bash
  kubectl auth can-i list pods -n finance --as=system:serviceaccount:finance:finance-auditor
  # Expected: yes
  kubectl auth can-i create pods -n finance --as=system:serviceaccount:finance:finance-auditor
  # Expected: no
  kubectl auth can-i list pods -n default --as=system:serviceaccount:finance:finance-auditor
  # Expected: no
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace finance
  kubectl create serviceaccount finance-auditor -n finance
  kubectl create role pod-reader -n finance --verb=get,list,watch --resource=pods,pods/log
  kubectl create rolebinding bind-pod-reader -n finance --role=pod-reader --serviceaccount=finance:finance-auditor
  ```
- **Common Mistakes:** Omitting `-n finance` on the Role or RoleBinding, creating them in `default`.
- **Troubleshooting:** If `auth can-i` returns `no`, inspect `kubectl get rolebinding bind-pod-reader -n finance -o yaml` to check the `subjects` namespace.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace finance
  ```

---

## LAB 02: Cluster-Wide Privilege Escalation Prevention via ClusterRoles
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Create a `ClusterRole` and bind it with a namespace-scoped `RoleBinding` to constrain cluster-wide role definitions to a single namespace.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Multi-namespace cluster.
- **Initial State:** Namespace `engineering` exists.
- **Task Description:**
  1. Create a `ClusterRole` named `node-and-deployment-viewer` granting `get`, `list`, and `watch` on `nodes` and `deployments`.
  2. Create a ServiceAccount named `eng-lead` in namespace `engineering`.
  3. Bind the `ClusterRole` to `eng-lead` in namespace `engineering` using a `RoleBinding` named `eng-lead-deploy-view`.
- **Constraints:** Do NOT use a `ClusterRoleBinding`.
- **Hints:** A `RoleBinding` can reference a `ClusterRole`, but it only grants permissions on namespaced resources within its own namespace.
- **Expected Result:** `eng-lead` can list deployments in `engineering`, but CANNOT list nodes or list deployments in `default`.
- **Verification:**
  ```bash
  kubectl auth can-i list deployments -n engineering --as=system:serviceaccount:engineering:eng-lead
  # Expected: yes
  kubectl auth can-i list deployments -n default --as=system:serviceaccount:engineering:eng-lead
  # Expected: no
  kubectl auth can-i list nodes --as=system:serviceaccount:engineering:eng-lead
  # Expected: no (nodes are cluster-scoped, RoleBinding cannot grant them)
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace engineering --dry-run=client -o yaml | kubectl apply -f -
  kubectl create clusterrole node-and-deployment-viewer --verb=get,list,watch --resource=nodes,deployments.apps
  kubectl create serviceaccount eng-lead -n engineering
  kubectl create rolebinding eng-lead-deploy-view -n engineering --clusterrole=node-and-deployment-viewer --serviceaccount=engineering:eng-lead
  ```
- **Common Mistakes:** Attempting to grant node permissions via a `RoleBinding`. Non-namespaced resources (like Nodes) require a `ClusterRoleBinding`.
- **Troubleshooting:** Run `kubectl describe rolebinding eng-lead-deploy-view -n engineering` and verify `RoleRef` points to `ClusterRole/node-and-deployment-viewer`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace engineering
  kubectl delete clusterrole node-and-deployment-viewer
  ```

---

## LAB 03: Safe Worker Node Maintenance (Cordon and Drain)
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Drain all non-daemon workloads from a worker node, perform mock OS patching, and safely return the node to active service.
- **Prerequisites:** Multi-node cluster (1 control plane, at least 2 worker nodes).
- **Cluster Environment:** `kubeadm` multi-node cluster or multi-node `kind`.
- **Initial State:** Deployment `nginx-fleet` with 4 replicas distributed across worker nodes.
- **Task Description:**
  1. Identify worker node `worker-1`.
  2. Safely cordon `worker-1` to prevent new Pod scheduling.
  3. Drain all workloads from `worker-1`, evicting pods cleanly while ignoring DaemonSets and handling local emptyDir volumes.
  4. Verify all 4 replicas of `nginx-fleet` are rescheduled onto other nodes.
  5. Uncordon `worker-1`.
- **Constraints:** No downtime for `nginx-fleet`.
- **Hints:** Use `--ignore-daemonsets` and `--delete-emptydir-data`.
- **Expected Result:** Node `worker-1` enters `SchedulingDisabled`, all pods migrate to other nodes, and then node returns to `Ready`.
- **Verification:**
  ```bash
  kubectl get nodes worker-1
  # During drain: SchedulingDisabled
  kubectl get pods -l app=nginx-fleet -o wide
  # None should reside on worker-1 during maintenance
  ```
- **Full Solution:**
  ```bash
  kubectl create deployment nginx-fleet --image=nginx:1.27 --replicas=4
  kubectl cordon worker-1
  kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data --force
  # Verify node is evacuated
  kubectl get pods -A -o wide | grep worker-1
  # Uncordon
  kubectl uncordon worker-1
  ```
- **Common Mistakes:** Forgetting `--ignore-daemonsets`, causing the drain command to fail immediately.
- **Troubleshooting:** If drain hangs, check for a `PodDisruptionBudget` blocking eviction.
- **Cleanup Instructions:**
  ```bash
  kubectl delete deployment nginx-fleet
  ```

---

## LAB 04: Control Plane Version Upgrade with kubeadm
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Execute an in-place minor version upgrade of a Kubernetes control plane node using `kubeadm`, `kubelet`, and `kubectl`.
- **Prerequisites:** SSH access to control plane node with `sudo`.
- **Cluster Environment:** `kubeadm` cluster running v1.30.x.
- **Initial State:** Cluster running v1.30.2.
- **Task Description:**
  1. Upgrade `kubeadm` package to `1.31.2-1.1`.
  2. Plan and execute `kubeadm upgrade apply v1.31.2`.
  3. Drain the control plane node.
  4. Upgrade `kubelet` and `kubectl` to `1.31.2-1.1`.
  5. Restart `kubelet` and uncordon the control plane.
- **Constraints:** Do not skip minor versions. Do not reboot the machine.
- **Hints:** Remember to unhold packages before `apt-get install` and hold them immediately afterward.
- **Expected Result:** `kubectl get nodes` reports the control plane running `v1.31.2`.
- **Verification:**
  ```bash
  kubectl get nodes
  kubeadm version
  ```
- **Full Solution:**
  ```bash
  sudo apt-mark unhold kubeadm
  sudo apt-get update && sudo apt-get install -y kubeadm=1.31.2-1.1
  sudo apt-mark hold kubeadm

  sudo kubeadm upgrade plan
  sudo kubeadm upgrade apply v1.31.2 -y

  kubectl drain $(hostname) --ignore-daemonsets --delete-emptydir-data

  sudo apt-mark unhold kubelet kubectl
  sudo apt-get install -y kubelet=1.31.2-1.1 kubectl=1.31.2-1.1
  sudo apt-mark hold kubelet kubectl

  sudo systemctl daemon-reload
  sudo systemctl restart kubelet

  kubectl uncordon $(hostname)
  ```
- **Common Mistakes:** Upgrading `kubelet` before running `kubeadm upgrade apply`.
- **Troubleshooting:** Check `journalctl -u kubelet -e` if kubelet fails to start after version upgrade.
- **Cleanup Instructions:** None (cluster remains upgraded).

---

## LAB 05: Worker Node Upgrade with kubeadm
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Upgrade a secondary worker node to match the upgraded control plane version.
- **Prerequisites:** Control plane already upgraded to v1.31.2; SSH access to `worker-1`.
- **Cluster Environment:** Multi-node `kubeadm` cluster.
- **Initial State:** `worker-1` is at v1.30.2 while control plane is at v1.31.2.
- **Task Description:**
  1. From control plane, drain `worker-1`.
  2. SSH into `worker-1`.
  3. Upgrade `kubeadm` to `1.31.2-1.1`.
  4. Execute `sudo kubeadm upgrade node`.
  5. Upgrade `kubelet` and `kubectl` to `1.31.2-1.1`.
  6. Restart `kubelet`.
  7. From control plane, uncordon `worker-1`.
- **Constraints:** Do not run `kubeadm upgrade apply` on a worker node.
- **Hints:** Use `kubeadm upgrade node` on workers.
- **Expected Result:** `kubectl get nodes` shows `worker-1` running `v1.31.2` in `Ready` status.
- **Verification:**
  ```bash
  kubectl get node worker-1 -o custom-columns=NAME:.metadata.name,VERSION:.status.nodeInfo.kubeletVersion,STATUS:.status.conditions[-1].type
  ```
- **Full Solution:**
  ```bash
  # On Control Plane:
  kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data

  # On worker-1:
  sudo apt-mark unhold kubeadm
  sudo apt-get update && sudo apt-get install -y kubeadm=1.31.2-1.1
  sudo apt-mark hold kubeadm

  sudo kubeadm upgrade node

  sudo apt-mark unhold kubelet kubectl
  sudo apt-get install -y kubelet=1.31.2-1.1 kubectl=1.31.2-1.1
  sudo apt-mark hold kubelet kubectl

  sudo systemctl daemon-reload
  sudo systemctl restart kubelet
  exit

  # On Control Plane:
  kubectl uncordon worker-1
  ```
- **Common Mistakes:** Running `kubeadm upgrade apply` on worker nodes instead of `kubeadm upgrade node`.
- **Troubleshooting:** If the node stays in `SchedulingDisabled`, check if `kubectl uncordon` was run on the control plane.
- **Cleanup Instructions:** None.

---

## LAB 06: etcd Automated Snapshot Backup with mTLS
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Use `etcdctl` to capture a verified cryptographic snapshot of the cluster state.
- **Prerequisites:** SSH access to control plane node with root/sudo access.
- **Cluster Environment:** Single or multi-control-plane cluster with static pod etcd.
- **Initial State:** Healthy etcd cluster listening on port 2379.
- **Task Description:**
  1. Identify etcd client certificates in `/etc/kubernetes/pki/etcd/`.
  2. Export `ETCDCTL_API=3`.
  3. Save a snapshot to `/var/backups/etcd-snapshot-manual.db`.
  4. Verify the snapshot status and record its total keys and revision number.
- **Constraints:** Must use TLS certificates: `--cacert`, `--cert`, `--key`.
- **Hints:** Pass `--endpoints=https://127.0.0.1:2379`.
- **Expected Result:** Snapshot file exists at `/var/backups/etcd-snapshot-manual.db` with status showing valid hash.
- **Verification:**
  ```bash
  sudo ETCDCTL_API=3 etcdctl --write-out=table snapshot status /var/backups/etcd-snapshot-manual.db
  ```
- **Full Solution:**
  ```bash
  sudo mkdir -p /var/backups
  sudo ETCDCTL_API=3 etcdctl \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    snapshot save /var/backups/etcd-snapshot-manual.db
  ```
- **Common Mistakes:** Forgetting `ETCDCTL_API=3`, causing the command to default to API v2 and fail.
- **Troubleshooting:** If `connection refused`, verify port 2379 is listening with `netstat -tlpn | grep 2379`.
- **Cleanup Instructions:** None (retain backup for Lab 07).

---

## LAB 07: Disaster Recovery: etcd Snapshot Restoration
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Restore a previously captured etcd snapshot into a new data directory and update static pod manifests.
- **Prerequisites:** Completed Lab 06 (snapshot at `/var/backups/etcd-snapshot-manual.db`).
- **Cluster Environment:** `kubeadm` control plane node.
- **Initial State:** Cluster running with data created after the snapshot.
- **Task Description:**
  1. Create a canary deployment `pre-restore-canary` (will be deleted by restore).
  2. Stop the API Server by moving `/etc/kubernetes/manifests/kube-apiserver.yaml` to `/tmp/`.
  3. Restore `/var/backups/etcd-snapshot-manual.db` into new directory `/var/lib/etcd-from-backup`.
  4. Update `/etc/kubernetes/manifests/etcd.yaml` to use `/var/lib/etcd-from-backup` for hostPath volume mounts.
  5. Move `kube-apiserver.yaml` back to `/etc/kubernetes/manifests/`.
  6. Verify cluster state is restored and `pre-restore-canary` is gone.
- **Constraints:** Do not overwrite existing `/var/lib/etcd` directory directly.
- **Hints:** Modify both `volumeMounts` and `volumes` in `etcd.yaml`.
- **Expected Result:** API server restarts, etcd mounts new directory, canary deployment no longer exists.
- **Verification:**
  ```bash
  kubectl get deployment pre-restore-canary
  # Expected: Error from server (NotFound)
  kubectl get nodes
  # Expected: Ready
  ```
- **Full Solution:**
  ```bash
  kubectl create deployment pre-restore-canary --image=nginx:alpine

  # 1. Stop static pods
  sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
  sudo mv /etc/kubernetes/manifests/etcd.yaml /tmp/

  # 2. Restore to new dir
  sudo ETCDCTL_API=3 etcdctl \
    --data-dir=/var/lib/etcd-from-backup \
    snapshot restore /var/backups/etcd-snapshot-manual.db

  # 3. Update etcd manifest
  sudo sed -i 's|/var/lib/etcd|/var/lib/etcd-from-backup|g' /tmp/etcd.yaml

  # 4. Restore manifests
  sudo mv /tmp/etcd.yaml /etc/kubernetes/manifests/
  sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

  # 5. Wait for API Server
  sleep 15
  kubectl get nodes
  ```
- **Common Mistakes:** Overwriting `/var/lib/etcd` without stopping the static pod, causing write collisions.
- **Troubleshooting:** Use `crictl ps -a | grep etcd` to check if the restored etcd container launched successfully.
- **Cleanup Instructions:**
  ```bash
  sudo rm -rf /var/lib/etcd-from-backup
  # (Optionally revert etcd.yaml back to /var/lib/etcd)
  ```

---

## LAB 08: Deploying Applications via Helm with Values Overrides
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Install and configure an application using Helm CLI, pass custom parameters via `--set`, and verify release lifecycle.
- **Prerequisites:** Helm v3 installed on candidate workstation.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** Namespace `monitoring-tools` does not exist.
- **Task Description:**
  1. Add the Prometheus community repo: `https://prometheus-community.github.io/helm-charts`.
  2. Install a release named `node-metrics` using chart `prometheus-community/prometheus-node-exporter`.
  3. Deploy into namespace `monitoring-tools` (create if needed).
  4. Set the hostNetwork configuration to `true` and service port to `9100`.
  5. List the installed releases and verify status is `deployed`.
- **Constraints:** Use Helm CLI only; do not write raw deployment manifests.
- **Hints:** Use `--namespace <ns> --create-namespace`.
- **Expected Result:** Helm release `node-metrics` is deployed and running DaemonSet pods on every node.
- **Verification:**
  ```bash
  helm list -n monitoring-tools
  kubectl get daemonset -n monitoring-tools
  ```
- **Full Solution:**
  ```bash
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo update
  helm install node-metrics prometheus-community/prometheus-node-exporter \
    --namespace monitoring-tools \
    --create-namespace \
    --set service.port=9100
  ```
- **Common Mistakes:** Typing the repo name incorrectly or forgetting `helm repo update`.
- **Troubleshooting:** Run `helm status node-metrics -n monitoring-tools` to view deployment notes and error states.
- **Cleanup Instructions:**
  ```bash
  helm uninstall node-metrics -n monitoring-tools
  kubectl delete namespace monitoring-tools
  ```

---

## LAB 09: Declarative Multi-Environment Overlays with Kustomize
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Structure a base directory and production overlay using Kustomize, and apply it directly using `kubectl apply -k`.
- **Prerequisites:** `kubectl` with native Kustomize support.
- **Cluster Environment:** Any test cluster.
- **Initial State:** Clean working directory `/tmp/kustomize-lab`.
- **Task Description:**
  1. Create directory structure `/tmp/kustomize-lab/base` and `/tmp/kustomize-lab/overlays/prod`.
  2. In `base`, author a Deployment `app-server` running `nginx:1.27` with 1 replica and a `kustomization.yaml`.
  3. In `overlays/prod`, author a `kustomization.yaml` that:
     - Pulls from `../../base`.
     - Adds name prefix `prod-`.
     - Sets common labels `env: production` and `tier: gold`.
     - Patches replica count to `3`.
  4. Apply the production overlay using `kubectl apply -k`.
- **Constraints:** Do not modify files in `base` when creating the production overlay.
- **Hints:** Use `kubectl kustomize` to preview the rendered YAML before applying.
- **Expected Result:** A Deployment named `prod-app-server` with 3 replicas is created.
- **Verification:**
  ```bash
  kubectl get deployment prod-app-server -o jsonpath='{.spec.replicas}'
  # Expected: 3
  kubectl get pods -l env=production,tier=gold
  ```
- **Full Solution:**
  ```bash
  mkdir -p /tmp/kustomize-lab/base /tmp/kustomize-lab/overlays/prod

  # Base
  cat <<EOF > /tmp/kustomize-lab/base/deployment.yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: app-server
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: app-server
    template:
      metadata:
        labels:
          app: app-server
      spec:
        containers:
        - name: nginx
          image: nginx:1.27
  EOF

  cat <<EOF > /tmp/kustomize-lab/base/kustomization.yaml
  resources:
  - deployment.yaml
  EOF

  # Overlay
  cat <<EOF > /tmp/kustomize-lab/overlays/prod/replica-patch.yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: app-server
  spec:
    replicas: 3
  EOF

  cat <<EOF > /tmp/kustomize-lab/overlays/prod/kustomization.yaml
  resources:
  - ../../base
  namePrefix: prod-
  commonLabels:
    env: production
    tier: gold
  patches:
  - path: replica-patch.yaml
  EOF

  kubectl apply -k /tmp/kustomize-lab/overlays/prod
  ```
- **Common Mistakes:** Misspelling `resources` as `resource` in `kustomization.yaml`.
- **Troubleshooting:** Run `kubectl kustomize /tmp/kustomize-lab/overlays/prod` to view exact schema validation errors.
- **Cleanup Instructions:**
  ```bash
  kubectl delete -k /tmp/kustomize-lab/overlays/prod
  rm -rf /tmp/kustomize-lab
  ```

---

## LAB 10: Custom Resource Definition (CRD) Inspection and Instantiation
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Install a Custom Resource Definition, inspect its schema with `kubectl explain`, and instantiate a Custom Resource.
- **Prerequisites:** Cluster administrator privileges.
- **Cluster Environment:** Any test cluster.
- **Initial State:** No CRD for `Database` exists.
- **Task Description:**
  1. Author and apply a CRD `databases.example.com` with group `example.com`, version `v1`, kind `Database`, and scope `Namespaced`. Include a string spec field `engine` and integer field `replicas`.
  2. Use `kubectl explain database.spec` to verify the schema.
  3. Create a Custom Resource of kind `Database` named `orders-db` with `engine: postgres` and `replicas: 2`.
- **Constraints:** Schema must be validated OpenAPI v3.
- **Hints:** Root API group for CRD definitions is `apiextensions.k8s.io/v1`.
- **Expected Result:** `kubectl get databases` lists `orders-db`.
- **Verification:**
  ```bash
  kubectl get crd databases.example.com
  kubectl get databases orders-db -o yaml
  ```
- **Full Solution:**
  ```yaml
  apiVersion: apiextensions.k8s.io/v1
  kind: CustomResourceDefinition
  metadata:
    name: databases.example.com
  spec:
    group: example.com
    versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                engine:
                  type: string
                replicas:
                  type: integer
    scope: Namespaced
    names:
      plural: databases
      singular: database
      kind: Database
      shortNames:
      - db
  ---
  apiVersion: example.com/v1
  kind: Database
  metadata:
    name: orders-db
  spec:
    engine: postgres
    replicas: 2
  ```
- **Common Mistakes:** Omitting `plural` in `names`, which causes CRD validation rejection.
- **Troubleshooting:** If `kubectl explain` fails, check if the CRD version has `served: true`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete crd databases.example.com
  ```

---

## LAB 11: ServiceAccount Token Projection & Expiration Tuning
- **Difficulty:** Intermediate
- **Estimated Duration:** 8 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Configure a Pod with projected time-bound ServiceAccount tokens and custom audience claims.
- **Prerequisites:** Cluster running v1.24+.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** ServiceAccount `vault-auth-sa` exists.
- **Task Description:**
  1. Create a ServiceAccount named `vault-auth-sa` in `default`.
  2. Create a Pod `vault-client` running `alpine` that mounts a projected ServiceAccount token at `/var/run/secrets/tokens/vault-token`.
  3. Configure token expiration to 7200 seconds and audience to `vault.hashicorp.internal`.
  4. Inspect the token from inside the running Pod container.
- **Constraints:** Do not use legacy static Secret tokens.
- **Hints:** Use `spec.volumes[*].projected.sources[*].serviceAccountToken`.
- **Expected Result:** The token file exists inside the container and can be read.
- **Verification:**
  ```bash
  kubectl exec vault-client -- ls -la /var/run/secrets/tokens/vault-token
  ```
- **Full Solution:**
  ```bash
  kubectl create serviceaccount vault-auth-sa
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: vault-client
  spec:
    serviceAccountName: vault-auth-sa
    containers:
    - name: client
      image: alpine
      command: ["sleep", "3600"]
      volumeMounts:
      - mountPath: /var/run/secrets/tokens
        name: vault-token-vol
    volumes:
    - name: vault-token-vol
      projected:
        sources:
        - serviceAccountToken:
            path: vault-token
            expirationSeconds: 7200
            audience: vault.hashicorp.internal
  ```
- **Common Mistakes:** Omitting `expirationSeconds` or setting it below 600 seconds (minimum is 10 minutes).
- **Troubleshooting:** If container fails with mount error, check Pod events with `kubectl describe pod vault-client`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod vault-client
  kubectl delete serviceaccount vault-auth-sa
  ```

---

## LAB 12: Certificate Expiration Audit and Manual Renewal
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Inspect expiration dates of all control plane TLS certificates and execute targeted renewals using `kubeadm`.
- **Prerequisites:** SSH access to control plane node with sudo privileges.
- **Cluster Environment:** `kubeadm` single or multi-master cluster.
- **Initial State:** Cluster certificates in `/etc/kubernetes/pki/`.
- **Task Description:**
  1. Inspect the expiration of all certificates on the control plane node.
  2. Identify the expiration date of `apiserver-kubelet-client.crt`.
  3. Manually renew strictly the `apiserver-kubelet-client` certificate without renewing all certs.
  4. Verify the renewed expiration date has moved 1 year into the future.
- **Constraints:** Do not break API server connectivity.
- **Hints:** Use `kubeadm certs check-expiration` and `kubeadm certs renew <cert-name>`.
- **Expected Result:** `apiserver-kubelet-client` certificate shows renewed 1-year validity.
- **Verification:**
  ```bash
  sudo kubeadm certs check-expiration | grep apiserver-kubelet-client
  ```
- **Full Solution:**
  ```bash
  # Check expiration
  sudo kubeadm certs check-expiration

  # Renew single cert
  sudo kubeadm certs renew apiserver-kubelet-client

  # Verify
  sudo kubeadm certs check-expiration | grep apiserver-kubelet-client
  ```
- **Common Mistakes:** Running `kubeadm certs renew all` when the task explicitly asked for a single certificate renewal.
- **Troubleshooting:** If the certificate does not update, ensure the command was executed with `sudo`.
- **Cleanup Instructions:** None.

---

## LAB 13: High Availability Control Plane Sizing and Quorum Calculation
- **Difficulty:** Intermediate
- **Estimated Duration:** 8 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Calculate exact etcd quorum boundaries, fault tolerances, and control plane load balancer requirements for production HA clusters.
- **Prerequisites:** Conceptual understanding of Raft consensus.
- **Cluster Environment:** Paper / CLI scenario.
- **Initial State:** Cluster sizing inquiry.
- **Task Description:**
  1. Create a script or manifest documenting the sizing requirements for an HA cluster designed to survive the simultaneous failure of 2 etcd nodes.
  2. Determine minimum etcd node count, quorum number, and failure tolerance.
  3. Author a ConfigMap named `ha-cluster-specs` in `kube-system` containing keys: `etcd_nodes`, `quorum_needed`, `tolerated_failures`.
- **Constraints:** Quorum formula $\lfloor N/2 \rfloor + 1$ must be strictly adhered to.
- **Hints:** To survive 2 failures, $N=5$, because Quorum $= \lfloor 5/2 \rfloor + 1 = 3$. ($5 - 2 = 3$).
- **Expected Result:** ConfigMap reflects accurate distributed consensus topology.
- **Verification:**
  ```bash
  kubectl get configmap ha-cluster-specs -n kube-system -o yaml
  ```
- **Full Solution:**
  ```bash
  kubectl create configmap ha-cluster-specs -n kube-system \
    --from-literal=etcd_nodes=5 \
    --from-literal=quorum_needed=3 \
    --from-literal=tolerated_failures=2
  ```
- **Common Mistakes:** Assuming a 4-node etcd cluster provides more fault tolerance than a 3-node cluster (both tolerate only 1 failure, but 4-node has higher risk of split-brain).
- **Troubleshooting:** Recheck Raft odd-number quorum rules.
- **Cleanup Instructions:**
  ```bash
  kubectl delete configmap ha-cluster-specs -n kube-system
  ```

---

## LAB 14: Containerd Socket & Cgroup Driver Alignment
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Verify and enforce `SystemdCgroup = true` in `/etc/containerd/config.toml` to prevent kubelet cgroup panic.
- **Prerequisites:** SSH access to a worker node.
- **Cluster Environment:** Node running containerd.
- **Initial State:** Default or unverified containerd configuration.
- **Task Description:**
  1. Inspect `/etc/containerd/config.toml` on `worker-1`.
  2. Ensure `SystemdCgroup` is set to `true` under `runc.options`.
  3. Restart `containerd` and `kubelet`.
  4. Verify using `crictl info` that the runtime endpoint is active and reports healthy.
- **Constraints:** Do not corrupt the TOML syntax.
- **Hints:** If `/etc/containerd/config.toml` is empty or missing, generate defaults with `containerd config default`.
- **Expected Result:** `containerd` and `kubelet` running cleanly with systemd cgroups.
- **Verification:**
  ```bash
  sudo crictl info | jq .status.conditions
  sudo systemctl is-active kubelet
  # Expected: active
  ```
- **Full Solution:**
  ```bash
  sudo mkdir -p /etc/containerd
  containerd config default | sudo tee /etc/containerd/config.toml
  sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
  sudo systemctl restart containerd
  sudo systemctl restart kubelet
  ```
- **Common Mistakes:** Editing the wrong `[plugins."io.containerd.grpc.v1.cri"...]` block.
- **Troubleshooting:** If containerd fails to restart, run `sudo containerd config dump` to find the exact line with the TOML syntax error.
- **Cleanup Instructions:** None.

---

## LAB 15: Static Pod Provisioning on Specific Worker Node
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Cluster Architecture, Installation & Configuration (25%)
- **Learning Objective:** Provision a static Pod on a worker node by directly placing a manifest in the kubelet's static pod path.
- **Prerequisites:** SSH access to `worker-1`.
- **Cluster Environment:** Multi-node cluster.
- **Initial State:** Kubelet running on `worker-1`.
- **Task Description:**
  1. Inspect `/var/lib/kubelet/config.yaml` on `worker-1` to locate `staticPodPath`.
  2. If `staticPodPath` is not defined, add `staticPodPath: /etc/kubernetes/manifests` and restart `kubelet`.
  3. Place a Pod manifest `worker-monitor.yaml` in `/etc/kubernetes/manifests/` running `busybox:1.36` sleeping 3600.
  4. On the control plane, verify the mirror pod `worker-monitor-worker-1` appears in `kubectl get pods`.
- **Constraints:** Do not use `kubectl create` or `kubectl apply` to launch the Pod.
- **Hints:** Static pods are named `<pod-name>-<node-name>`.
- **Expected Result:** Mirror pod is visible to the API server in `Running` status.
- **Verification:**
  ```bash
  kubectl get pods -A | grep worker-monitor
  ```
- **Full Solution:**
  ```bash
  # On worker-1:
  sudo mkdir -p /etc/kubernetes/manifests
  # Verify /var/lib/kubelet/config.yaml has staticPodPath: /etc/kubernetes/manifests
  cat <<EOF | sudo tee /etc/kubernetes/manifests/worker-monitor.yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: worker-monitor
  spec:
    containers:
    - name: monitor
      image: busybox:1.36
      command: ["sleep", "3600"]
  EOF

  # If needed, restart kubelet:
  sudo systemctl restart kubelet

  # On Control Plane:
  kubectl get pods | grep worker-monitor
  ```
- **Common Mistakes:** Attempting to delete the mirror pod via `kubectl delete pod`; it will immediately be recreated by the worker's kubelet until the file is deleted from disk!
- **Troubleshooting:** If mirror pod does not appear, check `journalctl -u kubelet -e` on `worker-1`.
- **Cleanup Instructions:**
  ```bash
  # On worker-1:
  sudo rm -f /etc/kubernetes/manifests/worker-monitor.yaml
  ```
