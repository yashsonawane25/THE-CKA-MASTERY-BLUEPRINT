# VOLUME V: THE CKA MOCK EXAMINATION SYSTEM
# MOCK EXAM 4: FULL PROCTORED CERTIFICATION SIMULATION

---

## EXAMINATION SPECIFICATIONS
- **Target Difficulty:** Full Proctored Certification Simulation (Realistic Exam Replica)
- **Time Allowed:** 120 minutes (2.0 hours)
- **Passing Score:** 66% (Total: 100%)
- **Number of Tasks:** 20 Performance-Based Tasks
- **Domain Weighting Alignment:**
  - Troubleshooting: 30% (Tasks 1, 2, 3, 4, 5, 6)
  - Cluster Architecture, Installation & Configuration: 25% (Tasks 7, 8, 9, 10, 11)
  - Services & Networking: 20% (Tasks 12, 13, 14, 15)
  - Workloads & Scheduling: 15% (Tasks 16, 17, 18)
  - Storage: 10% (Tasks 19, 20)

---

## TASK 1: Troubleshoot and Repair a NotReady Node (Weight: 6%)
- **Domain:** Troubleshooting (30%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Worker node `node-2` is in `NotReady` status.
- **Task Description:**
  1. Switch to context `k8s`.
  2. SSH to `node-2`.
  3. Identify why `kubelet` is in auto-restart loop.
  4. Fix configuration and ensure `node-2` returns to `Ready` status.
- **Expected Final Condition:** `kubectl get nodes` shows `node-2` in `Ready` status.
- **Solution:**
  ```bash
  kubectl config use-context k8s
  ssh node-2
  sudo journalctl -u kubelet -n 30 --no-pager
  # Identify issue: cgroup driver or swap
  sudo swapoff -a
  sudo systemctl restart kubelet
  exit
  kubectl get nodes node-2
  ```

---

## TASK 2: Control Plane Static Pod Kube-Controller-Manager Failure (Weight: 5%)
- **Domain:** Troubleshooting (30%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** ReplicaSets are not creating pods; KCM is dead.
- **Task Description:**
  1. Inspect `/etc/kubernetes/manifests/kube-controller-manager.yaml`.
  2. Correct invalid certificate path flag.
  3. Verify controller manager static pod restarts cleanly.
- **Expected Final Condition:** KCM is running and reconciles pending deployments.
- **Solution:**
  ```bash
  sudo sed -i 's|/etc/kubernetes/pki/ca-broken.crt|/etc/kubernetes/pki/ca.crt|g' /etc/kubernetes/manifests/kube-controller-manager.yaml
  ```

---

## TASK 3: Triage CrashLoopBackOff Pod with Previous Logs (Weight: 5%)
- **Domain:** Troubleshooting (30%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pod `auth-engine` in namespace `auth` in `CrashLoopBackOff`.
- **Task Description:**
  1. Inspect previous container logs.
  2. Fix missing environment variable `AUTH_KEY`.
- **Expected Final Condition:** Pod is `Running` with 0 restarts.
- **Solution:**
  ```bash
  kubectl logs auth-engine -n auth --previous
  kubectl set env pod auth-engine AUTH_KEY="production-secret" -n auth
  ```

---

## TASK 4: Repair CoreDNS Loop Panic (Weight: 5%)
- **Domain:** Troubleshooting (30%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** CoreDNS pods crashing with loop detection.
- **Task Description:**
  1. Configure kubelet on control plane to reference `/run/systemd/resolve/resolv.conf`.
  2. Restart kubelet and delete crashed CoreDNS pods.
- **Expected Final Condition:** CoreDNS pods show `2/2 Running`.
- **Solution:**
  ```bash
  sudo sed -i 's|resolvConf: .*|resolvConf: /run/systemd/resolve/resolv.conf|g' /var/lib/kubelet/config.yaml
  sudo systemctl restart kubelet
  kubectl delete pods -n kube-system -l k8s-app=kube-dns
  ```

---

## TASK 5: Ingress Returns HTTP 503 (Missing Service Selector) (Weight: 5%)
- **Domain:** Troubleshooting (30%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Ingress returns 503; backend Service has empty endpoints.
- **Task Description:**
  1. Fix the selector on Service `catalog-svc` to match application pods.
- **Expected Final Condition:** Ingress routes traffic cleanly.
- **Solution:**
  ```bash
  kubectl patch svc catalog-svc -p '{"spec":{"selector":{"app":"catalog"}}}'
  ```

---

## TASK 6: Triage Multi-Attach Volume Lock (Weight: 4%)
- **Domain:** Troubleshooting (30%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pod stuck in `ContainerCreating` with `Multi-Attach error`.
- **Task Description:**
  1. Inspect `VolumeAttachment` objects.
  2. Force delete the stuck old pod or delete the stale `VolumeAttachment`.
- **Expected Final Condition:** New pod mounts the volume and starts running.
- **Solution:**
  ```bash
  kubectl get volumeattachments
  kubectl delete volumeattachment <stale-attachment-id>
  ```

---

## TASK 7: Kubeadm Control Plane Upgrade (Weight: 7%)
- **Domain:** Cluster Architecture (25%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Primary control plane node at v1.30.2.
- **Task Description:**
  1. Upgrade `kubeadm` to `1.31.2-1.1`.
  2. Apply upgrade: `kubeadm upgrade apply v1.31.2`.
  3. Drain node, upgrade `kubelet` and `kubectl`, restart `kubelet`, uncordon.
- **Expected Final Condition:** Control plane node running `v1.31.2`.
- **Solution:**
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
  sudo systemctl daemon-reload && sudo systemctl restart kubelet
  kubectl uncordon $(hostname)
  ```

---

## TASK 8: etcd Snapshot Save and Status Verification (Weight: 6%)
- **Domain:** Cluster Architecture (25%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Healthy etcd listening on port 2379.
- **Task Description:**
  1. Capture etcd snapshot to `/var/data/etcd-final-mock.db`.
  2. Output table status to verify non-zero size and revision.
- **Expected Final Condition:** Snapshot file created and verified.
- **Solution:**
  ```bash
  sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
    snapshot save /var/data/etcd-final-mock.db
  ```

---

## TASK 9: RBAC Role and RoleBinding with Specific Verbs (Weight: 4%)
- **Domain:** Cluster Architecture (25%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `operations`.
- **Task Description:**
  1. Create ServiceAccount `deployer` in `operations`.
  2. Create Role `deploy-role` allowing `create`, `update`, `patch` on `deployments.apps`.
  3. Bind Role to ServiceAccount.
- **Expected Final Condition:** `deployer` can mutate deployments in `operations`.
- **Solution:**
  ```bash
  kubectl create namespace operations
  kubectl create serviceaccount deployer -n operations
  kubectl create role deploy-role -n operations --verb=create,update,patch --resource=deployments.apps
  kubectl create rolebinding bind-deployer -n operations --role=deploy-role --serviceaccount=operations:deployer
  ```

---

## TASK 10: Deploy Application via Helm (Weight: 4%)
- **Domain:** Cluster Architecture (25%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Chart repo `bitnami` added.
- **Task Description:**
  1. Install release `web-cache` using chart `bitnami/memcached` into namespace `cache`.
  2. Set replica count to `2`.
- **Expected Final Condition:** Release `web-cache` running in namespace `cache`.
- **Solution:**
  ```bash
  helm install web-cache bitnami/memcached -n cache --create-namespace --set replicaCount=2
  ```

---

## TASK 11: Declarative Kustomize Directory Application (Weight: 4%)
- **Domain:** Cluster Architecture (25%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Directory `/opt/deploy/overlays/prod/`.
- **Task Description:**
  1. Apply Kustomize directory `/opt/deploy/overlays/prod/` to the cluster.
- **Expected Final Condition:** Resources deployed with production labels.
- **Solution:**
  ```bash
  kubectl apply -k /opt/deploy/overlays/prod/
  ```

---

## TASK 12: Gateway API HTTPRoute Traffic Management (Weight: 6%)
- **Domain:** Services & Networking (20%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Gateway `edge-gw` exists in `gw-system`.
- **Task Description:**
  1. In namespace `sales`, create `HTTPRoute` named `sales-route` attached to `edge-gw`.
  2. Route path `/checkout` to Service `checkout-svc` on port 8080.
- **Expected Final Condition:** HTTPRoute reports `Accepted: True`.
- **Solution:**
  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: sales-route
    namespace: sales
  spec:
    parentRefs:
    - name: edge-gw
      namespace: gw-system
    rules:
    - matches:
      - path:
          type: PathPrefix
          value: /checkout
      backendRefs:
      - name: checkout-svc
        port: 8080
  ```

---

## TASK 13: Ingress with TLS Termination (Weight: 5%)
- **Domain:** Services & Networking (20%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Secret `tls-cert` exists. Service `app-svc` on port 80.
- **Task Description:**
  1. Author Ingress `app-ingress` with TLS terminating for `app.company.io` using Secret `tls-cert`.
- **Expected Final Condition:** Ingress created with TLS configuration.
- **Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: app-ingress
  spec:
    ingressClassName: nginx
    tls:
    - hosts:
      - app.company.io
      secretName: tls-cert
    rules:
    - host: app.company.io
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: app-svc
              port:
                number: 80
  ```

---

## TASK 14: NetworkPolicy Default-Deny with Port 53 Egress (Weight: 5%)
- **Domain:** Services & Networking (20%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `locked-ns`.
- **Task Description:**
  1. In namespace `locked-ns`, create NetworkPolicy denying all ingress, and allowing egress strictly on port 53 (UDP/TCP).
- **Expected Final Condition:** All ingress dropped; DNS egress permitted.
- **Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: lock-and-dns
    namespace: locked-ns
  spec:
    podSelector: {}
    policyTypes:
    - Ingress
    - Egress
    egress:
    - ports:
      - protocol: UDP
        port: 53
      - protocol: TCP
        port: 53
  ```

---

## TASK 15: Expose Headless Service for StatefulSet (Weight: 4%)
- **Domain:** Services & Networking (20%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** StatefulSet `elastic` exists in `logging`.
- **Task Description:**
  1. Create headless Service `elastic-discovery` with `clusterIP: None` on port 9200.
- **Expected Final Condition:** Headless service resolves to individual StatefulSet Pod IPs.
- **Solution:**
  ```bash
  kubectl create service clusterip elastic-discovery --clusterip="None" --tcp=9200:9200 -n logging
  ```

---

## TASK 16: Rolling Update and Immediate Rollback (Weight: 5%)
- **Domain:** Workloads & Scheduling (15%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Deployment `api-fleet` running with 3 replicas.
- **Task Description:**
  1. Update image to `nginx:1.99-broken`.
  2. Observe rollout stall.
  3. Roll back immediately to the previous revision.
- **Expected Final Condition:** Deployment stabilized on healthy image.
- **Solution:**
  ```bash
  kubectl set image deployment/api-fleet nginx=nginx:1.99-broken
  kubectl rollout undo deployment/api-fleet
  ```

---

## TASK 17: Pod Anti-Affinity Spreading Across Nodes (Weight: 5%)
- **Domain:** Workloads & Scheduling (15%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Multi-node cluster.
- **Task Description:**
  1. Author Deployment `web-spread` with 2 replicas and `podAntiAffinity` requiring pods to land on distinct hostnames (`kubernetes.io/hostname`).
- **Expected Final Condition:** Each replica lands on a different worker node.
- **Solution:**
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: web-spread
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: web-spread
    template:
      metadata:
        labels:
          app: web-spread
      spec:
        affinity:
          podAntiAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - web-spread
              topologyKey: kubernetes.io/hostname
        containers:
        - name: nginx
          image: nginx:1.27
  ```

---

## TASK 18: ResourceQuota & Container LimitRange Configuration (Weight: 5%)
- **Domain:** Workloads & Scheduling (15%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `staging`.
- **Task Description:**
  1. Apply ResourceQuota `quota-staging` with `hard.pods: "4"`.
  2. Apply LimitRange `limit-staging` with default CPU request `50m` and limit `100m`.
- **Expected Final Condition:** Limits enforced automatically on new pods.
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: ResourceQuota
  metadata:
    name: quota-staging
    namespace: staging
  spec:
    hard:
      pods: "4"
  ---
  apiVersion: v1
  kind: LimitRange
  metadata:
    name: limit-staging
    namespace: staging
  spec:
    limits:
    - default:
        cpu: 100m
      defaultRequest:
        cpu: 50m
      type: Container
  ```

---

## TASK 19: PersistentVolume and PersistentVolumeClaim Binding (Weight: 5%)
- **Domain:** Storage (10%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Directory `/mnt/data/vol1` on worker node.
- **Task Description:**
  1. Create PV `pv-storage-1` of capacity 5Gi, accessMode `ReadWriteOnce`, storageClassName `local-vol`, hostPath `/mnt/data/vol1`.
  2. Create PVC `pvc-storage-1` requesting 2Gi on `local-vol`.
- **Expected Final Condition:** PV and PVC are `Bound`.
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: PersistentVolume
  metadata:
    name: pv-storage-1
  spec:
    capacity:
      storage: 5Gi
    accessModes: [ "ReadWriteOnce" ]
    storageClassName: local-vol
    hostPath:
      path: /mnt/data/vol1
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: pvc-storage-1
  spec:
    storageClassName: local-vol
    accessModes: [ "ReadWriteOnce" ]
    resources:
      requests:
        storage: 2Gi
  ```

---

## TASK 20: Online PVC Volume Expansion (Weight: 5%)
- **Domain:** Storage (10%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** PVC `expand-claim` bound at 1Gi.
- **Task Description:**
  1. Dynamically expand `expand-claim` from `1Gi` to `3Gi`.
- **Expected Final Condition:** PVC capacity shows `3Gi`.
- **Solution:**
  ```bash
  kubectl patch pvc expand-claim -p '{"spec":{"resources":{"requests":{"storage":"3Gi"}}}}'
  ```
