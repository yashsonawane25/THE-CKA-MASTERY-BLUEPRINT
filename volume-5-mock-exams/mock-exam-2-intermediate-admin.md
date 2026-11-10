# VOLUME V: THE CKA MOCK EXAMINATION SYSTEM
# MOCK EXAM 2: INTERMEDIATE CLUSTER ADMINISTRATION SIMULATION

---

## EXAMINATION SPECIFICATIONS
- **Target Difficulty:** Intermediate Administration
- **Time Allowed:** 120 minutes (2.0 hours)
- **Passing Score:** 66% (Total: 100%)
- **Number of Tasks:** 18 Performance-Based Tasks
- **Focus:** Cluster lifecycle, kubeadm, storage, traffic management, and workload administration.

---

## TASK 1: Upgrade Control Plane via Kubeadm (Weight: 9%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Primary control plane node `cp-node` running Kubernetes v1.30.2.
- **Task Description:**
  1. Upgrade `kubeadm` package to version `1.31.2-1.1`.
  2. Plan and apply the upgrade using `kubeadm upgrade apply v1.31.2`.
  3. Drain `cp-node`.
  4. Upgrade `kubelet` and `kubectl` to `1.31.2-1.1`.
  5. Restart `kubelet` and uncordon `cp-node`.
- **Expected Final Condition:** Control plane node shows version `v1.31.2` in `Ready` status.
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

## TASK 2: Upgrade Worker Node via Kubeadm (Weight: 7%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Worker node `worker-1` running v1.30.2.
- **Task Description:**
  1. Drain `worker-1` from the control plane.
  2. SSH to `worker-1`.
  3. Upgrade `kubeadm` to `1.31.2-1.1`.
  4. Run `sudo kubeadm upgrade node`.
  5. Upgrade `kubelet` and `kubectl` to `1.31.2-1.1`.
  6. Restart `kubelet` and uncordon from control plane.
- **Expected Final Condition:** `worker-1` runs `v1.31.2` in `Ready` status.
- **Solution:**
  ```bash
  kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data
  ssh worker-1
  sudo apt-mark unhold kubeadm
  sudo apt-get update && sudo apt-get install -y kubeadm=1.31.2-1.1
  sudo apt-mark hold kubeadm
  sudo kubeadm upgrade node
  sudo apt-mark unhold kubelet kubectl
  sudo apt-get install -y kubelet=1.31.2-1.1 kubectl=1.31.2-1.1
  sudo apt-mark hold kubelet kubectl
  sudo systemctl daemon-reload && sudo systemctl restart kubelet
  exit
  kubectl uncordon worker-1
  ```

---

## TASK 3: Cluster Certificate Inspection & Renewal (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Certificates in `/etc/kubernetes/pki/`.
- **Task Description:**
  1. Check expiration of all certificates using `kubeadm`.
  2. Renew `apiserver` certificate specifically.
  3. Verify the certificate validity is extended by 1 year.
- **Expected Final Condition:** `apiserver` cert shows updated expiration date.
- **Solution:**
  ```bash
  sudo kubeadm certs check-expiration
  sudo kubeadm certs renew apiserver
  ```

---

## TASK 4: StatefulSet with VolumeClaimTemplates (Weight: 7%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `db-prod`.
- **Task Description:**
  1. Create namespace `db-prod`.
  2. Create Headless Service `mongo-hs` on port 27017.
  3. Create StatefulSet `mongo` with 2 replicas running `mongo:6.0`.
  4. Configure `volumeClaimTemplates` requesting 1Gi on storageClassName `standard` mounted at `/data/db`.
- **Expected Final Condition:** Pods `mongo-0` and `mongo-1` running with dedicated PVCs.
- **Solution:**
  ```yaml
  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: mongo
    namespace: db-prod
  spec:
    serviceName: mongo-hs
    replicas: 2
    selector:
      matchLabels:
        app: mongo
    template:
      metadata:
        labels:
          app: mongo
      spec:
        containers:
        - name: mongo
          image: mongo:6.0
          volumeMounts:
          - name: data
            mountPath: /data/db
    volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ "ReadWriteOnce" ]
        storageClassName: standard
        resources:
          requests:
            storage: 1Gi
  ```

---

## TASK 5: Ingress with TLS Secret Termination (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** TLS cert `/tmp/tls.crt` and key `/tmp/tls.key`. Service `web-svc` on port 80.
- **Task Description:**
  1. Create TLS Secret `web-tls` from cert and key files.
  2. Create Ingress `tls-ingress` terminating TLS for `secure.company.com` routing to `web-svc:80`.
- **Expected Final Condition:** Ingress configured with TLS termination.
- **Solution:**
  ```bash
  kubectl create secret tls web-tls --cert=/tmp/tls.crt --key=/tmp/tls.key
  ```
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: tls-ingress
  spec:
    ingressClassName: nginx
    tls:
    - hosts:
      - secure.company.com
      secretName: web-tls
    rules:
    - host: secure.company.com
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: web-svc
              port:
                number: 80
  ```

---

## TASK 6: Gateway API Canary Traffic Split (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Gateway `app-gateway` exists in `ingress-gw`.
- **Task Description:**
  1. In namespace `default`, create `HTTPRoute` named `split-route` attached to parent Gateway `app-gateway` in namespace `ingress-gw`.
  2. Route hostname `api.company.com`.
  3. Route 80% traffic to Service `api-v1` on port 80, and 20% traffic to Service `api-v2` on port 80.
- **Expected Final Condition:** HTTPRoute reports `Accepted: True`.
- **Solution:**
  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: split-route
    namespace: default
  spec:
    parentRefs:
    - name: app-gateway
      namespace: ingress-gw
    hostnames:
    - "api.company.com"
    rules:
    - backendRefs:
      - name: api-v1
        port: 80
        weight: 80
      - name: api-v2
        port: 80
        weight: 20
  ```

---

## TASK 7: StorageClass with WaitForFirstConsumer (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Default storage provisioner active.
- **Task Description:**
  1. Create StorageClass `topology-sc` with `volumeBindingMode: WaitForFirstConsumer` and `reclaimPolicy: Delete`.
  2. Create PVC `topo-pvc` requesting 2Gi on `topology-sc`.
  3. Verify PVC remains in `Pending` until consumed by a pod.
- **Expected Final Condition:** PVC stays Pending with `WaitForFirstConsumer` condition.
- **Solution:**
  ```yaml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: topology-sc
  provisioner: rancher.io/local-path
  volumeBindingMode: WaitForFirstConsumer
  reclaimPolicy: Delete
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: topo-pvc
  spec:
    storageClassName: topology-sc
    accessModes: [ "ReadWriteOnce" ]
    resources:
      requests:
        storage: 2Gi
  ```

---

## TASK 8: Helm Release Lifecycle and Override (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Helm installed.
- **Task Description:**
  1. Add repo `bitnami` (`https://charts.bitnami.com/bitnami`).
  2. Install release `web-prod` using chart `bitnami/nginx` into namespace `production`.
  3. Override replica count to `3` using `--set replicaCount=3`.
- **Expected Final Condition:** Release `web-prod` deployed with 3 pods.
- **Solution:**
  ```bash
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm repo update
  helm install web-prod bitnami/nginx -n production --create-namespace --set replicaCount=3
  ```

---

## TASK 9: Declarative Kustomize Deployment (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Kustomize directory `/opt/k8s/overlays/dev/`.
- **Task Description:**
  1. Inspect `/opt/k8s/overlays/dev/kustomization.yaml`.
  2. Apply the kustomization directly to the cluster without intermediate files.
- **Expected Final Condition:** All resources rendered and applied in target namespace.
- **Solution:**
  ```bash
  kubectl apply -k /opt/k8s/overlays/dev/
  ```

---

## TASK 10: Pod PriorityClass and Preemption (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `default`.
- **Task Description:**
  1. Create a `PriorityClass` named `critical-tier` with value `1000000` and `preemptionPolicy: PreemptLowerPriority`.
  2. Deploy Pod `core-auth` using `priorityClassName: critical-tier`.
- **Expected Final Condition:** Pod runs with priority class `critical-tier`.
- **Solution:**
  ```yaml
  apiVersion: scheduling.k8s.io/v1
  kind: PriorityClass
  metadata:
    name: critical-tier
  value: 1000000
  preemptionPolicy: PreemptLowerPriority
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: core-auth
  spec:
    priorityClassName: critical-tier
    containers:
    - name: auth
      image: alpine
      command: ["sleep", "3600"]
  ```

---

## TASK 11: Horizontal Pod Autoscaler (HPA) (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Deployment `api-worker` has CPU requests defined.
- **Task Description:**
  1. Configure an HPA named `api-worker-hpa` targeting Deployment `api-worker`.
  2. Min replicas: `2`, Max replicas: `10`, Target CPU utilization: `70%`.
- **Expected Final Condition:** HPA active and tracking metric utilization.
- **Solution:**
  ```bash
  kubectl autoscale deployment api-worker --name=api-worker-hpa --cpu-percent=70 --min=2 --max=10
  ```

---

## TASK 12: Interlocking ResourceQuota and LimitRange (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `dev-team`.
- **Task Description:**
  1. Create namespace `dev-team`.
  2. Create ResourceQuota `team-quota` with `hard.pods: "5"` and `hard.requests.cpu: "2"`.
  3. Create LimitRange `team-limit` with container defaultRequest `cpu: 100m` and default `cpu: 200m`.
- **Expected Final Condition:** LimitRange injects defaults and satisfies quota automatically.
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: ResourceQuota
  metadata:
    name: team-quota
    namespace: dev-team
  spec:
    hard:
      pods: "5"
      requests.cpu: "2"
  ---
  apiVersion: v1
  kind: LimitRange
  metadata:
    name: team-limit
    namespace: dev-team
  spec:
    limits:
    - default:
        cpu: 200m
      defaultRequest:
        cpu: 100m
      type: Container
  ```

---

## TASK 13: Native Sidecar in InitContainers (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `default`.
- **Task Description:**
  1. Author Pod `sidecar-app` with an initContainer `log-shipper` (`busybox:1.36`, `command: ["sleep", "3600"]`) and `restartPolicy: Always`.
  2. Main container `web` running `nginx:1.27`.
  3. Verify both containers run concurrently (`2/2`).
- **Expected Final Condition:** Pod shows `READY: 2/2`.
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: sidecar-app
  spec:
    initContainers:
    - name: log-shipper
      image: busybox:1.36
      command: ["sleep", "3600"]
      restartPolicy: Always
    containers:
    - name: web
      image: nginx:1.27
  ```

---

## TASK 14: NetworkPolicy Cross-Namespace Filtering (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `db-space`.
- **Task Description:**
  1. In namespace `db-space`, create NetworkPolicy `allow-web-ns` selecting pods `role=mysql`.
  2. Allow Ingress on port 3306 strictly from namespaces labeled `access=granted`.
- **Expected Final Condition:** Traffic to port 3306 is allowed only from namespaces labeled `access=granted`.
- **Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: allow-web-ns
    namespace: db-space
  spec:
    podSelector:
      matchLabels:
        role: mysql
    policyTypes:
    - Ingress
    ingress:
    - from:
      - namespaceSelector:
          matchLabels:
            access: granted
      ports:
      - protocol: TCP
        port: 3306
  ```

---

## TASK 15: Troubleshoot Empty Service Endpoints (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Service `web-svc` has `ENDPOINTS: <none>`.
- **Task Description:**
  1. Identify why Service `web-svc` in `default` has no endpoints.
  2. Fix the label selector so endpoints reflect the running pods.
- **Expected Final Condition:** Service endpoints are populated.
- **Solution:**
  ```bash
  kubectl get svc web-svc -o yaml
  kubectl get pods --show-labels
  # Change selector in Service to match pod labels
  kubectl patch svc web-svc -p '{"spec":{"selector":{"app":"frontend"}}}'
  ```

---

## TASK 16: Troubleshoot ImagePullBackOff (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pod `broken-pull` showing `ImagePullBackOff`.
- **Task Description:**
  1. Inspect pod events.
  2. Fix typo in image tag (`nginx:1.277` $\to$ `nginx:1.27`).
- **Expected Final Condition:** Pod transitions to `Running`.
- **Solution:**
  ```bash
  kubectl set image pod broken-pull broken-pull=nginx:1.27
  ```

---

## TASK 17: Containerd Low-Level Process Inspection (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Worker node `worker-1`.
- **Task Description:**
  1. SSH to `worker-1`.
  2. Use `crictl` to list all running containers.
  3. Extract container ID of the `kube-proxy` container and output logs to `/tmp/proxy.log`.
- **Expected Final Condition:** `/tmp/proxy.log` contains containerd runtime logs.
- **Solution:**
  ```bash
  ssh worker-1
  sudo crictl ps --name=kube-proxy
  CID=$(sudo crictl ps --name=kube-proxy -q)
  sudo crictl logs $CID > /tmp/proxy.log
  ```

---

## TASK 18: Extract Pod Restart Counts Sorted with JSONPath (Weight: 3%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `kube-system`.
- **Task Description:**
  1. Sort all pods in `kube-system` by `.status.containerStatuses[0].restartCount`.
  2. Write Pod names and restart counts to `/opt/restarts.txt`.
- **Expected Final Condition:** Tabular text file sorted by restart frequency.
- **Solution:**
  ```bash
  kubectl get pods -n kube-system --sort-by='.status.containerStatuses[0].restartCount' -o custom-columns=NAME:.metadata.name,RESTARTS:'.status.containerStatuses[0].restartCount' > /opt/restarts.txt
  ```
